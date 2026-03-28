const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Fetch a fresh F1 meme from r/formuladank.'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
        const response = await fetch('https://www.reddit.com/r/formuladank/hot.json?limit=100');
        const data = await response.json();
        const posts = data.data.children.filter(post => post.data.post_hint === 'image');
        const randomPost = posts[Math.floor(Math.random() * posts.length)].data;

        const memeEmbed = new EmbedBuilder()
            .setTitle(randomPost.title)
            .setURL(`https://reddit.com${randomPost.permalink}`)
            .setImage(randomPost.url)
            .setColor('#e74c3c')
            .setFooter({ text: `⬆️ ${randomPost.ups} | Courtesy of r/formuladank` });

        await interaction.editReply({ embeds: [memeEmbed] });
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Error fetching memes. Reddit might be having a moment.' });
    }
  }
};
