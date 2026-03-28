const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { RaceEngine } = require('../engine/RaceEngine');
const { Renderer } = require('../utils/Renderer');
const { db } = require('../utils/Supabase');
const fs = require('fs');
const path = require('path');

const engine = new RaceEngine();
const renderer = new Renderer();

// Load real data
const teamsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/teams.json'), 'utf8'));
const driversData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/drivers.json'), 'utf8'));
const tracksData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/tracks.json'), 'utf8'));
const trackMapsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/trackMaps.json'), 'utf8'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('race')
    .setDescription('Start a session against AI.')
    .addStringOption(option => option.setName('type').setDescription('Select session type').setRequired(true)
        .addChoices(
            { name: 'Practice (Standalone)', value: 'Practice' },
            { name: 'Race Weekend (Full)', value: 'Weekend' }
        )
    )
    .addStringOption(option => option.setName('track').setDescription('Select a circuit').setRequired(true).setAutocomplete(true)),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const filtered = tracksData
        .filter(track => track.name.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25);
    await interaction.respond(filtered.map(track => ({ name: track.name, value: track.id })));
  },

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const trackId = interaction.options.getString('track');
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const userTeam = await db.getTeam(userId);

    if (!userTeam) return interaction.reply({ content: 'You do not own a team! Use `/setup` first.', ephemeral: true });

    const track = tracksData.find(t => t.id === trackId) || tracksData[0];
    await interaction.deferReply();

    const sessions = type === 'Practice' ? ['Practice'] : ['Practice', 'Q1', 'Q2', 'Q3', 'Race'];
    let currentView = 'leaderboard';
    
    // Store results across sessions
    let weekendResults = {
        grid: [],
        racePos: []
    };

    try {
        for (const sessionType of sessions) {
            const session = this.initSession(userTeam, sessionType, track);
            const teamDrivers = await db.getDrivers(userTeam.id);
            
            // --- STRATEGY SELECTION ---
            const strategyRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tyre_Soft').setLabel('Softs').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('tyre_Medium').setLabel('Mediums').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('tyre_Hard').setLabel('Hards').setStyle(ButtonStyle.Secondary)
            );
            
            await interaction.editReply({ 
                content: `🛠️ **Strategy Selection:** Principal **${username}**, choose starting tyres for ${track.name} (${sessionType})`, 
                components: [strategyRow], 
                embeds: [], 
                files: [] 
            });

            const stratCollector = (await interaction.fetchReply()).createMessageComponentCollector({ componentType: ComponentType.Button, time: 20000 });
            let chosenTyre = 'Medium';
            
            await new Promise((resolve) => {
                stratCollector.on('collect', async i => {
                    if (i.user.id !== userId) return i.reply({ content: 'Host only.', ephemeral: true });
                    chosenTyre = i.customId.split('_')[1];
                    await i.reply({ content: `✅ Strategy set to **${chosenTyre}**!`, ephemeral: true });
                    stratCollector.stop('chosen');
                });
                stratCollector.on('end', () => resolve());
            });

            // Apply tyre to user drivers
            session.competitors.forEach(c => {
                if (c.team.owner_user_id === userId) {
                    c.drivers.d1.tyreType = chosenTyre;
                    c.drivers.d2.tyreType = chosenTyre;
                }
            });

            const getEmbedProps = async (sess) => {
                const title = `${sessionType.toUpperCase()} - ${track.name.toUpperCase()} (LAP ${sess.lap}/${sess.totalLaps})`;
                const file = currentView === 'leaderboard' 
                    ? await renderer.drawLeaderboard(sess, title) 
                    : await renderer.drawTrackMap(sess, trackMapsData[track.id.toLowerCase()] || trackMapsData['silverstone'], title);
                
                const fileName = currentView === 'leaderboard' ? 'board.png' : 'map.png';
                return { 
                    embeds: [new EmbedBuilder().setTitle(`🏁 ${title}`).setImage(`attachment://${fileName}`).setColor(userTeam.color)], 
                    files: [new AttachmentBuilder(file, { name: fileName })] 
                };
            };

            const uiRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('toggle_view').setLabel('Toggle View').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('pitting_box').setLabel('BOX BOX!').setStyle(ButtonStyle.Danger)
            );

            await interaction.editReply({ content: `🎭 **Current Session:** ${sessionType.toUpperCase()} at ${track.name}`, components: [uiRow], ...await getEmbedProps(session) });
            
            const mainCollector = (await interaction.fetchReply()).createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });
            mainCollector.on('collect', async i => {
                if (i.user.id !== userId) return i.reply({ content: 'Host only.', ephemeral: true });
                if (i.customId === 'toggle_view') {
                    currentView = currentView === 'leaderboard' ? 'trackmap' : 'leaderboard';
                } else if (i.customId === 'pitting_box') {
                    session.competitors.forEach(c => {
                        if (c.team.owner_user_id === userId) {
                            c.drivers.d1.userPlannedStops = [{ lap: session.lap + 1, tyre: 'Hard' }]; // Simple pit logic
                            c.drivers.d2.userPlannedStops = [{ lap: session.lap + 2, tyre: 'Hard' }];
                        }
                    });
                    return i.reply({ content: '🔧 Crew ready. Box confirmed for next lap!', ephemeral: true });
                }
                await i.update(await getEmbedProps(session));
            });

            // Sim loop
            const laps = (sessionType === 'Race' ? 10 : 3);
            for (let l = 1; l <= laps; l++) {
                const updated = engine.processTick(session, 15);
                Object.assign(session, updated);
                try {
                    await interaction.editReply(await getEmbedProps(session));
                } catch (e) {
                    console.error("EditReply Error:", e);
                }
                await new Promise(r => setTimeout(r, 4000));
                if (session.competitors_sorted && session.competitors_sorted.every(d => d.status === 'Finished' || d.status === 'Retired')) break;
            }
            mainCollector.stop();

            // Save results and award points
            if (sessionType === 'Race') {
                const pointsMap = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
                let totalPoints = 0;
                let totalMoney = 0;

                session.competitors_sorted.forEach((d, idx) => {
                    if (d.driver.teamId === userTeam.id || d.driver.id.startsWith('bot_')) {
                        // Logic to identify user drivers
                    }
                    if (d.team?.owner_user_id === userId) {
                        const pts = pointsMap[idx] || 0;
                        totalPoints += pts;
                        totalMoney += (20 - idx) * 5000;
                    }
                });

                await db.updateMoney(userId, totalMoney);
                const tournament = await db.getCurrentTournament(interaction.guildId);
                if (tournament) {
                    // Update server standings
                    // ... (logic from before)
                }

                await interaction.followUp({ content: `🏁 **Race Finished!** Earned **$${totalMoney.toLocaleString()}** and **${totalPoints}** pts.` });
            } else if (sessionType === 'Q3') {
                weekendResults.grid = session.competitors_sorted.map(d => d.driver.id);
                await interaction.followUp({ content: `✅ **Qualifying Complete!** Grid set for the race.`, ephemeral: true });
            } else {
                await interaction.followUp({ content: `✅ **${sessionType} Finished!** Moving to next session...`, ephemeral: true });
            }
        }
    } catch (error) {
        console.error("Weekend Loop Error:", error);
        await interaction.followUp({ content: "⚠️ Session error.", ephemeral: true });
    }

    await interaction.followUp({ content: `🏆 **WEEKEND COMPLETE!**` });
  },

  initSession(userTeam, type, track) {
      return {
          track, lap: 0, totalLaps: type === 'Race' ? 10 : 3, weather: 'Dry',
          competitors: this.generateCompetitors(userTeam), sessionType: type, finishedDriverIds: []
      };
  },

  generateCompetitors(userTeam) {
      const otherTeams = teamsData.filter(t => t.id !== userTeam.id && t.tier === (userTeam.tier || 1)).slice(0, 9);
      return [userTeam, ...otherTeams].map(t => {
          const teamDrivers = driversData.filter(d => d.teamId === t.id).slice(0, 2);
          while (teamDrivers.length < 2) teamDrivers.push({ id: `bot_${t.id}_${teamDrivers.length}`, name: `Driver ${teamDrivers.length+1}`, stats: { pace: 60 } });
          return {
              team: t, engine: { power: 80 },
              drivers: {
                  d1: { driver: teamDrivers[0], position: 0, progress: 0, totalProgress: 0, tyreType: 'Medium', tyreCondition: 100, fuelLoad: 110, status: 'Racing', bestLapTime: 0, lap: 0 },
                  d2: { driver: teamDrivers[1], position: 0, progress: 0, totalProgress: 0, tyreType: 'Medium', tyreCondition: 100, fuelLoad: 110, status: 'Racing', bestLapTime: 0, lap: 0 }
              }
          };
      });
  }
};
