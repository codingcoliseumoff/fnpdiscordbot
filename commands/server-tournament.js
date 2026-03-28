const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-tournament')
    .setDescription('Admin-only command to start or manage server seasons.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => 
        option.setName('command')
        .setDescription('Tournament action')
        .addChoices(
            { name: 'Start Season', value: 'start' },
            { name: 'End Season', value: 'end' },
            { name: 'Reset Standings', value: 'reset' }
        )
    ),

  async execute(interaction) {
    const action = interaction.options.getString('command');
    await interaction.deferReply();

    try {
        const serverId = interaction.guildId;
        const tournament = await db.getCurrentTournament(serverId);

        if (action === 'start') {
            if (tournament && tournament.status === 'active') return interaction.editReply({ content: 'A season is already active in this server!' });
            await db.createTournament(serverId, 24); // 24 rounds season

            const seasonEmbed = new EmbedBuilder()
                .setTitle('🏁 New Tournament Season Started!')
                .setColor('#e74c3c')
                .setDescription(`The server **${interaction.guild.name}** has officially moved into the 2026 season cycle! All races will contribute to the server-wide standings.`)
                .setImage('https://i.ibb.co/6803868/season-start.jpg') // Mock image
                .setFooter({ text: 'Season Cycle: 24 Rounds' });

            await interaction.editReply({ embeds: [seasonEmbed] });
        } else if (action === 'reset') {
            await db.resetTournament(serverId);
            await interaction.editReply({ content: '✅ Tournamet standings for this server have been reset.' });
        } else if (action === 'end') {
            await db.endTournament(serverId);
            await interaction.editReply({ content: '✅ The current season has come to an end.' });
        }
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error managing tournament.' });
    }
  }
};
