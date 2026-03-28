const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Create your custom F1 team!')
    .addStringOption(option => option.setName('name').setDescription('Your team name').setRequired(true))
    .addStringOption(option => option.setName('color').setDescription('Team color hex code (e.g. #FF0000)').setRequired(true))
    .addStringOption(option => option.setName('website').setDescription('Website name for your logo').setRequired(true)),
  
  async execute(interaction) {
    const name = interaction.options.getString('name');
    const color = interaction.options.getString('color');
    const website = interaction.options.getString('website');
    const userId = interaction.user.id;
    const username = interaction.user.username;

    await interaction.deferReply();

    try {
        const user = await db.getUser(userId, username);
        const existingTeam = await db.getTeam(userId);

        if (existingTeam) {
            return interaction.editReply({ content: `You already own the **${existingTeam.name}**! Use \`/manage\` to change details.` });
        }

        const team = await db.createTeam(userId, name, color, website);
        
        const setupEmbed = new EmbedBuilder()
            .setTitle(`🏎️ Team Created: ${name}`)
            .setColor(color)
            .setDescription(`Welcome to the grid, Principal **${username}**!\n\nYour team has been initialized with baseline stats. You can now use \`/race\` to start your first session or \`/manage\` to upgrade your car.`)
            .addFields(
                { name: 'Stats', value: 'Aero: 20 | Chassis: 20 | Engine: 20', inline: true },
                { name: 'Initial Budget', value: '$1,000,000', inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [setupEmbed] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Something went wrong while setting up your team. Make sure the database is ready.' });
    }
  }
};
