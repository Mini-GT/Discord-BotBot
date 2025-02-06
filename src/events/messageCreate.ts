import { Events, Message } from "discord.js";

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.content.toLowerCase() === '!ping') {
        message.reply('Pong!');
    }
  }
}