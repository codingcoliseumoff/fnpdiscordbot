const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spy')
    .setDescription('Attempt to steal technical data or race strategy from an opponent.')
    .addUserOption(option => 
        option.setName('target')
        .setDescription('The user to spy on')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const userId = interaction.user.id;
    await interaction.deferReply();

    const myTeam = await db.getTeam(userId);
    const targetTeam = await db.getTeam(target.id);

    if (!targetTeam) return interaction.editReply({ content: 'Target user does not have an active F1 team.' });

    const successChance = 0.45 + (myTeam.tier * 0.05);
    const caughtChance = 0.25;

    const roll = Math.random();

    if (roll < successChance) {
        const info = `
**📊 INTEL REPORT ON ${targetTeam.name.toUpperCase()}**
**Aerodynamics:** ${targetTeam.aero.toFixed(1)}
**Engine Power:** ${targetTeam.engine_power.toFixed(1)}
**Chassis:** ${targetTeam.chassis.toFixed(1)}
**Reliability:** ${targetTeam.reliability.toFixed(1)}
**Current Balance:** $${targetTeam.money.toLocaleString()}
        `;
        const spyEmbed = new EmbedBuilder()
            .setTitle('🕵️ Intelligence Successful')
            .setColor('#2ecc71')
            .setDescription(info)
            .setFooter({ text: 'Data decrypted successfully.' });
        await interaction.editReply({ embeds: [spyEmbed] });
    } else if (roll > (1 - caughtChance)) {
        const fine = 250000;
        await db.supabase.from('teams').update({ money: myTeam.money - fine }).eq('owner_user_id', userId);
        
        await interaction.editReply({ 
            content: `🚫 **CAUGHT!** Your spy was intercepted by ${targetTeam.name} security. You have been fined **$${fine.toLocaleString()}** by the FIA for industrial espionage.` 
        });
    } else {
        await interaction.editReply({ content: 'Your spy returned empty-handed. No data was gathered.' });
    }
  }
};
