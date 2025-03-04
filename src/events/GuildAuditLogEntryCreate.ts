import {
  AuditLogEvent,
  ChannelType,
  EmbedBuilder,
  Events,
  Guild,
  GuildAuditLogsEntry,
  Invite,
  Role,
  User,
} from 'discord.js';
import 'dotenv/config';
import getHour from '../globalUtils/getHour.js';
import createEmbed from '../globalUtils/createEmbed.js';
import { createEmbedType } from '../types/createEmbed.js';

const auditLogChannelId = process.env.AUDIT_LOG_CHANNEL_ID;
const adminRoleId = process.env.ADMIN_ROLE_ID
if (!auditLogChannelId) throw new Error('No audit log channel id provided');
if (!adminRoleId) throw new Error('No admin role id provided');

const adminBanCount = new Map();

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
      const adminId = executorName.id

      // Convert to GMT+8
      const options: Intl.DateTimeFormatOptions  = {
        timeZone: "Asia/Shanghai", // GMT+8 (Philippines)
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true // 12-hour format with AM/PM
      };

      const currentDate = Date.now();
      const formattedDate = new Intl.DateTimeFormat('en-US', options).format(currentDate);
      

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
            `<@${executorName.id}> has created an invite. ` +
              `Invitation code: ${inviteTarget.code}, ` +
              `Expiration: ${inviteTarget.maxAge ? `${getHour(inviteTarget.maxAge)}hr/s` : 'Never'}, ` +
              `Max Uses: ${inviteTarget.maxUses ? inviteTarget.maxUses : 'No Limit'}.`
          );
          break;
        }
        case AuditLogEvent.MemberKick: {
          const userTarget = targetObj as User;
          await auditLogChannel.send(
            `<@${executorName.id}> has ${auditAction} ` +
              `<@${userTarget.id}>. ` +
              `Reason: ${reason ?? 'None'}`
          );
          break;
        }
        case AuditLogEvent.MemberBanAdd: {
          const userTarget = targetObj as User;

          // Get current ban count for the moderator
          const adminData = adminBanCount.get(adminId) || { count: 0, timestamp: currentDate };

          // Reset count if it's a new day
          if (currentDate - adminData.timestamp > 86400000) { // 24 hours in milliseconds
            adminData.count = 0;
            adminData.timestamp = currentDate;
          }

          adminData.count += 1;
          adminBanCount.set(adminId, adminData);

          const MemberBanAddEmbedDescription: createEmbedType  = {
            color: '1DB954',
            title: '⚠️**Member Ban**⚠️',
            accountID: userTarget.id,
            action: 'Banned',
            reason: reason ?? "None"
          }

          const MemberBanAddEmbed = createEmbed(MemberBanAddEmbedDescription)
          
          await auditLogChannel.send({ embeds: [MemberBanAddEmbed] });
          
          if (adminData.count >= 2) {
            const ModDemoteEmbedDescription = new EmbedBuilder()
              .setColor('#1DB954')
              .setTitle('⚠️**Mod Demote**⚠️')
              .setDescription(`
                **Account**: <@${executorName.id}> | ${executorName.id}
                **Action**: Remove Moderation Role
                **Reason**: Excessive Bans
              `)
              .addFields({
                name: 'Date/Time of Action:', 
                value: `${formattedDate}`,
                inline: true
              })

            try {
              const member = await guild.members.fetch(adminId);
              const modRole = guild.roles.cache.get(adminRoleId) as Role;
          
              if (member.roles.cache.has(adminRoleId)) {
                await member.roles.remove(modRole);
                console.log(`Removed mod role from ${member.user.tag} for excessive bans.`);
          
                // Log the action in a specific channel
                auditLogChannel.send({ embeds: [ModDemoteEmbedDescription] })
              }
            } catch (error) {
              console.error(error)
            }
          }

          break;
        }
        case AuditLogEvent.MemberBanRemove: {
          const userTarget = targetObj as User;
          await auditLogChannel.send(
            `<@${executorName.id}> has Removed the Ban of ` +
              `<@${userTarget.id}>. ` +
              `Reason: ${reason ?? 'None'}`
          );
          break;
        }
        // default: {
        //   const userTarget = targetObj as User;
        //   await auditLogChannel.send(
        //     `<@${executorName.id}> has ${auditAction} ` +
        //       `<@${userTarget.id}>.`
        //   );
        // }
      }
    } catch (error) {
      console.error(error);
    }
  },
};
