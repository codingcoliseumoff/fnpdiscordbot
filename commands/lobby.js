const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lobby')
    .setDescription('Create or join multiplayer lobbies for racing.')
    .addStringOption(option => option.setName('action').setDescription('Create or join a lobby').setRequired(true)
        .addChoices(
            { name: 'Create', value: 'create' },
            { name: 'Join', value: 'join' },
            { name: 'List', value: 'list' }
        )
    ),

  async execute(interaction) {
    const action = interaction.options.getString('action');
    await interaction.deferReply();

    try {
        const userId = interaction.user.id;
        const team = await db.getTeam(userId);
        if (!team) return interaction.editReply({ content: 'You do not own a team! Use `/setup` first.' });

        if (action === 'create') {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            await db.createLobby(code, userId, interaction.guildId);

            const lobbyEmbed = new EmbedBuilder()
                .setTitle(`🏁 Multiplayer Lobby: ${code}`)
                .setColor('#3498db')
                .setDescription(`Host: <@${userId}> team **${team.name}**\nInvite others to join using this code!`)
                .addFields(
                    { name: 'Status', value: 'Waiting for players...', inline: true },
                    { name: 'Current Entries', value: `1/${10}`, inline: true }
                )
                .setFooter({ text: 'Multiplayer Simulation Session' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`join_lobby_${code}`).setLabel('Join Lobby').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`start_lobby_${code}`).setLabel('Start Race').setStyle(ButtonStyle.Primary)
            );

            await interaction.editReply({ embeds: [lobbyEmbed], components: [row] });
        } else if (action === 'list') {
            const lobbies = await db.getLobbies(interaction.guildId);
            const listEmbed = new EmbedBuilder()
                .setTitle('📋 Active Lobbies')
                .setColor('#3498db');
            
            const description = lobbies.map(l => `**${l.code}** - Host: <@${l.host_id}> (${l.status})`).join('\n');
            listEmbed.setDescription(description || "No active lobbies in this server.");

            await interaction.editReply({ embeds: [listEmbed] });
        } else if (action === 'join') {
            await interaction.editReply({ 
                content: 'To join a lobby, use the "Join" button on a lobby embed or type the code in `/lobby join [code]` (Feature partially implemented)' 
            });
        }
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error managing lobby.' });
    }
  }
};
