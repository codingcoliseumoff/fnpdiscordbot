const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guess')
    .setDescription('Guess the wild driver\'s name to collect them!')
    .addStringOption(option => 
        option.setName('name')
        .setDescription('Your guess')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guess = interaction.options.getString('name').toLowerCase();
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    const { data: spawn } = await db.supabase.from('spawns').select('*').eq('server_id', guildId).eq('status', 'active').single();

    if (!spawn) return interaction.reply({ content: 'There are no active driver spawns in this server.', ephemeral: true });

    if (guess === spawn.driver_name.toLowerCase()) {
        await db.supabase.from('spawns').update({ status: 'claimed' }).eq('id', spawn.id);
        
        // Save collection
        await db.supabase.from('user_dex').insert([{ 
            user_id: userId, 
            driver_id: spawn.driver_id, 
            driver_name: spawn.driver_name 
        }]);

        await interaction.reply({ content: `🏆 **BOOM!** Principal ${interaction.user.username} has signed **${spawn.driver_name}** to their dex!` });
    } else {
        await interaction.reply({ content: '❌ Incorrect name! Try again.', ephemeral: true });
    }
  }
};
