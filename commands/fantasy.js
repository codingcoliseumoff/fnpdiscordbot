const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fantasy')
    .setDescription('The RNG game: Pick a random driver for the upcoming weekend!'),

  async execute(interaction) {
    const drivers = [
        "Max Verstappen", "Lando Norris", "Charles Leclerc", "Oscar Piastri",
        "Carlos Sainz", "Lewis Hamilton", "George Russell", "Sergio Perez",
        "Fernando Alonso", "Nico Hulkenberg", "Lance Stroll", "Yuki Tsunoda",
        "Kevin Magnussen", "Alex Albon", "Daniel Ricciardo", "Pierre Gasly",
        "Esteban Ocon", "Zhou Guanyu", "Logan Sargeant", "Valtteri Bottas"
    ];

    const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
    const userId = interaction.user.id;

    await interaction.deferReply();

    try {
        const user = await db.getUser(userId, interaction.user.username);
        const lastClaim = user.last_fantasy_claim ? new Date(user.last_fantasy_claim) : new Date(0);
        const now = new Date();
        const diffInHours = (now - lastClaim) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
            return interaction.editReply({ content: `⌛ You've already picked a driver for this weekend cycle! Your next chance is <t:${Math.floor(nextClaim.getTime() / 1000)}:R>.` });
        }

        const fantasyEmbed = new EmbedBuilder()
            .setTitle('🎲 Fantasy RNG Pick')
            .setColor('#7289da')
            .setDescription(`You've been assigned **${randomDriver}** for the upcoming race weekend!`)
            .setFields(
                { name: 'Rules', value: 'Points will be added to your account based on their real-life performance. Good luck!' },
                { name: 'Last Pick', value: now.toLocaleString(), inline: true }
            )
            .setFooter({ text: 'Perc Fermé Network • Driver RNG' })
            .setTimestamp();

        // Update last claim time and save pick in DB (logic simplified, ideally there's a table for this)
        await db.supabase.from('users').update({ last_fantasy_claim: now.toISOString() }).eq('user_id', userId);
        
        // Save pick to fantasy_picks table
        await db.supabase.from('fantasy_picks').insert([{ 
            user_id: userId, 
            driver_name: randomDriver,
            status: 'pending'
        }]);

        await interaction.editReply({ embeds: [fantasyEmbed] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error processing your fantasy pick.' });
    }
  }
};
