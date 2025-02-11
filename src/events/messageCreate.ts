import { Events, Message, TextChannel } from "discord.js";
import { getChatResponse } from "../AI/getChatResponse.js";

const prefix = '!'

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
    
    if (command === 'ping') {
      message.reply('pong');
    }

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
  }
}