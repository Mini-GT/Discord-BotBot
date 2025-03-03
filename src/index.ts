import { Client, Collection, EmbedBuilder, Events, GatewayIntentBits, MessageFlags, TextChannel } from 'discord.js';
import 'dotenv/config';
import { environmentalVariableTypes } from './types/environmentalVariable.js';
import { loadSlashCommands } from './loadSlashCommands.js';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'node:path'
import fs from 'node:fs/promises'
import { WebcastPushConnection } from 'tiktok-live-connector';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates
  ],
});

const tiktokLiveChannelId = process.env.TIKTOK_LIVE_CHANNEL_ID

if(!tiktokLiveChannelId) throw new Error('No Live Channel Id provided')

const ENV: environmentalVariableTypes = {
  token: process.env.DISCORD_TOKEN,
  guildId: process.env.GUILD_ID,
  clientId: process.env.CLIENT_ID,
};

loadSlashCommands(ENV);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = await fs.readdir(foldersPath);

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = (await fs.readdir(commandsPath)).filter((file) => file.endsWith('.js'));

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
      console.log(
        `[WARNING] The command at ${commandfilePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const eventsFolderPath = path.join(__dirname, 'events');
const eventFiles = (await fs.readdir(eventsFolderPath)).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
  const eventsfilePath = path.join(eventsFolderPath, file);

  // Convert to a valid file URL
  const fileUrl = pathToFileURL(eventsfilePath).href;
  const eventModule = await import(fileUrl);
  const event = eventModule.default;
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

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
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

// Username of someone who is currently live
let tiktokUsername = process.env.TIKTOK_USERNAME;
if(!tiktokUsername) throw new Error('No tiktok username provided')
	
const prefix = "!"
// Create a new wrapper object and pass the username
let tiktokLiveConnection = new WebcastPushConnection(tiktokUsername, {fetchRoomInfoOnConnect: false});

// Connect to the chat (await can be used as well)
tiktokLiveConnection.connect().then(state => {
    console.info(`Connected to roomId ${state.roomId}`);
}).catch(err => {
    console.error('Failed to connect', err);
})

tiktokLiveConnection.on('connected', state => {
    console.log('Hurray! Connected!', state);
})

tiktokLiveConnection.on('disconnected', () => {
    console.log('Disconnected :(');
})

// Define the events that you want to handle
// In this case we listen to chat messages (comments)
tiktokLiveConnection.on('chat', async data => {
  if (data.comment.startsWith(prefix)) return;
  try {
    const tiktokLiveChannel = client.channels.cache.get(tiktokLiveChannelId);

    if(!tiktokLiveChannel) throw new Error('No Tiktok Channel Id provided')

		const tiktokLiveEmbed = new EmbedBuilder()
		.setTitle(`${data.nickname}: ${data.comment}`)
		.setColor(0x40E0D0)

		await (tiktokLiveChannel as TextChannel).send({ embeds: [tiktokLiveEmbed] });
  } catch (error) {
    console.error('Error handling tiktok live:', error);
  }
})

// And here we receive gifts sent to the streamer
tiktokLiveConnection.on('gift', async data => {
  try {
		const tiktokLiveChannel = client.channels.cache.get(tiktokLiveChannelId);
		const tiktokLiveEmbed = new EmbedBuilder()
		.setTitle(`${data.nickname} ay nagbigay ng ${data.giftId}`)
		.setDescription(`**MARAMING SALAMAT PO SA GIFT!!! <3**`)
		.setColor(0x40E0D0)

		await (tiktokLiveChannel as TextChannel).send({ embeds: [tiktokLiveEmbed] });
		// console.log(`${data.nickname} joins the stream!`);
	} catch (error) {
		console.error('Error handling tiktok live gift:', error);
	}
    // console.log(`${data.uniqueId} (userId:${data.userId}) sends ${data.giftId}`);
})

tiktokLiveConnection.on('member', async data => {
	try {
		const tiktokLiveChannel = client.channels.cache.get(tiktokLiveChannelId);
		const tiktokLiveEmbed = new EmbedBuilder()
		.setTitle(`**${data.nickname}** ay sumali sa stream! Hello po welcome po <3`)
		// .setDescription(`Hello Welcome po sa stream <3`)
		.setColor(0x40E0D0)

		await (tiktokLiveChannel as TextChannel).send({ embeds: [tiktokLiveEmbed] });
		// console.log(`${data.nickname} joins the stream!`);
	} catch (error) {
		console.error('Error handling tiktok live member:', error);
	}
})

tiktokLiveConnection.on('follow', async (data) => {
  try {
		const tiktokLiveChannel = client.channels.cache.get(tiktokLiveChannelId);
		const tiktokLiveEmbed = new EmbedBuilder()
		.setTitle(`${data.nickname} ay nag follow`)
		.setDescription(`**MARAMING SALAMAT PO SA PAG FOLLOW!!! <3**`)
		.setColor(0x40E0D0)

		await (tiktokLiveChannel as TextChannel).send({ embeds: [tiktokLiveEmbed] });
		// console.log(`${data.nickname} joins the stream!`);
	} catch (error) {
		console.error('Error handling tiktok live follow:', error);
	}
  // console.log(data.uniqueId, "followed!");
})

client.login(ENV.token);