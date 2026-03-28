const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const trivia = [
    { q: "Who won the 2021 F1 World Championship?", a: "Max Verstappen" },
    { q: "Which track is known as the 'Temple of Speed'?", a: "Monza" },
    { q: "How many world championships did Michael Schumacher win?", a: "7" },
    { q: "Which team does Lewis Hamilton drive for in 2024?", a: "Mercedes" },
    { q: "What is the name of the safety system above the cockpit?", a: "Halo" },
    { q: "Who is the youngest ever F1 race winner?", a: "Max Verstappen" },
    { q: "Which circuit hosts the Monaco Grand Prix?", a: "Circuit de Monaco" },
    { q: "Which engine manufacturer does Red Bull use in 2024?", a: "Honda" },
    { q: "Who is known as 'The Iceman'?", a: "Kimi Raikkonen" },
    { q: "Which country is Silverstone located in?", a: "United Kingdom" },
    { q: "What year did Sebastian Vettel win his first title?", a: "2010" },
    { q: "Which driver has the most poles in history?", a: "Lewis Hamilton" },
    { q: "Who is the team principal of Mercedes?", a: "Toto Wolff" },
    { q: "What is the max number of cars on an F1 grid today?", a: "20" },
    { q: "Which track has the' Eau Rouge' corner?", a: "Spa-Francorchamps" }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Test your F1 knowledge with a quick trivia question!'),

  async execute(interaction) {
    const question = trivia[Math.floor(Math.random() * trivia.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🧠 F1 Trivia Challenge')
        .setColor('#3498db')
        .setDescription(`**Question:** ${question.q}`)
        .setFooter({ text: 'Answer will be revealed in a spoiler below!' });

    await interaction.reply({ embeds: [embed], content: `|| **Answer:** ${question.a} ||` });
  }
};
