import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import { environmentalVariableTypes } from './types/environmentalVariable';
import { loadSlashCommands } from './loadCommands';

const ENV: environmentalVariableTypes = {
  token: process.env.DISCORD_TOKEN,
  guildId: process.env.GUILD_ID,
  clientId: process.env.CLIENT_ID,
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

loadSlashCommands(ENV);

client.login(ENV.token);

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('messageCreate', (message) => {
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
});
