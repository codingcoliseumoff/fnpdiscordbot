const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-team')
    .setDescription('PERMANENTLY delete your F1 team and restart your career.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    await interaction.deferReply({ ephemeral: true });

    const team = await db.getTeam(userId);
    if (!team) return interaction.editReply({ content: 'You do not have a team to delete!' });

    const confirmEmbed = new EmbedBuilder()
      .setTitle('⚠️ DANGER: Permanent Deletion')
      .setColor('#ff0000')
      .setDescription(`Are you sure you want to delete **${team.name}**? This will reset all car upgrades, tier progress, and history. You will KEEP your personal wallet money, but the team treasury will be lost.`);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('confirm_delete').setLabel('Yes, Delete Everything').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cancel_delete').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );

    const msg = await interaction.editReply({ embeds: [confirmEmbed], components: [row] });

    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    collector.on('collect', async i => {
        if (i.customId === 'confirm_delete') {
            await db.supabase.from('teams').delete().eq('owner_user_id', userId);
            await i.update({ content: '✅ Your team has been wiped. You can now use `/setup` to start fresh.', embeds: [], components: [] });
        } else {
            await i.update({ content: 'Deletion cancelled.', embeds: [], components: [] });
        }
        collector.stop();
    });
  }
};
