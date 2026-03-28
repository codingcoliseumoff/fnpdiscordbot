const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const driversData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/drivers.json'), 'utf8'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('driver-info')
    .setDescription('Lookup detailed stats of a real F1 driver.')
    .addStringOption(option => 
        option.setName('name')
        .setDescription('Driver name')
        .setAutocomplete(true)
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const filtered = driversData
        .filter(d => d.name.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25);
    await interaction.respond(filtered.map(d => ({ name: d.name, value: d.id })));
  },

  async execute(interaction) {
    const driverId = interaction.options.getString('name');
    const driver = driversData.find(d => d.id === driverId);

    if (!driver) return interaction.reply({ content: 'Driver not found!', ephemeral: true });

    const infoEmbed = new EmbedBuilder()
        .setTitle(`🏎️ Driver Profile: ${driver.name}`)
        .setColor('#ffffff')
        .setThumbnail(`https://www.google.com/search?q=${driver.name.replace(' ', '+')}+f1+helmet&tbm=isch`) // Mock thumbnail search
        .addFields(
            { name: 'Nationality', value: driver.nationality || 'Unknown', inline: true },
            { name: 'Age', value: String(driver.age || 'N/A'), inline: true },
            { name: 'Current Team', value: driver.teamId || 'Free Agent', inline: true },
            { name: '🏁 Pace', value: String(driver.stats.pace), inline: true },
            { name: '🎯 Consistency', value: String(driver.stats.consistency), inline: true },
            { name: '🛡️ Racecraft', value: String(driver.stats.racecraft), inline: true },
            { name: '⏳ Tyre Mgmt', value: String(driver.stats.tyreManagement), inline: true },
            { name: '🌧️ Wet Weather', value: String(driver.stats.wetWeatherSkill), inline: true },
            { name: '🔥 Aggression', value: String(driver.stats.aggression), inline: true }
        )
        .setFooter({ text: 'Official Perc Fermé Scouting Report' });

    await interaction.reply({ embeds: [infoEmbed] });
  }
};
