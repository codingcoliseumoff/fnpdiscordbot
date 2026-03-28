const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const keepAlive = require('./utils/KeepAlive');
require('dotenv').config();

// Start keep-alive server
keepAlive();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	}
}

client.once('ready', async () => {
	console.log(`Ready! Logged in as ${client.user.tag}`);
    registerCommands();

    const { F1Dex } = require('./utils/F1Dex');
    setInterval(() => {
        client.guilds.cache.forEach(guild => {
            F1Dex.spawn(client, guild.id).catch(console.error);
        });
    }, 3600000); // 1 hour intervals
});

async function registerCommands() {
    const commands = [];
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        commands.push(command.data.toJSON());
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
}

client.on('interactionCreate', async interaction => {
	if (interaction.isChatInputCommand()) {
		const command = client.commands.get(interaction.commandName);
		if (!command) return;
		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await (interaction.replied || interaction.deferred ? interaction.followUp : interaction.reply).call(interaction, { content: 'There was an error while executing this command!', ephemeral: true });
		}
	} else if (interaction.isAutocomplete()) {
		const command = client.commands.get(interaction.commandName);
		if (!command) return;
		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
	} else if (interaction.isButton()) {
        const { db } = require('./utils/Supabase');
        const [action, ...args] = interaction.customId.split('_');
        
        if (action === 'upgrade') {
            const stat = args[0]; // aero, chassis, etc.
            const userId = interaction.user.id;
            const team = await db.getTeam(userId);
            if (!team) return interaction.reply({ content: 'Team not found!', ephemeral: true });
            
            const cost = stat === 'engine' ? 150000 : 100000;
            if (team.money < cost) return interaction.reply({ content: 'Not enough money!', ephemeral: true });
            
            // Apply upgrade logic (simplified for demonstration)
            await db.supabase.from('teams').update({ 
                [stat]: (team[stat] || 20) + 2, 
                money: team.money - cost 
            }).eq('owner_user_id', userId);
            
        } else if (action === 'buy') {
            const { shopItems } = require('./utils/ShopItems');
            const itemId = args.join('_');
            const item = shopItems.find(i => i.id === itemId);
            if (!item) return interaction.reply({ content: 'Item not found!', ephemeral: true });

            const userId = interaction.user.id;
            const team = await db.getTeam(userId);
            if (!team) return interaction.reply({ content: 'Team not found!', ephemeral: true });

            if (team.money < item.cost) return interaction.reply({ content: `You need $${(item.cost - team.money).toLocaleString()} more!`, ephemeral: true });

            const updates = { money: team.money - item.cost };
            if (item.type !== 'money' && item.type !== 'strategy') {
                updates[item.type] = (team[item.type] || 20) + item.boost;
            } else if (item.type === 'money') {
                // Merch multiplier or similar logic could go here
            }

            await db.supabase.from('teams').update(updates).eq('owner_user_id', userId);
            await interaction.reply({ content: `📦 **Purchased ${item.name}!** Your ${item.type.toUpperCase()} stat has been increased.`, ephemeral: true });
        } else if (action === 'hire') {
            const driverId = args.join('_');
            const fs = require('fs');
            const path = require('path');
            const driversData = JSON.parse(fs.readFileSync(path.join(__dirname, './src/data/drivers.json'), 'utf8'));
            const driver = driversData.find(d => d.id === driverId);
            const userId = interaction.user.id;
            const team = await db.getTeam(userId);

            const cost = driver.stats.pace * 10000;
            if (team.money < cost) return interaction.reply({ content: 'Not enough money!', ephemeral: true });

            // Rejection Logic: High pace drivers reject low tier teams
            if (driver.stats.pace > 85 && team.tier < 2 && Math.random() < 0.7) {
                return interaction.reply({ content: `🚫 **REJECTED!** ${driver.name} is not interested in signing for a Tier ${team.tier} team at this stage of their career.` });
            }

            if (driver.stats.pace > 92 && team.tier < 3 && Math.random() < 0.9) {
                return interaction.reply({ content: `🚫 **REJECTED!** ${driver.name} only considers Tier 3 (Factory) offers.` });
            }

            await db.supabase.from('teams').update({ money: team.money - cost }).eq('owner_user_id', userId);
            await db.supabase.from('drivers').insert([{ 
                id: driverId, 
                team_id: team.id, 
                name: driver.name, 
                stats: JSON.stringify(driver.stats),
                salary: Math.floor(driver.stats.pace * 2000),
                contract_laps: 100,
                trait: ['Steady', 'Aggressive', 'Late Braker'][Math.floor(Math.random() * 3)]
            }]);
            
            await interaction.reply({ content: `✍️ **CONTRACT SIGNED!** Welcome ${driver.name} to the team. Their salary of $${(Math.floor(driver.stats.pace * 2000)).toLocaleString()} per tick has been agreed for 100 laps.` });
        } else if (action === 'dev') {
            const path = args[0]; // Balanced, HighSpeed, etc
            const userId = interaction.user.id;
            const team = await db.getTeam(userId);
            if (!team) return interaction.reply({ content: 'Team not found!', ephemeral: true });

            const cost = 5000000;
            if (team.money < cost && team.development_path) return interaction.reply({ content: `You need $${(cost).toLocaleString()} to switch development concepts.`, ephemeral: true });

            await db.supabase.from('teams').update({ 
                development_path: path,
                money: team.development_path ? team.money - cost : team.money 
            }).eq('owner_user_id', userId);

            await interaction.reply({ content: `🏗️ **Development Concept: ${path}** Lock-in successful. Your ${path} designs will now go into production for the next race weekend.`, ephemeral: true });
        } else if (action === 'guess' && args[0] === 'driver') {
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
            const modal = new ModalBuilder()
                .setCustomId(`modal_guess_${args[1]}`)
                .setTitle('Driver Recognition');

            const nameInput = new TextInputBuilder()
                .setCustomId('driver_name')
                .setLabel("Who is this driver?")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter full name...')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        const [type, action, guildId] = interaction.customId.split('_');
        if (type === 'modal' && action === 'guess') {
            const guess = interaction.fields.getTextInputValue('driver_name').toLowerCase().trim();
            const { db } = require('./utils/Supabase');
            
            const { data: spawn } = await db.supabase.from('spawns').select('*').eq('server_id', guildId).eq('status', 'active').single();
            if (!spawn) return interaction.reply({ content: 'Slow down! Someone else already signed this driver or the offer expired!', ephemeral: true });

            if (guess === spawn.driver_name.toLowerCase()) {
                await db.supabase.from('spawns').update({ status: 'claimed' }).eq('id', spawn.id);
                await db.supabase.from('user_dex').insert([{ 
                    user_id: interaction.user.id, 
                    driver_id: spawn.driver_id, 
                    driver_name: spawn.driver_name 
                }]);
                await interaction.reply({ content: `🏆 **BOOM!** Principal ${interaction.user.username} has signed **${spawn.driver_name}** to their dex!` });
            } else {
                await interaction.reply({ content: '❌ Incorrect name! The driver has driven away...', ephemeral: true });
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
