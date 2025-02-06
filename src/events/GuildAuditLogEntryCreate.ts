import { AuditLogEvent, Events } from "discord.js";
import 'dotenv/config';
import getHour from "../globalUtils/getHour.js";

const auditLogChannelId = process.env.AUDIT_LOG_CHANNEL_ID
if(!auditLogChannelId) throw new Error('No audit log channel id provided')

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
      
      // Define the variables.
	    const { action, executor, target, reason } = logsEntry;
      const executerName = executor
      const auditAction = AuditLogEvent[action]

      // send the message in the audit log channel
      const auditLogChannel = await guild.channels.cache.get(auditLogChannelId)
      switch(action) {
        case 40: // 'Invite Create'
          auditLogChannel.send(`${executerName.globalName}(${executerName.username}) has created an invite. Invitation code: ${target.code}, Expiration: ${target.maxAge ? `${getHour(target.maxAge)}hr/s` : 'Never'}, Max Uses: ${target.maxUses ? target.maxUses : 'No Limit'}.`)
          break
        case 20: // Member Kick
          auditLogChannel.send(`${executerName.globalName}(${executerName.username}) has ${auditAction} ${target.globalName}(${target.username}). Reason: ${reason ? reason : 'None'}`)
          break
        case 22: // Member Ban
          auditLogChannel.send(`${executerName.globalName}(${executerName.username}) has Banned ${target.globalName}(${target.username}). Reason: ${reason ? reason : 'None'}`)
          break
        case 23: // Remove Member Ban 
          auditLogChannel.send(`${executerName.globalName}(${executerName.username}) has Removed the Ban of ${target.globalName}(${target.username}). Reason: ${reason ? reason : 'None'}`)
          break
        default:
          auditLogChannel.send(`${executerName.globalName}(${executerName.username}) has ${auditAction} ${target.globalName ? target.username : ''}.`)
      }
      
    } catch (error) {
      console.log(error)
    }
  }
}