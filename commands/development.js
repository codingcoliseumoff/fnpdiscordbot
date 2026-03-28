const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('development')
    .setDescription('Set your team branching development path for the season.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    await interaction.deferReply();

    const team = await db.getTeam(userId);
    if (!team) return interaction.editReply({ content: 'You do not own a team! Use `/setup` first.' });

    const devEmbed = new EmbedBuilder()
        .setTitle('🏗️ Concept Development Center')
        .setColor('#3498db')
        .setDescription(`Current Path: **${team.development_path || 'Balanced'}**\n\nChoose a core philosophy for your technical team. This will buff specific stats while penalizing others. Switching costs **$5,000,000**.`)
        .addFields(
            { name: '⚖️ Balanced', value: 'Original performance with no penalties. Standard car balance.', inline: true },
            { name: '🚀 High Speed (Rocket)', value: 'Power Unit +10%, Aero -5%. Best for Monza and Spa.', inline: true },
            { name: '🌀 Cornering (Downforce)', value: 'Chassis +15%, Power Unit -5%. Best for Monaco and Hungary.', inline: true }
        )
        .setFooter({ text: 'Selection is permanent for the current session loop.' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('dev_Balanced').setLabel('Balanced').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('dev_HighSpeed').setLabel('High Speed').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('dev_Cornering').setLabel('Cornering').setStyle(ButtonStyle.Success)
    );

    await interaction.editReply({ embeds: [devEmbed], components: [row] });
  }
};
