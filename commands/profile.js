const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');
const { Renderer } = require('../utils/Renderer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your complete F1 career profile card.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    await interaction.deferReply();

    try {
        const user = await db.getUser(userId, username);
        const team = await db.getTeam(userId);
        
        const renderer = new Renderer();
        const buffer = await renderer.drawProfile(user, team, username);
        const attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });

        const profileEmbed = new EmbedBuilder()
            .setTitle(`👤 Principal Profile: ${username}`)
            .setImage('attachment://profile.png')
            .setColor(team ? team.color : '#ffffff')
            .setFooter({ text: 'Perc Fermé Network • Career Overview' });

        await interaction.editReply({ embeds: [profileEmbed], files: [attachment] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error generating profile card.' });
    }
  }
};
