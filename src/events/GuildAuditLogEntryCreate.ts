import {
  AuditLogEvent,
  ChannelType,
  Events,
  Guild,
  GuildAuditLogsEntry,
  Invite,
  User,
} from 'discord.js';
import 'dotenv/config';
import getHour from '../globalUtils/getHour.js';

const auditLogChannelId = process.env.AUDIT_LOG_CHANNEL_ID;
if (!auditLogChannelId) throw new Error('No audit log channel id provided');

// listens to member bans
export default {
  name: Events.GuildAuditLogEntryCreate,
  async execute(auditlog: GuildAuditLogsEntry, guild: Guild) {
    if (!guild) {
      console.error('Guild is undefined in guildAuditLogEntryCreate event.');
      return;
    }
    try {
      const fetchedLogs = await guild.fetchAuditLogs({
        type: auditlog.action,
        limit: 1,
      });

      const logsEntry = fetchedLogs.entries.first();
      if (!logsEntry) return;

      // Define the variables.
      const { action, executor, target, reason } = logsEntry;
      const executorName = executor as User;
      const auditAction = AuditLogEvent[action];
      const targetObj = target;

      // Get the audit log channel and check if it's a text channel
      const channel = guild.channels.cache.get(auditLogChannelId);
      if (!channel || channel.type !== ChannelType.GuildText) {
        console.error('Audit log channel not found or is not a text channel');
        return;
      }

      const auditLogChannel = channel;

      // send the message in the audit log channel
      if (!auditLogChannel) {
        console.error('Audit log channel not found');
        return;
      }

      switch (action) {
        case AuditLogEvent.InviteCreate: {
          const inviteTarget = targetObj as Invite;
          await auditLogChannel.send(
            `${executorName.globalName}(${executorName.username}) has created an invite. ` +
              `Invitation code: ${inviteTarget.code}, ` +
              `Expiration: ${inviteTarget.maxAge ? `${getHour(inviteTarget.maxAge)}hr/s` : 'Never'}, ` +
              `Max Uses: ${inviteTarget.maxUses ? inviteTarget.maxUses : 'No Limit'}.`
          );
          break;
        }
        case AuditLogEvent.MemberKick: {
          const userTarget = targetObj as User;
          await auditLogChannel.send(
            `${executorName.globalName}(${executorName.username}) has ${auditAction} ` +
              `${userTarget.globalName}(${userTarget.username}). ` +
              `Reason: ${reason ?? 'None'}`
          );
          break;
        }
        case AuditLogEvent.MemberBanAdd: {
          const userTarget = targetObj as User;
          await auditLogChannel.send(
            `${executorName.globalName}(${executorName.username}) has Banned ` +
              `${userTarget.globalName}(${userTarget.username}). ` +
              `Reason: ${reason ?? 'None'}`
          );
          break;
        }
        case AuditLogEvent.MemberBanRemove: {
          const userTarget = targetObj as User;
          await auditLogChannel.send(
            `${executorName.globalName}(${executorName.username}) has Removed the Ban of ` +
              `${userTarget.globalName}(${userTarget.username}). ` +
              `Reason: ${reason ?? 'None'}`
          );
          break;
        }
        default: {
          const userTarget = targetObj as User;
          await auditLogChannel.send(
            `${executorName.globalName}(${executorName.username}) has ${auditAction} ` +
              `${userTarget.globalName ? userTarget.username : ''}.`
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  },
};
