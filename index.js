require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL; // مثلا: https://helix-archetype-bot.onrender.com

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is missing.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// ✅ هندل /start
bot.start((ctx) => {
  const name =
    (ctx.from.first_name || '') +
    (ctx.from.last_name ? ' ' + ctx.from.last_name : '');
  ctx.reply(
    `سلام ${name || 'دوست عزیز'} 🌱
من بات تست آرکتایپ مدار هلیکس هستم.
فعلاً نسخه‌ی اولیه‌ام برای تست آنلاین بودن و پایداریه.`
  );
});

// ✅ موقت: هر پیام متنی
bot.on('text', (ctx) => {
  ctx.reply('بات فعلاً در حال آماده‌سازیه. بعداً سوال‌های شماره‌دار اینجا میان 🌀');
});

// ✅ healthcheck (برای Render / UptimeRobot)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ✅ مسیر وبهوک تلگرام
const webhookPath = '/telegram-webhook';

// فقط برای این مسیر body رو JSON بخون
app.post(webhookPath, express.json(), bot.webhookCallback(webhookPath));

// ✅ ران شدن سرور و ست کردن وبهوک
app.listen(PORT, async () => {
  console.log(`🌐 Server running on port ${PORT}`);

  if (APP_URL) {
    const webhookUrl = `${APP_URL}${webhookPath}`;
    try {
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`✅ Webhook set to: ${webhookUrl}`);
    } catch (err) {
      console.error(
        '🚨 Error setting webhook:',
        err.response?.description || err
      );
    }
  } else {
    console.log('⚠️ APP_URL is not set. Webhook not configured.');
  }
});

// ✅ خاموش شدن تمیز
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
