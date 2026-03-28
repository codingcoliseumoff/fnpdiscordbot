const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { db } = require('../utils/Supabase');

const driversData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/drivers.json'), 'utf8'));

const { shopItems } = require('../utils/ShopItems');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Buy F1 car components and legacy items!')
    .addStringOption(option => 
        option.setName('category')
        .setDescription('Filter shop items')
        .addChoices(
            { name: 'Components (Performance)', value: 'comp' },
            { name: 'Hire Drivers', value: 'drivers' }
        )
    ),

  async execute(interaction) {
    const category = interaction.options.getString('category') || 'comp';
    const userId = interaction.user.id;
    await interaction.deferReply();

    try {
        const team = await db.getTeam(userId);
        if (!team) return interaction.editReply({ content: 'You do not own a team! Use `/setup` first.' });

        if (category === 'drivers') {
            const availableDrivers = driversData.filter(d => !d.teamId || d.teamId === 'free_agent').slice(0, 50);
            const shopDrivers = [];
            for (let i = 0; i < 3; i++) {
                shopDrivers.push(availableDrivers[Math.floor(Math.random() * availableDrivers.length)]);
            }

            const shopEmbed = new EmbedBuilder()
                .setTitle('👤 Driver Transfer Market')
                .setColor('#f1c40f')
                .setDescription(`Budget: **$${(team.money || 0).toLocaleString()}**`)
                .addFields(shopDrivers.map(d => ({ name: `👤 ${d.name}`, value: `Pace: ${d.stats.pace} | Cost: $${(d.stats.pace * 10000).toLocaleString()}`, inline: false })));

            const row = new ActionRowBuilder().addComponents(
                shopDrivers.map((d, i) => new ButtonBuilder().setCustomId(`hire_${d.id}`).setLabel(`Hire ${d.name.split(' ').pop()}`).setStyle(ButtonStyle.Success))
            );
            await interaction.editReply({ embeds: [shopEmbed], components: [row] });
        } else {
            // Pick a few items for today
            const randomItems = shopItems.sort(() => 0.5 - Math.random()).slice(0, 5);
            
            const shopEmbed = new EmbedBuilder()
                .setTitle('🏪 F1 Component Shop')
                .setColor('#3498db')
                .setDescription(`Principal **${interaction.user.username}**, upgrade your car here!\nBudget: **$${(team.money || 0).toLocaleString()}**`)
                .addFields(randomItems.map(item => ({ 
                    name: `📦 ${item.name} ($${item.cost.toLocaleString()})`, 
                    value: `Stat: ${item.type.toUpperCase()} +${item.boost} | ${item.desc}`, 
                    inline: false 
                })));

            const row = new ActionRowBuilder().addComponents(
                randomItems.map(item => new ButtonBuilder().setCustomId(`buy_${item.id}`).setLabel(`Buy ${item.name.split(' ').slice(0,2).join(' ')}`).setStyle(ButtonStyle.Primary))
            );
            await interaction.editReply({ embeds: [shopEmbed], components: [row] });
        }
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error loading shop items.' });
    }
  }
};
