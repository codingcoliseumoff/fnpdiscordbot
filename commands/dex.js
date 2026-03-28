const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dex')
    .setDescription('View your collection of F1 drivers.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    await interaction.deferReply();

    try {
        const { data: dex } = await db.supabase.from('user_dex').select('*').eq('user_id', userId);

        if (!dex || dex.length === 0) return interaction.editReply({ content: 'Your F1 Dex is empty! Wait for drivers to spawn in the set channel and use `/guess` to collect them.' });

        const dexEmbed = new EmbedBuilder()
            .setTitle(`📔 ${interaction.user.username}'s F1 Dex`)
            .setColor('#3498db')
            .setDescription(dex.map((d, i) => `**${i+1}.** ${d.driver_name}`).join('\n').slice(0, 4000))
            .setFooter({ text: `Total Collected: ${dex.length}` });

        await interaction.editReply({ embeds: [dexEmbed] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error loading F1 Dex.' });
    }
  }
};
