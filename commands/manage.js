const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

        const manageEmbed = new EmbedBuilder()
          .setTitle(`🛠️ Team Management: ${team.name}`)
          .setColor(team.color || '#ffffff')
          .setDescription(`Welcome back, Principal **${interaction.user.username}**!\nManage your car development and team finances here.`)
          .addFields(
            { name: '💰 Budget', value: `$${(team.money || 0).toLocaleString()}`, inline: true },
            { name: '🏎️ Performance', value: `Aero: ${team.aero?.toFixed(1) || 20} | Chassis: ${team.chassis?.toFixed(1) || 20} | Engine: ${team.engine_power?.toFixed(1) || 20}`, inline: true },
            { name: '⚙️ Operations', value: `Pit Crew: ${team.pit_crew?.toFixed(1) || 20} | Durability: ${team.durability?.toFixed(1) || 20}`, inline: true }
          )
          .setFooter({ text: 'Perc Fermé Network • Team HQ' })
          .setTimestamp();

        const upgradeRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder().setCustomId('upgrade_aero').setLabel('Upgrade Aero ($100k)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('upgrade_chassis').setLabel('Upgrade Chassis ($100k)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('upgrade_engine').setLabel('Upgrade Engine ($150k)').setStyle(ButtonStyle.Danger)
          );

        await interaction.editReply({ embeds: [manageEmbed], components: [upgradeRow] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error fetching team data.' });
    }
  }
};
