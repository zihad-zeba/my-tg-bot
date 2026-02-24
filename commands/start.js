module.exports = async (ctx) => {
  await ctx.reply(
    `👋 Hello ${ctx.from.first_name}!\n\n` +
    `Use:\n/create_image YourText`
  );
};