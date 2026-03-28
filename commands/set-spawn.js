const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { db } = require('../utils/Supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-spawn')
    .setDescription('Set the channel where wild F1 drivers will appear.')
    .addChannelOption(option => 
        option.setName('channel')
        .setDescription('Channel for driver spawns')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guildId;

    await db.supabase.from('server_settings').upsert([{ 
        server_id: guildId, 
        spawn_channel_id: channel.id 
    }]);

    await interaction.reply({ content: `✅ Driver spawns have been set to ${channel}!`, ephemeral: true });
  }
};
