const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { RaceEngine } = require('../engine/RaceEngine');
const { Renderer } = require('../utils/Renderer');
const { db } = require('../utils/Supabase');

const engine = new RaceEngine();
const renderer = new Renderer();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('race')
    .setDescription('Start a session: Practice, Q1-Q3, or the Grand Prix.')
    .addStringOption(option => option.setName('type').setDescription('Select session type').setRequired(true)
        .addChoices(
            { name: 'Practice', value: 'Practice' },
            { name: 'Qualifying', value: 'Qualifying' },
            { name: 'Race', value: 'Race' }
        )
    ),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const userId = interaction.user.id;
    const team = await db.getTeam(userId);

    if (!team) return interaction.reply({ content: 'You do not own a team! Use `/setup` first.', ephemeral: true });

    await interaction.deferReply();

    // Initialize mock session for demonstration (this would normally be fetched/built)
    const session = this.initSession(team, type);
    
    let message = await interaction.editReply({ content: `🎬 **Session START:** ${type.toUpperCase()} at Silverstone` });

    // Simple simulation loop (10 laps/ticks for demo)
    for (let lap = 1; lap <= 5; lap++) {
        const updated = engine.processTick(session, 90); // 90s lap
        Object.assign(session, updated);
        
        const buffer = await renderer.drawLeaderboard(session, `${type.toUpperCase()} - LAP ${lap}`);
        const attachment = new AttachmentBuilder(buffer, { name: 'leaderboard.png' });

        const embed = new EmbedBuilder()
            .setTitle(`🏁 ${type.toUpperCase()} - LAP ${lap}`)
            .setImage('attachment://leaderboard.png')
            .setColor(team.color)
            .setFooter({ text: `Perc Fermé Network • LIVE BROADCAST` });

        await interaction.editReply({ content: '', embeds: [embed], files: [attachment] });
        
        // Wait 3 seconds between "laps" for Discord
        await new Promise(r => setTimeout(r, 3000));
    }

    // Save results (logic for rewards, etc.)
    await interaction.followUp({ content: `✅ **Session COMPLETED!** Principal **${interaction.user.username}** earned points and money based on performance.` });
  },

  initSession(userTeam, type) {
      // Mocking 10 teams (1 user + 9 AI)
      const tracks = [{ id: 'silverstone', name: 'Silverstone', avgLapTimeSeconds: 90, tyreWearFactor: 1.0 }];
      const session = {
          track: tracks[0],
          lap: 0,
          totalLaps: type === 'Race' ? 52 : 10,
          weather: 'Dry',
          safetyCar: false,
          vsc: false,
          fastestLapTime: 0,
          competitors: this.generateCompetitors(userTeam),
          sessionType: type,
          trackGrip: 1.0
      };
      return session;
  },

  generateCompetitors(userTeam) {
      const teams = [userTeam];
      // Generate 9 AI teams
      for (let i = 1; i <= 9; i++) {
          teams.push({
              id: `ai_${i}`,
              name: `AI Team ${i}`,
              color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
              stats: { aero: 50 + Math.random()*20, chassis: 50 + Math.random()*20, pitCrew: 60, durability: 70 },
              engine: { power: 60, efficiency: 80, reliability: 80 }
          });
      }

      return teams.map(t => ({
          team: t,
          engine: t.engine || { power: 50, efficiency: 70, reliability: 80 },
          drivers: {
              d1: {
                  driver: { id: `d1_${t.id}`, name: `Driver 1 - ${t.name}`, stats: { pace: 60, consistency: 70, tyreManagement: 60 } },
                  position: 0, progress: 0, totalProgress: 0, tyreType: 'Medium', tyreCondition: 100, fuelLoad: 110, status: 'Racing', bestLapTime: 0, lap: 0, tyreHistory: ['M']
              },
              d2: {
                  driver: { id: `d2_${t.id}`, name: `Driver 2 - ${t.name}`, stats: { pace: 55, consistency: 65, tyreManagement: 55 } },
                  position: 0, progress: 0, totalProgress: 0, tyreType: 'Medium', tyreCondition: 100, fuelLoad: 110, status: 'Racing', bestLapTime: 0, lap: 0, tyreHistory: ['M']
              }
          }
      }));
  }
};
