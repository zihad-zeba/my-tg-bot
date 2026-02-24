// Load environment variables from .env file
require("dotenv").config();

// Import grammY Bot class
const { Bot, InlineKeyboard } = require("grammy");

// Import Webflow service for CMS operations
const webflowService = require("./services/webflowService");

// Import commands from commands folder
const startCommand = require("./commands/start");
const helpCommand = require("./commands/help");
const createImageCommand = require("./commands/createImage");
const listItemsCommand = require("./commands/listItems");
const createItemCommand = require("./commands/createItem");
const updateItemCommand = require("./commands/updateItem");
const deleteItemCommand = require("./commands/deleteItem");

// Create bot instance with your Telegram token
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

/* =========================
   REGISTER COMMANDS
========================= */

// /start command
bot.command("start", startCommand);

// /help command
bot.command("help", helpCommand);

// /create_image command
bot.command("create_image", createImageCommand);

// Webflow CMS commands
bot.command("list_items", listItemsCommand);
bot.command("create_item", createItemCommand);
bot.command("update_item", updateItemCommand);
bot.command("delete_item", deleteItemCommand);

/* =========================
   INLINE BUTTON HANDLER
========================= */

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  // Like button clicked
  if (data === "LIKE") {
    await ctx.reply("👍 Thanks for liking!");
  }

  // Dislike button clicked
  if (data === "DISLIKE") {
    await ctx.reply("👎 Sorry! I will improve.");
  }

  // Remove loading animation on button click
  await ctx.answerCallbackQuery();
});

/* =========================
   UNKNOWN TEXT HANDLER
========================= */

// For any text message that is not a command
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