const { getItems } = require("../services/webflowService");

module.exports = async (ctx) => {
  try {
    const items = await getItems();
    
    if (!items.length) return ctx.reply("No items found.");

    let message = "📋 Items in Webflow CMS:\n\n";
    items.forEach((item, i) => {
      console.log(item);
      message += `${i + 1}. ${item.name}\n${item.description || ""}\n\n`;
    });

    ctx.reply(message);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Failed to fetch items.");
  }
};