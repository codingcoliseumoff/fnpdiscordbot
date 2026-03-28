const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const tracksData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/tracks.json'), 'utf8'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('track-info')
    .setDescription('Explore information about a real Formula 1 circuit.')
    .addStringOption(option => 
        option.setName('circuit')
        .setDescription('Track name')
        .setAutocomplete(true)
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const filtered = tracksData
        .filter(t => t.name.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25);
    await interaction.respond(filtered.map(t => ({ name: t.name, value: t.id })));
  },

  async execute(interaction) {
    const trackId = interaction.options.getString('circuit');
    const track = tracksData.find(t => t.id === trackId);

    const { AttachmentBuilder } = require('discord.js');
    const { Renderer } = require('../utils/Renderer');
    const renderer = new Renderer();

    if (!track) return interaction.reply({ content: 'Track not found!', ephemeral: true });

    await interaction.deferReply();
    
    // Load track maps
    const trackMapsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/trackMaps.json'), 'utf8'));
    const mapBase64 = trackMapsData[track.id.toLowerCase()] || trackMapsData['silverstone'];
    const mapBuffer = mapBase64 ? Buffer.from(mapBase64.split(',')[1], 'base64') : null;

    const buffer = await renderer.drawTrackInfo(track, mapBuffer);
    const attachment = new AttachmentBuilder(buffer, { name: 'track_info.png' });

    const infoEmbed = new EmbedBuilder()
        .setTitle(`📍 Official Circuit Profile: ${track.name}`)
        .setColor('#e74c3c')
        .setImage('attachment://track_info.png')
        .setFooter({ text: 'FIA Grade 1 Circuit Documentation • Perc Fermé Network' });

    await interaction.editReply({ embeds: [infoEmbed], files: [attachment] });
  }
};
