import { Bot } from "grammy";
import { config } from "dotenv";
config();

export const tgBot = new Bot(process.env.BOT_TOKEN!);
