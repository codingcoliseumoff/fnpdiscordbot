const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Collect your daily budget for F1 activities.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    await interaction.deferReply();

    try {
        const user = await db.getUser(userId, username);
        const lastDaily = user.last_daily_at; 
        const now = new Date();

        if (lastDaily && (now - new Date(lastDaily)) < 86400000) {
            const remaining = 86400000 - (now - new Date(lastDaily));
            const hours = Math.floor(remaining / 3600000);
            return interaction.editReply({ content: `⌛ You already collected your daily! Try again in **${hours}h**.` });
        }

        const reward = 500000;
        await db.updateMoney(userId, reward);
        await db.supabase.from('users').update({ last_daily_at: now.toISOString() }).eq('user_id', userId);

        const dailyEmbed = new EmbedBuilder()
            .setTitle('💰 Daily Sponsorship Received!')
            .setColor('#2ecc71')
            .setDescription(`You have received **$${reward.toLocaleString()}** from your sponsors. Use it wisely, Principal.`)
            .setTimestamp();

        await interaction.editReply({ embeds: [dailyEmbed] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error collecting daily reward.' });
    }
  }
};
