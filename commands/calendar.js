const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const races = [
  { race: "Bahrain GP", date: "March 2", circuit: "Sakhir" },
  { race: "Saudi Arabia GP", date: "March 9", circuit: "Jeddah" },
  { race: "Australia GP", date: "March 24", circuit: "Melbourne" },
  { race: "Japan GP", date: "April 7", circuit: "Suzuka" },
  { race: "China GP", date: "April 21", circuit: "Shanghai" },
  { race: "Miami GP", date: "May 5", circuit: "Miami" },
  { race: "Emilia Romagna GP", date: "May 19", circuit: "Imola" },
  { race: "Monaco GP", date: "May 26", circuit: "Monaco" },
  { race: "Canada GP", date: "June 9", circuit: "Montreal" },
  { race: "Spain GP", date: "June 23", circuit: "Barcelona" },
  { race: "Austria GP", date: "June 30", circuit: "Spielberg" },
  { race: "British GP", date: "July 7", circuit: "Silverstone" },
  { race: "Hungary GP", date: "July 21", circuit: "Hungaroring" },
  { race: "Belgian GP", date: "July 28", circuit: "Spa" },
  { race: "Dutch GP", date: "August 25", circuit: "Zandvoort" },
  { race: "Italian GP", date: "September 1", circuit: "Monza" },
  { race: "Azerbaijan GP", date: "September 15", circuit: "Baku" },
  { race: "Singapore GP", date: "September 22", circuit: "Marina Bay" },
  { race: "United States GP", date: "October 20", circuit: "Austin" },
  { race: "Mexico City GP", date: "October 27", circuit: "Hermanos Rodriguez" },
  { race: "Brazilian GP", date: "November 3", circuit: "Interlagos" },
  { race: "Las Vegas GP", date: "November 23", circuit: "Las Vegas" },
  { race: "Qatar GP", date: "December 1", circuit: "Lusail" },
  { race: "Abu Dhabi GP", date: "December 8", circuit: "Yas Marina" }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calendar')
    .setDescription('Show the 2024 Formula 1 race calendar.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('📅 2024 Formula 1 Calendar')
        .setColor('#e74c3c')
        .setDescription(races.map(r => `🏁 **${r.race}** - ${r.date} (${r.circuit})`).join('\n').slice(0, 4000))
        .setFooter({ text: 'All times in local GMT' });

    await interaction.reply({ embeds: [embed] });
  }
};
