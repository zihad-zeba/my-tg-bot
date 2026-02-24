const { deleteItem } = require("../services/webflowService");

module.exports = async (ctx) => {
  try {
    const id = ctx.message.text.replace("/delete_item", "").trim();
    if (!id) return ctx.reply("⚠️ Example: /delete_item ITEM_ID");

    await deleteItem(id);
    ctx.reply(`✅ Item deleted: ${id}`);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Failed to delete item.");
  }
};