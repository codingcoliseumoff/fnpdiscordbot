const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('f1-results')
    .setDescription('Get latest F1 race or qualifying results from the real world.'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
        const response = await fetch('http://ergast.com/api/f1/current/last/results.json');
        const data = await response.json();
        
        const race = data.MRData.RaceTable.Races[0];
        if (!race) return interaction.editReply({ content: 'No recent race data found.' });

        const results = race.Results.slice(0, 10).map((r, i) => 
            `**${r.position}.** ${r.Driver.givenName} ${r.Driver.familyName} (${r.Constructor.name}) - ${r.Status}`
        ).join('\n');

        const resultsEmbed = new EmbedBuilder()
            .setTitle(`🏁 Latest Race: ${race.raceName} ${race.season}`)
            .setColor('#e74c3c')
            .setURL(race.url)
            .setDescription(`**Circuit:** ${race.Circuit.circuitName}\n**Date:** ${race.date}\n\n**Top 10 Results:**\n${results}`)
            .setFooter({ text: 'Data provided by Ergast API' });

        await interaction.editReply({ embeds: [resultsEmbed] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error fetching F1 data.' });
    }
  }
};
