const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('standings')
    .setDescription('Show championship standings for different modes.')
    .addStringOption(option => 
        option.setName('mode')
        .setDescription('Standings category')
        .addChoices(
            { name: 'Server (Championship)', value: 'server' },
            { name: 'Global (Money)', value: 'global_money' },
            { name: 'Global (XP)', value: 'global_xp' }
        )
    ),

  async execute(interaction) {
    const mode = interaction.options.getString('mode') || 'server';
    await interaction.deferReply();

    try {
        if (mode === 'server') {
            const tournament = await db.getCurrentTournament(interaction.guildId);
            if (!tournament) return interaction.editReply({ content: 'No active championship in this server! Admin use `/server-tournament start` to begin.' });

            const standings = await db.supabase.from('server_standings').select('*').eq('tournament_id', tournament.id).order('points', { ascending: false }).limit(20);

            const lbEmbed = new EmbedBuilder()
                .setTitle(`🏆 Server Championship: SEASON ${tournament.id}`)
                .setColor('#f1c40f')
                .setDescription(standings.data.map((s, i) => `**${i+1}.** <@${s.user_id}> - **${s.points}** PTS`).join('\n') || "No points awarded yet!");

            await interaction.editReply({ embeds: [lbEmbed] });
        } else {
            const topUsers = await db.getLeaderboard(mode === 'global_money' ? 'money' : 'xp', 10);
            const { Renderer } = require('../utils/Renderer');
            const renderer = new Renderer();

            const buffer = await renderer.drawGlobalLeaderboard(topUsers, mode === 'global_money' ? 'money' : 'xp');
            const attachment = { attachment: buffer, name: 'leaderboard.png' };

            const lbEmbed = new EmbedBuilder()
                .setTitle(`🏆 Global Leaderboard: ${mode.toUpperCase().replace('GLOBAL_', '')}`)
                .setImage('attachment://leaderboard.png')
                .setColor('#f1c40f');

            await interaction.editReply({ embeds: [lbEmbed], files: [attachment] });
        }
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error fetching standings.' });
    }
  }
};
