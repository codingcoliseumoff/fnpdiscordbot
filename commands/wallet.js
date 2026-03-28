const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wallet')
    .setDescription('Check your money, XP, and history points.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    await interaction.deferReply();

    try {
        const user = await db.getUser(userId, interaction.user.username);
        const { Renderer } = require('../utils/Renderer');
        const renderer = new Renderer();

        const buffer = await renderer.drawWallet(user, interaction.user.username);
        const attachment = new AttachmentBuilder(buffer, { name: 'wallet.png' });

        const walletEmbed = new EmbedBuilder()
            .setTitle(`🏦 ${interaction.user.username}'s Wallet`)
            .setImage('attachment://wallet.png')
            .setColor('#2ecc71')
            .setFooter({ text: 'Perc Fermé Network • Bank Authority' });

        await interaction.editReply({ embeds: [walletEmbed], files: [attachment] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error fetching wallet data.' });
    }
  }
};
