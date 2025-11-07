require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL; // مثال: https://helix-archetype-bot.onrender.com

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is missing.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// ------------------ تنظیمات تست ------------------

const TOTAL_QUESTIONS = 120; // فعلاً ۱۰ سوال برای هر ۱۲ آرکتایپ
const QUESTIONS_PER_ARCHETYPE = 10;

const archetypes = [
  'خالق (Creator)',
  'جستجوگر (Explorer)',
  'یاغی (Rebel)',
  'قهرمان (Hero)',
  'دلقک (Jester)',
  'مراقب (Caregiver)',
  'معصوم (Innocent)',
  'عاشق (Lover)',
  'جادوگر (Magician)',
  'حکیم (Sage)',
  'حاکم (Ruler)',
  'همدم (Everyman)',
];

// نگاشت شماره سوال به آرکتایپ
function getArchetypeForQuestion(qNumber) {
  if (qNumber < 1 || qNumber > TOTAL_QUESTIONS) return null;
  const index = Math.floor((qNumber - 1) / QUESTIONS_PER_ARCHETYPE); // 0..11
  return archetypes[index] || null;
}

// وضعیت کاربران در حافظه (برای این مرحله)
const userState = new Map();
// ساختن لیست رندوم ۱..TOTAL_QUESTIONS
function createShuffledQuestions() {
  const arr = [];
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    arr.push(i);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ------------------ منطق ربات ------------------

// شروع / ریست تست
bot.start((ctx) => {
  const userId = ctx.from.id;
  const name =
    (ctx.from.first_name || '') +
    (ctx.from.last_name ? ' ' + ctx.from.last_name : '');

  const order = createShuffledQuestions();

  // آماده‌سازی ساختار امتیازها
  const scores = {};
  archetypes.forEach((a) => {
    scores[a] = 0;
  });

  userState.set(userId, {
    name: name || 'دوست عزیز',
    order,
    currentIndex: 0,
    scores,
    finished: false,
  });

  ctx.reply(
    `سلام ${name || 'دوست عزیز'} 🌱
این تست بهت کمک می‌کنه ۱۲ آرکتایپ شخصیتی‌ات رو بسنجی.

به هر جمله (فعلاً به صورت شماره) از ۰ تا ۱۰ امتیاز بده:
۰ = اصلاً شبیه من نیست
۱۰ = کاملاً این خودِ منم

بیا شروع کنیم ✅`
  ).then(() => {
    sendNextQuestion(ctx);
  });
});

// برای کاربرانی که تست رو شروع کردن، سوال بعدی رو می‌فرسته
function sendNextQuestion(ctx) {
  const userId = ctx.from.id;
  const state = userState.get(userId);

  if (!state) {
    return ctx.reply('برای شروع تست، دستور /start رو بفرست 🌱');
  }

  if (state.finished) {
    return ctx.reply('تستت قبلاً تموم شده. برای شروع دوباره /start رو بفرست.');
  }

  if (state.currentIndex >= TOTAL_QUESTIONS) {
    // تموم شده
    state.finished = true;
    return sendResults(ctx, state);
  }

  const displayNumber = state.currentIndex + 1; // شماره نمایشی
  // شماره واقعی سوال (برای نگاشت آرکتایپ)
  const realQuestionNumber = state.order[state.currentIndex];

  // فعلاً فقط شماره رو نشون می‌دیم، بعداً متن سوال همین‌جا میاد
  ctx.reply(
    `سؤال ${displayNumber} از ${TOTAL_QUESTIONS}
(کد سوال: ${realQuestionNumber})
از ۰ تا ۱۰ امتیاز بده.`
  );
}

// هندل هر پیام متنی = اگر وسط تست است، پاسخ به عنوان نمره
bot.on('text', (ctx) => {
  const userId = ctx.from.id;
  const state = userState.get(userId);

  // اگر هنوز /start نزده
  if (!state) {
    return ctx.reply('برای شروع تست آرکتایپ، دستور /start رو بفرست 🌱');
  }

  // اگر تست تمام شده
  if (state.finished) {
    return ctx.reply('تستت تموم شده. برای شروع دوباره /start رو بفرست.');
  }

  const raw = (ctx.message.text || '').trim();

  // چک عدد بودن بین ۰ تا ۱۰
  if (!/^\d+$/.test(raw)) {
    return ctx.reply('لطفاً فقط یک عدد بین ۰ تا ۱۰ بفرست 🙂');
  }

  const score = parseInt(raw, 10);
  if (score < 0 || score > 10) {
    return ctx.reply('نمره باید بین ۰ تا ۱۰ باشه 🌡️');
  }

  // ثبت امتیاز برای سوال فعلی
  const realQuestionNumber = state.order[state.currentIndex];
  const archetype = getArchetypeForQuestion(realQuestionNumber);

  if (archetype) {
    state.scores[archetype] += score;
  }

  state.currentIndex += 1;

  // اگر به آخر رسیدیم → نتیجه
  if (state.currentIndex >= TOTAL_QUESTIONS) {
    state.finished = true;
    return sendResults(ctx, state);
  }

  // در غیر این صورت → سوال بعدی
  return sendNextQuestion(ctx);
});

// محاسبه و ارسال نتیجه
function sendResults(ctx, state) {
  // نرمال‌سازی به درصد
  const results = archetypes.map((name) => {
    const rawScore = state.scores[name] || 0;
    const maxScore = QUESTIONS_PER_ARCHETYPE * 10; // هر سوال تا ۱۰
    const percent = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;
    return { name, rawScore, percent };
  });

  // مرتب‌سازی نزولی
  results.sort((a, b) => b.percent - a.percent);

  const top3 = results.slice(0, 3);
  const bottom3 = results.slice(-3);

  let msg = `✅ تست تموم شد، ${state.name} 🌟

🔺 ۳ آرکتایپ غالب تو:\n`;
  top3.forEach((r, i) => {
    msg += `${i + 1}. ${r.name}: ${r.percent}%\n`;
  });

  msg += `\n🔻 ۳ آرکتایپ کم‌فعال تو:\n`;
  bottom3.forEach((r, i) => {
    msg += `${i + 1}. ${r.name}: ${r.percent}%\n`;
  });

  msg += `\n(فعلاً فقط ساختار تست فعاله. در نسخه بعدی برای هرکدوم توضیح تفسیری هم نشون می‌دیم.)`;

  return ctx.reply(msg);
}

// ------------------ وب سرور و وبهوک ------------------

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const webhookPath = '/telegram-webhook';
app.post(webhookPath, express.json(), bot.webhookCallback(webhookPath));

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

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
