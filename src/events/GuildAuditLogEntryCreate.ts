import { AuditLogEvent, Client, Events, GatewayIntentBits } from "discord.js";
import 'dotenv/config';

const auditLogChannelId = process.env.AUDIT_LOG_CHANNEL_ID
if(!auditLogChannelId) throw new Error('No audit log channel id provided')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ],
});

// listens to member bans
export default {
  name: Events.GuildAuditLogEntryCreate,
  async execute(_auditlog: any,guild: any) {
    if (!guild) {
      console.error('Guild is undefined in guildAuditLogEntryCreate event.');
      return;
    }
    try {

      const fetchedLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent,
        limit: 1,
      }); 
      const logsEntry = fetchedLogs.entries.first();
      
      // Define your variables.
	    const { action, executor, target } = logsEntry;
      const executer = executor
      const targetUser = target

      // send the message in the audit log channel
      const auditLogChannel = await guild.channels.cache.get(auditLogChannelId)
      auditLogChannel.send(`${executer.globalName}(${executer.username}) has ${AuditLogEvent[action]} ${targetUser.globalName}(${targetUser.username}).`)
      
    } catch (error) {
      console.log(error)
    }
  }
}