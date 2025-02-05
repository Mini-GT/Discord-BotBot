import { Client, Collection, GatewayIntentBits } from 'discord.js';
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
    GatewayIntentBits.GuildModeration
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
    const commandfilePath = path.join(commandsPath, file);

    // Convert to a valid file URL
    const fileUrl = pathToFileURL(commandfilePath).href;

    const commandModule = await import(fileUrl);
    const command = commandModule.default
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${commandfilePath} is missing a required "data" or "execute" property.`);
    }
  }
}

const eventsFolderPath = path.join(__dirname, 'events');
const eventFiles = (await fs.readdir(eventsFolderPath)).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const eventsfilePath = path.join(eventsFolderPath, file);

  // Convert to a valid file URL
  const fileUrl = pathToFileURL(eventsfilePath).href;
  const eventModule = await import(fileUrl);
  const event = eventModule.default
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// const fetchedLogs = await guild.fetchAuditLogs();
// const firstEntry = fetchedLogs.entries.first();


client.login(ENV.token);