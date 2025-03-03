import { Channel, Client, EmbedBuilder, Events, GatewayIntentBits, Guild, GuildMember, Message, TextChannel } from "discord.js";
import { getChatResponse } from "../AI/getChatResponse.js";
import ytdl from '@distube/ytdl-core'
import { isSpotifyUrl } from "../globalUtils/spotify/isSpotifyUrl.js";
import { spotifyToYouTube } from "../globalUtils/spotify/spotifyToYoutube.js";
import { createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { QueueConstructType, Song } from "../types/queueConstruct.types.js";
import play from 'play-dl'
import fs from 'node:fs/promises';
import path from "node:path";
import { fileURLToPath } from 'node:url';

const guildId = process.env.GUILD_ID
const prefix = '!'
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cookiesPath = path.join(__dirname, '../../cookies.json');
const cookiesData = await fs.readFile(cookiesPath, 'utf8');
const agent = ytdl.createAgent(JSON.parse(cookiesData))

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates
  ],
});

export const queue = new Map();

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    // Ignore messages from bots and messages that don't start with the prefix
    if (message.author.bot || !message.content.startsWith(prefix)) return;
    
    // Split the message into command and arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName  = args.shift();

    if (!commandName) return;
    const command = commandName.toLowerCase();
    
    // ping command
    if (command === 'ping') {
      message.reply('pong');
    }

    // chat command
    if (command === 'chat') {
      // Get the user's input (the rest of the message)
      const chatMessage = args.join(' ').toLowerCase();

      if (!chatMessage) {
        return message.reply('Please start a conversation.');
      };

      try {
        await (message.channel as TextChannel).sendTyping()
  
        const res = await getChatResponse(chatMessage);
       
        // Check if the response is valid
        if (!res || res.trim() === '') {
          await message.reply('Couldn\'t understand your words');
          return;
        }
  
        // Send the response to the channel
        await message.reply(res);
      } catch (error) {
        console.error(error);
        message.reply('AWIT!!!! may error sa server');
      }
    }

    if (command === 'review') {
      const reviewMessage = args.join(' ').toLowerCase();
      message.reply(reviewMessage);
    }
    
    // play command
    const serverQueue = queue.get(guildId);

    if(command === 'play') {
      // Get the user's input (the rest of the message)
      const query = args.join(' ').toLowerCase();
     
      if (!query) {
        return message.reply('Please provide a YouTube or Spotify URL.');
      };

      if (!message.member?.voice.channel) {
        return message.reply('You need to be in a voice channel to play music!');
      };

      const url = args[0];
      if(!message.guild) {
        throw new Error('Cannot find Guild Id')
      }

      try {
        let videoUrl = url;
        let songInfo;

        // Handle Spotify URLs
        if (isSpotifyUrl(url)) {
          //solution see: https://github.com/discordjs/discord.js/issues/3622#issuecomment-565526742
          (message.channel as TextChannel).send('Processing Spotify track...');
          const spotifyData = await spotifyToYouTube(url);
          videoUrl = spotifyData.youtubeUrl;
          songInfo = spotifyData.spotifyTrackInfo;
        }

        if (!ytdl.validateURL(videoUrl)) {
          const searched = await play.search(query, { limit : 1 })
					if(!searched) {
						return message.reply('Cannot find the song url');
					}
	
					videoUrl = searched[0].url
        }

        const videoInfo = await ytdl.getInfo(videoUrl, { agent });

        const song = {
          title: songInfo ? `${songInfo.name} - ${songInfo.artists[0].name}` : videoInfo.videoDetails.title,
          url: videoUrl,
          duration: videoInfo.videoDetails.lengthSeconds,
          requestedBy: message.author.tag
        };
        
        if (!serverQueue) {
          const queueConstruct: QueueConstructType = {
            textChannel: message.member.voice.channel,
            voiceChannel: message.member.voice.channel,
            connection: null,
            songs: [],
            playing: true
          };
        
          queue.set(message.guild.id, queueConstruct);
          queueConstruct.songs.push(song);
          try {
            const connection = joinVoiceChannel({
              channelId: message.member.voice.channel.id,
              guildId: message.guild.id,
              adapterCreator: message.guild.voiceAdapterCreator,
              selfDeaf: true,
              selfMute: false  
            });
  
            queueConstruct.connection = connection;
            playSong(message.guild.id, queueConstruct.songs[0]);
          } catch (error) {
            console.error('Error joining voice channel:', error);
            queue.delete(message.guild.id);
            return message.reply('There was an error joining the voice channel!');
          }

        } else {
          serverQueue.songs.push(song);
          const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('Added to Queue')
            .setDescription(`**${song.title}**`)
            .addFields(
              { name: 'Duration', value: `${Math.floor(Number(song.duration) / 60)}:${(Number(song.duration) % 60).toString().padStart(2, '0')}`, inline: true },
              { name: 'Requested By', value: song.requestedBy, inline: true }
            );
          return message.reply({ embeds: [embed] });
        }
      } catch (error) {
        console.log(error);
    	  return message.reply('An error occurred while processing your request!');
      }
    } else if (command === 'stop') {
      stopSong(message, serverQueue);
    }

    async function playSong(guild: string, song: Song) {
      console.log(song)
    	const serverQueue = queue.get(guild);

    	if (!song) {
    		// Start a 5-minute timeout before disconnecting
    		// serverQueue.timeout = setTimeout(async () => {
    		// 	try {
    		// 		// Send a message to the text channel before leaving
    		// 		await serverQueue.textChannel.send('Leaving the voice channel due to inactivity. Goodbye! 👋');
    		// 	} catch (error) {
    		// 		console.error('Failed to send leave message:', error);
    		// 	}

    			serverQueue.connection.destroy();
    			queue.delete(guild);
    			console.log(`Left the voice channel due to inactivity.`);
    		// }, 5 * 60 * 1000);
    		return;
    	}

    	// Clear the timeout if a new song is being played
    	// if (serverQueue.timeout) {
    	// 	clearTimeout(serverQueue.timeout);
    	// 	serverQueue.timeout = null;
    	// }

    	try {
        // const stream = await play.stream(song.url);
        
        //------------For playdl------------
    		// const resource = createAudioResource(stream.stream, {
        //   inputType: stream.type,
        // });

        const stream = ytdl(song.url, {
          // fix issue[temporary]: https://github.com/distubejs/ytdl-core/issues/201#issuecomment-2669944639
          // filter: 'audioonly',
          quality: 'highestaudio',
          highWaterMark: 1 << 25,
        });

        //------------For ytdl------------
        const resource = createAudioResource(stream);

    		const player = createAudioPlayer();

    		player.play(resource);
        
    		serverQueue.connection.subscribe(player);

        player.on('stateChange', (oldState, newState) => {
          console.log(`Player state changed from ${oldState.status} to ${newState.status}`);
          if (newState.status === 'idle') {
            // serverQueue.songs.push(serverQueue.songs[0])
            serverQueue.songs.shift();
            playSong(guild, serverQueue.songs[0]);
          }
        });

    		const embed = new EmbedBuilder()
    		.setColor('#1DB954')
    		.setTitle('Now Playing')
    		.setDescription(`**${song.title}**`)
    		.addFields(
    			{ name: 'Duration', value: `${Math.floor(Number(song.duration) / 60)}:${(Number(song.duration) % 60).toString().padStart(2, '0')}`, inline: true },
    			{ name: 'Requested By', value: song.requestedBy, inline: true }
    		);

    		serverQueue.textChannel.send({ embeds: [embed] });
    	} catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('410')) {
              serverQueue.textChannel.send('This video is unavailable. Skipping...');
              serverQueue.songs.shift();
          } else {
              serverQueue.textChannel.send('An error occurred while trying to play the song!');
          }
        } else {
            serverQueue.textChannel.send('An unexpected error occurred!');
        }
        console.error(error)
        serverQueue.songs.shift();
        playSong(guild, serverQueue.songs[0]);
    	}
    };

    function stopSong(message: Message, serverQueue: any) {
      if(!message.member || !message.guild) throw new Error('Cannot find message')

      if (!message.member.voice.channel) {
      		return message.reply('You need to be in a voice channel to stop the music!');
      }

      if (!serverQueue) {
        return message.reply('There is no song playing!');
      }

      message.reply('copy master🫡')
      serverQueue.songs = [];
      serverQueue.connection.destroy();
      queue.delete(message.guild.id);
    }
  }
}

client.login(process.env.DISCORD_TOKEN);