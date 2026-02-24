const { createItem } = require("../services/webflowService");

module.exports = async (ctx) => {
  try {
    const text = ctx.message.text.replace("/create_item", "").trim();
    if (!text) return ctx.reply("⚠️ Example: /create_item Item Name");

    const newItem = await createItem({
      name: text,
      description: "Created from Telegram Bot",
    });

    ctx.reply(`✅ Item created!\nID: ${newItem._id}`);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Failed to create item.");
  }
};