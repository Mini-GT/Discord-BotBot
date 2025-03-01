import { REST, Routes } from 'discord.js';
import 'dotenv/config';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const commandId = process.env.COMMAND_ID;

if (!token) throw new Error('No token provided');
if (!clientId) throw new Error('No client ID provided');
if (!commandId) throw new Error('No Command ID provided');

const rest = new REST({ version: '10' }).setToken(token);

try {
  // for global commands
  rest
    .delete(Routes.applicationCommand(clientId, commandId))
    .then(() => console.log('Successfully deleted application command'))
    .catch(console.error);
} catch (error) {
  console.error(error);
}
