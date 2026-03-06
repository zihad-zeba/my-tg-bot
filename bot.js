// Load environment variables from .env file
require("dotenv").config();

// Import grammY and Express
const { Bot, InlineKeyboard } = require("grammy");
const express = require("express");

// 1. EXPRESS SERVER SETUP (Render-এর জন্য মাস্ট)
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🤖 Bot is Online and Healthy!");
});

app.listen(PORT, () => {
  console.log(`Web server is listening on port ${PORT}`);
});

// 2. IMPORT SERVICES & COMMANDS
const webflowService = require("./services/webflowService");
const startCommand = require("./commands/start");
const helpCommand = require("./commands/help");
const createImageCommand = require("./commands/createImage");
const listItemsCommand = require("./commands/listItems");
const createItemCommand = require("./commands/createItem");
const updateItemCommand = require("./commands/updateItem");
const deleteItemCommand = require("./commands/deleteItem");

// 3. BOT INSTANCE
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

/* =========================
   REGISTER COMMANDS
========================= */

bot.command("start", startCommand);
bot.command("help", helpCommand);
bot.command("create_image", createImageCommand);
bot.command("list_items", listItemsCommand);
bot.command("create_item", createItemCommand);
bot.command("update_item", updateItemCommand);
bot.command("delete_item", deleteItemCommand);

/* =========================
   INLINE BUTTON HANDLER
========================= */

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === "LIKE") {
    await ctx.reply("👍 Thanks for liking!");
  }

  if (data === "DISLIKE") {
    await ctx.reply("👎 Sorry! I will improve.");
  }

  await ctx.answerCallbackQuery();
});

/* =========================
   UNKNOWN TEXT HANDLER
========================= */

bot.on("message:text", (ctx) => {
  ctx.reply("❓ Unknown command. Type /help to see available commands.");
});

/* =========================
   START BOT (POLLING MODE)
========================= */

bot.start({
  onStart: () => {
    console.log("🤖 Bot is running in polling mode with Webflow CMS support...");
  },
});
