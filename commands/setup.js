const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Take over a real F1 team!')
    .addStringOption(option => 
        option.setName('custom-name')
            .setDescription('Optional: Give your team a custom name')
            .setRequired(false)
    )
    .addStringOption(option => 
        option.setName('replace')
            .setDescription('Which default team to replace (optional)')
            .setRequired(false)
            .setAutocomplete(true)
    ),
  
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const fs = require('fs');
    const path = require('path');
    const teams = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/teams.json'), 'utf8'));
    
    const filtered = teams
        .filter(team => team.name.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25);
        
    await interaction.respond(
        filtered.map(team => ({ name: `${team.name} (Tier ${team.tier})`, value: team.id }))
    );
  },

  async execute(interaction) {
    const teamId = interaction.options.getString('team');
    const customName = interaction.options.getString('custom-name');
    const replaceId = interaction.options.getString('replace') || teamId;
    const userId = interaction.user.id;
    const username = interaction.user.username;

    await interaction.deferReply();

    const fs = require('fs');
    const path = require('path');
    const teamsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/teams.json'), 'utf8'));
    const driversData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/drivers.json'), 'utf8'));
    
    const selectedTeam = teamsData.find(t => t.id === teamId);
    if (!selectedTeam) return interaction.editReply({ content: 'Invalid team selected!' });

    try {
        await db.getUser(userId, username);
        const existingTeam = await db.getTeam(userId);

        if (existingTeam) {
            return interaction.editReply({ content: `You already own **${existingTeam.name}**! Use \`/manage\` to change details.` });
        }

        const finalName = customName || selectedTeam.name;

        // Initialize with custom or real team data
        const team = await db.createTeam(
            userId, 
            finalName, 
            selectedTeam.color, 
            replaceId, 
            selectedTeam.tier
        );
        
        const traits = ['Late Braker', 'Wet Specialist', 'Steady', 'Choker', 'Agile'];
        let recruited = [];
        if (customName) {
            const freeAgents = driversData.filter(d => !d.teamId || d.teamId === 'free_agent');
            const randomPick = freeAgents.sort(() => 0.5 - Math.random()).slice(0, 2);
            for (const d of randomPick) {
                await db.supabase.from('drivers').insert([{ 
                    id: d.id, 
                    team_id: team.id, 
                    name: d.name, 
                    stats: JSON.stringify(d.stats),
                    salary: 50000,
                    contract_laps: 50,
                    trait: traits[Math.floor(Math.random() * traits.length)]
                }]);
                recruited.push(d.name);
            }
        } else {
            const teamDrivers = driversData.filter(d => d.teamId === selectedTeam.id);
            for (const d of teamDrivers) {
                await db.supabase.from('drivers').insert([{ 
                    id: d.id, 
                    team_id: team.id, 
                    name: d.name, 
                    stats: JSON.stringify(d.stats),
                    salary: d.id === 'verstappen' ? 500000 : 100000,
                    contract_laps: 100,
                    trait: traits[Math.floor(Math.random() * traits.length)]
                }]);
                recruited.push(d.name);
            }
        }
        
        const { Renderer } = require('../utils/Renderer');
        const renderer = new Renderer();
        const buffer = await renderer.drawTeamInfo(team, username);
        const attachment = new AttachmentBuilder(buffer, { name: 'team_setup.png' });

        const setupEmbed = new EmbedBuilder()
            .setTitle(`🏎️ Team Profile: ${finalName}`)
            .setTimestamp();

        await interaction.editReply({ embeds: [setupEmbed], files: [attachment] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Something went wrong while setting up your team.' });
    }
  }
};
