import { REST, Routes } from 'discord.js';
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url';
import { environmentalVariableTypes } from './types/environmentalVariable';

export async function loadSlashCommands({
  token, 
  clientId, 
  guildId
}: environmentalVariableTypes) {

  if(!token) throw new Error('No token provided')
  if(!clientId) throw new Error('No client ID provided')
  if(!guildId) throw new Error('No guild ID provided')

  const commands: any[] = [];

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const foldersPath = path.join(__dirname, 'commands');
  const commandFolders = await fs.readdir(foldersPath);

  const rest = new REST({ version: '10' }).setToken(token);

  for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.ts'));
    
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);

      const command = await import(`file://${filePath}`);
      console.log(command)
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }

  // deploy commands
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );
    console.log(data)
    // console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // catch and log any errors!
    console.error(error);
  }
}