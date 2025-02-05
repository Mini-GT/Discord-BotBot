import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import 'dotenv/config';
import { environmentalVariableTypes } from './types/environmentalVariable.js';
import { loadSlashCommands } from './loadSlashCommands.js';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'node:path'
import fs from 'node:fs/promises'


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const ENV: environmentalVariableTypes = {
  token: process.env.DISCORD_TOKEN,
  guildId: process.env.GUILD_ID,
  clientId: process.env.CLIENT_ID,
}

loadSlashCommands(ENV);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = await fs.readdir(foldersPath);

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));
  
  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    // Convert to a valid file URL
    const fileUrl = pathToFileURL(filePath).href;

    const commandModule = await import(fileUrl);
    const command = commandModule.default
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

// listens to slash commands in the server
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

  try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command! Pls report the issue to the mods', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command! Pls report the issue to the mods', flags: MessageFlags.Ephemeral });
		}
	}
});

client.on('messageCreate', (message) => {
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
});

client.login(ENV.token);