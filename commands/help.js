module.exports = async (ctx) => {
  await ctx.reply(
    `🤖 Commands:\n\n` +
    `/start\n` +
    `/help\n` +
    `/create_image YourText`
  );
};