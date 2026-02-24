// Import InlineKeyboard
const { InlineKeyboard } = require("grammy");

module.exports = async (ctx) => {
  try {
    // Get full message text
    const fullText = ctx.message.text;

    // Remove command part
    const userText = fullText.replace("/create_image", "").trim();

    // Check if user provided text
    if (!userText) {
      return ctx.reply("⚠️ Please provide some text.\nExample:\n/create_image Hello");
    }

    // Placeholder image URL
    const imageUrl =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlGilVEo09-UhUcbGO6sIrtyZOdyKBJvpG9g&s";

    // Inline buttons
    const keyboard = new InlineKeyboard()
      .text("👍 Like", "LIKE")
      .text("👎 Dislike", "DISLIKE");

    // Send image
    await ctx.replyWithPhoto(imageUrl, {
      caption: `🖼️ Generated Image for:\n"${userText}"`,
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error("Create Image Error:", err);
    ctx.reply("❌ Something went wrong while generating the image.");
  }
};