import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import 'dotenv/config';

const confessionChannelId = process.env.CONFESSION_ID;
if (!confessionChannelId) throw new Error('No confession ID channel provided');

export default {
  data: new SlashCommandBuilder()
    .setName('confess')
    .setDescription('Submits a confession')
    .addStringOption((option) =>
      option.setName('message').setDescription('What would you like to confess?').setRequired(true)
    ),

  // Add the execute function
  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    // Get the user's input from the interaction
    const confession = interaction.options.getString('message');

    if (!confession || confession.length > 1000) {
      return await interaction.reply({
        content: 'Your confession must be between 1 and 1000 characters.',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Post the confession in the designated channel
    const confessionChannel = client.channels.cache.get(confessionChannelId) as TextChannel;

    if (!confessionChannel) {
      return await interaction.reply({
        content: 'The confession channel is not set up. Please contact an admin.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const thumbnails = [
        'https://i.pinimg.com/1200x/19/6c/77/196c7728720848da2095ee2d4cf24e68.jpg',
        'https://i.pinimg.com/474x/4c/84/e8/4c84e810b6dffc2ec95ea8e3aa718216.jpg',
        'https://i.pinimg.com/474x/5f/54/9a/5f549a4733f59889153a65dafdc73c3e.jpg',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWsJRcEQpLE6hzKtcS5ERk-5WA2_UUa7z2p9_2vIYItd_9425nIdU2RYGYiolTjsvhjss&usqp=CAU',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2K2PJsA45x6BNBKScmVlp8r-Fd6KOeuSrRDCSbIdS9AROnAIyk776YpY5wCCFskaeks&usqp=CAU',
      ];

      const randomNum = Math.floor(Math.random() * thumbnails.length);
      const randomThumbnail = thumbnails[randomNum];

      // Create an embed for the confession
      const confessionEmbed = new EmbedBuilder()
        .setThumbnail(randomThumbnail)
        .setTitle(`Anonimouse Confession`)
        .setDescription(`"${confession}"`)
        .setColor(0xff69b4)
        .setTimestamp();

      // Send the confession to the designated channel
      await confessionChannel.send({ embeds: [confessionEmbed] });

      // Send a confirmation to the user (ephemeral response)
      await interaction.reply({
        content: 'Your confession has been submitted anonymously!',
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error('Error handling confession:', error);
      await interaction.reply({
        content: 'An error occurred while processing your confession. Please try again later.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
