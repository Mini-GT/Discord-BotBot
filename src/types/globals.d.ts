import { Collection } from "discord.js";
import type { Commands } from "./Commands.js";

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Commands>
  }
}