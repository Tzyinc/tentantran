require('dotenv').load();

// communicate with user
const Telegraf = require('telegraf');
// communicate with telegram server
const Telegram = require('telegraf/telegram');
const { initExpressServer, getExpressFileLink } = require('./utils/file');
const ocr = require('./utils/ocr');
const translate = require('./utils/translate');

initExpressServer();

const tempBotToken = process.env.BOT_TOKEN;


console.log('telegram bot started');

let bot;
let telegram;
if (tempBotToken) {
  bot = new Telegraf(tempBotToken);
  telegram = new Telegram(tempBotToken, []);
} else {
  bot = new Telegraf(process.env.BOT_TOKEN);
  telegram = new Telegram(process.env.BOT_TOKEN, []);
}
bot.start(ctx => ctx.reply('Hi! im a test bot!'));
bot.help(ctx => ctx.reply('Send me some image or text to translate!'));
bot.on('message', (ctx) => {
  const promises = [];
  if (ctx.message.photo) {
    const photos = ctx.message.photo;
    for (let i = 0; i < photos.length; i += 1) {
      const photo = photos[i];
      promises.push(telegram.getFileLink(photo.file_id));
    }
    Promise.all(promises)
      .then(values => getExpressFileLink(values[values.length - 1]))
      .then(publicUrl => ocr(publicUrl))
      .then(text => console.log('text:', text));
  } else if (ctx.message.text) {
    translate(encodeURIComponent(ctx.message.text), 'en').then((res) => {
      let returnVal = '';
      res.forEach((item) => {
        returnVal += `${item.translatedText}\n`;
      });
      ctx.reply(`Translated: ${returnVal}`);
    });
  }
});
bot.hears('hi', ctx => ctx.reply('Hey there'));
bot.startPolling();
