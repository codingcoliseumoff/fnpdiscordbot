const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { db } = require('./Supabase');

const driversData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/drivers.json'), 'utf8'));

class F1Dex {
    static async spawn(client, guildId) {
        const { data: settings } = await db.supabase.from('server_settings').select('spawn_channel_id').eq('server_id', guildId).single();
        if (!settings || !settings.spawn_channel_id) return;

        const channel = client.channels.cache.get(settings.spawn_channel_id);
        if (!channel) return;

        let driver = driversData[Math.floor(Math.random() * driversData.length)];
        let rarity = 'Standard';
        
        // 5% Legend Chance
        if (Math.random() < 0.05) {
            const legends = [
                { id: 'senna', name: 'Ayrton Senna (Prime)', stats: { pace: 99, racecraft: 99 }, trait: 'Legendary' },
                { id: 'schumacher', name: 'Michael Schumacher (Prime)', stats: { pace: 98, racecraft: 99 }, trait: 'Legendary' },
                { id: 'lauda', name: 'Niki Lauda (Classic)', stats: { pace: 95, racecraft: 99 }, trait: 'Clinical' }
            ];
            driver = legends[Math.floor(Math.random() * legends.length)];
            rarity = 'LEGENDARY';
        }
        
        await db.supabase.from('spawns').upsert([{ 
            server_id: guildId, 
            driver_id: driver.id, 
            driver_name: driver.name,
            status: 'active' 
        }]);

        // Construct real F1 driver portrait URL
        const topDriversRaw = {
            'verstappen': 'maxver01', 'perez': 'serper01',
            'hamilton': 'lewham01', 'russell': 'georus01',
            'leclerc': 'charle01', 'sainz': 'carsai01',
            'norris': 'lannor01', 'piastri': 'oscpia01',
            'alonso': 'feralo01', 'stroll': 'lanstr01',
            'gasly': 'pierga01', 'ocon': 'estoco01',
            'albon': 'alealb01', 'sargeant': 'logsar01',
            'ricciardo': 'danric01', 'tsunoda': 'yuktsu01',
            'bottas': 'valbot01', 'zhou': 'guazho01',
            'hulk': 'nicjul01', 'magnussen': 'ke vmag01'
        };

        const f1Id = topDriversRaw[driver.id.toLowerCase()] || 'generic';
        let imageUrl = f1Id !== 'generic' 
            ? `https://media.formula1.com/content/dam/fom-website/drivers/${driver.name.charAt(0).toUpperCase()}/${f1Id}.png.transform/2col/image.png`
            : "https://i.ibb.co/6803868/f1-placeholder.jpg";

        if (rarity === 'LEGENDARY') imageUrl = "https://i.ibb.co/6803868/legend-spawn.jpg"; // Use special placeholder for legends

        const spawnEmbed = new EmbedBuilder()
            .setTitle(rarity === 'LEGENDARY' ? '✨ AN UNKNOWN LEGEND HAS ARRIVED!' : '🏎️ A wild driver has appeared!')
            .setDescription(rarity === 'LEGENDARY' ? `**${driver.name}** has entered the paddock!` : 'Click the button below to attempt a signing!')
            .setImage(imageUrl)
            .setColor(rarity === 'LEGENDARY' ? '#ffcc00' : '#f1c40f')
            .setFooter({ text: 'Official Perc Fermé Scouting System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`guess_driver_${guildId}`)
                .setLabel('Claim Driver')
                .setStyle(ButtonStyle.Success)
        );

        await channel.send({ embeds: [spawnEmbed], components: [row] });
    }
}

module.exports = { F1Dex };
