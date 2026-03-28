const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('manage')
    .setDescription('Manage your F1 team and car upgrades.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    await interaction.deferReply();
    
    try {
        const team = await db.getTeam(userId);
        if (!team) return interaction.editReply({ content: 'You do not own a team! Use `/setup` first.', ephemeral: true });

        const { Renderer } = require('../utils/Renderer');
        const renderer = new Renderer();
        const buffer = await renderer.drawTeamInfo(team, interaction.user.username);
        const attachment = new AttachmentBuilder(buffer, { name: 'team_hq.png' });

        const manageEmbed = new EmbedBuilder()
          .setTitle(`🛠️ Team Management: ${team.name}`)
          .setColor(team.color || '#ffffff')
          .setDescription(`Welcome back, Principal **${interaction.user.username}**!\nManage your car development and team finances here.`)
          .setImage('attachment://team_hq.png')
          .setFooter({ text: 'Perc Fermé Network • Team HQ' });

        const upgradeRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder().setCustomId('upgrade_aero').setLabel('Upgrade Aero ($100k)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('upgrade_chassis').setLabel('Upgrade Chassis ($100k)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('upgrade_engine').setLabel('Upgrade Engine ($150k)').setStyle(ButtonStyle.Danger)
          );

        await interaction.editReply({ embeds: [manageEmbed], components: [upgradeRow], files: [attachment] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error fetching team data.' });
    }
  }
};
