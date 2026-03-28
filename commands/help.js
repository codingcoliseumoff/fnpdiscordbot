const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available F1 commands.'),

  async execute(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setTitle('🏎️ Perc Fermé Network - Command Guide')
      .setColor('#3498db')
      .setDescription('Explore all F1-related commands below!\n\n**Racing & Management**\n`/race` - Start a practice or full weekend.\n`/setup` - Take over an iconic F1 team.\n`/manage` - Upgrade your car components.\n`/shop` - Buy performance items.\n`/delete-team` - Reset your career.\n\n**Financial & Stats**\n`/wallet` - View your personal finances.\n`/standings` - Check server/global leaderboards.\n`/daily` - Collect sponsorship funds (X P).\n`/profile` - View your comprehensive F1 profile.\n\n**F1 Data & Fun**\n`/driver-info` - Lookup real driver detailed stats.\n`/track-info` - Explore F1 circuit layouts.\n`/calendar` - View the 2024 race schedule.\n`/meme` - Get a meme from r/formuladank.\n`/trivia` - Test your F1 knowledge.\n\n**Multiplayer & Admin**\n`/lobby` - Private race lobbies.\n`/server-tournament` - Host server championships (Admin only).')
      .setFooter({ text: 'Official Perc Fermé Bot' });

    await interaction.reply({ embeds: [helpEmbed] });
  }
};
