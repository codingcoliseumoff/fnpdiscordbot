const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show global top list by money, XP, or prestige level.')
    .addStringOption(option => 
        option.setName('category')
        .setDescription('Sort by category')
        .addChoices(
            { name: 'Money', value: 'money' },
            { name: 'XP', value: 'xp' },
            { name: 'Prestige (History Points)', value: 'history_points' }
        )
    ),

  async execute(interaction) {
    const category = interaction.options.getString('category') || 'money';
    await interaction.deferReply();

    try {
        const topUsers = await db.getLeaderboard(category, 10);
        const { Renderer } = require('../utils/Renderer');
        const renderer = new Renderer();

        const buffer = await renderer.drawGlobalLeaderboard(topUsers, category);
        const attachment = new AttachmentBuilder(buffer, { name: 'leaderboard.png' });

        const lbEmbed = new EmbedBuilder()
            .setTitle(`🏆 Global Leaderboard: Top by ${category.toUpperCase()}`)
            .setImage('attachment://leaderboard.png')
            .setColor('#f1c40f')
            .setFooter({ text: 'Perc Fermé Network • Global Rankings' });

        await interaction.editReply({ embeds: [lbEmbed], files: [attachment] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error loading leaderboard.' });
    }
  }
};
