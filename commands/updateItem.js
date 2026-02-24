const { updateItem } = require("../services/webflowService");

module.exports = async (ctx) => {
  try {
    const [cmd, id, ...rest] = ctx.message.text.split(" ");
    const newName = rest.join(" ");
    if (!id || !newName)
      return ctx.reply("⚠️ Example: /update_item ITEM_ID New Name");

    const updated = await updateItem(id, { name: newName });
    ctx.reply(`✅ Item updated: ${updated.name}`);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Failed to update item.");
  }
};