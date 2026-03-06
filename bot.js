// Load environment variables
require("dotenv").config();

// Import grammY and Express
const { Bot } = require("grammy");
const express = require("express");

// ১. রেন্ডারের জন্য EXPRESS SERVER SETUP
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🤖 Bot is Online and Running on Render!");
});

app.listen(PORT, () => {
  console.log(`Web server is listening on port ${PORT}`);
});

// ২. IMPORT COMMANDS (অন্য পেজ থেকে)
const startCommand = require("./commands/start");
const helpCommand = require("./commands/help");
const createImageCommand = require("./commands/createImage");
const listItemsCommand = require("./commands/listItems");
const createItemCommand = require("./commands/createItem");
const updateItemCommand = require("./commands/updateItem");
const deleteItemCommand = require("./commands/deleteItem");

// ৩. BOT INSTANCE
// Render Dashboard-এ 'TELEGRAM_BOT_TOKEN' অবশ্যই সেট করবেন
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

// Inline Button Handler
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (data === "LIKE") await ctx.reply("👍 Thanks for liking!");
  if (data === "DISLIKE") await ctx.reply("👎 Sorry! I will improve.");
  await ctx.answerCallbackQuery();
});

// Unknown Text Handler
bot.on("message:text", (ctx) => {
  ctx.reply("❓ Unknown command. Type /help to see available commands.");
});

// ৪. START BOT
bot.start({
  onStart: () => {
    console.log("🤖 Bot is running in polling mode...");
  },
});
