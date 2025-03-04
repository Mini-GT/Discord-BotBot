import { EmbedBuilder } from "discord.js";
import { createEmbedType } from "../types/createEmbed.js";

export default function createEmbed({
  color,
  title,
  accountID,
  action,
  reason,
}: createEmbedType): EmbedBuilder {

  const Embed = new EmbedBuilder()
    .setColor(`#${color}`)
    .setTitle(title)
    .setDescription(`
      **Account**: <@${accountID}> | ${accountID}
      **Action**: ${action}
      **Reason**: ${reason ?? 'None'}
    `)
  
  return Embed
}