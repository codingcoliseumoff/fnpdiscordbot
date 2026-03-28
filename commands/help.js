const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get info about Perc Fermé Network commands.'),

  async execute(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setTitle('🏎️ Perc Fermé Network - User Guide')
      .setColor('#ffcc00')
      .setDescription('Manage your F1 team, race vs AI, and participate in server tournaments!')
      .addFields(
        { name: '🛠️ Get Started', value: '`/setup` - Create your team, name, color, and logo website.' },
        { name: '🏁 Racing', value: '`/race` - Start Practice, Qualifying, or a Race vs AI.\n`/lobby` - Join or create multiplayer lobbies.' },
        { name: '📈 Management', value: '`/manage` - View stats and buy car upgrades.' },
        { name: '🏪 Economy', value: '`/shop` - Buy specialty items and hire/fire drivers.\n`/wallet` - Check your money and history points.' },
        { name: '🏆 Tournament', value: '`/server-tournament` - Admin-only command to start server season.' },
        { name: '🎲 Minigames', value: '`/fantasy` - Random driver pick RNG game based on real F1.\n`/leaderboard` - Global and Server-wide standings.' }
      )
      .setFooter({ text: 'Perc Fermé Network • Created for F1 Fans' })
      .setTimestamp();

    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const inviteLink = 'https://discord.com/api/oauth2/authorize?client_id=1487436734244454630&permissions=2147600384&scope=bot%20applications.commands';
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Add App to Server')
          .setStyle(ButtonStyle.Link)
          .setURL(inviteLink)
      );

    await interaction.reply({ embeds: [helpEmbed], components: [row] });
  }
};
