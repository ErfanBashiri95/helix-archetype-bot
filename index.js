// =========================
// Helix Archetype Bot - Final Professional Version
// =========================

import express from "express";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// -------------------------
// CONFIGURATION
// -------------------------
const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 10000;

// Read questions from JSON file
const questions = JSON.parse(fs.readFileSync("./questions.json", "utf8"));

// Archetypes list (12 types)
const archetypes = [
  "خالق (The Creator)",
  "جستجوگر (The Explorer)",
  "یاغی (The Rebel)",
  "قهرمان (The Hero)",
  "دلقک (The Jester)",
  "مراقب (The Caregiver)",
  "معصوم (The Innocent)",
  "عاشق (The Lover)",
  "جادوگر (The Magician)",
  "حکیم (The Sage)",
  "حاکم (The Ruler)",
  "همدم یا انسان معمولی (The Everyman)",
];

// Archetype descriptions
const archetypeDescriptions = {
  "خالق (The Creator)": "✨ خالق نوآور و خیال‌پرداز است. همیشه به دنبال خلق چیزهای تازه است و از تکرار بیزار. خلاقیت برایش راهی برای معنا دادن به زندگی است.",
  "جستجوگر (The Explorer)": "🧭 جستجوگر عاشق تجربه، کشف و آزادی است. در ناشناخته‌ها احساس زنده بودن می‌کند و از چارچوب‌ها فراری است.",
  "یاغی (The Rebel)": "⚡ یاغی قانون‌شکن مثبت است! او می‌خواهد نظم‌های ناعادلانه را بشکند و جهان را تغییر دهد، حتی اگر تنها بماند.",
  "قهرمان (The Hero)": "🛡️ قهرمان با شجاعت به چالش‌ها حمله می‌کند. شکست برایش پایان نیست، فقط مرحله‌ای از رشد است.",
  "دلقک (The Jester)": "🎭 دلقک شادی‌آفرین است. از خنده برای ایجاد ارتباط، رهایی از سختی‌ها و معنا بخشیدن به لحظه‌ها استفاده می‌کند.",
  "مراقب (The Caregiver)": "💗 مراقب با قلبی مهربان، مراقب دیگران است. عشق و حمایت را در عمل نشان می‌دهد، نه فقط در حرف.",
  "معصوم (The Innocent)": "☀️ معصوم باور دارد که دنیا جای زیبایی است. او به پاکی، صداقت و خیر در انسان‌ها ایمان دارد.",
  "عاشق (The Lover)": "💞 عاشق با احساس و شور زندگی می‌کند. زیبایی، عشق و پیوند برایش مقدس‌اند.",
  "جادوگر (The Magician)": "🔮 جادوگر باور دارد که تغییر از درون آغاز می‌شود. می‌تواند رویاها را به واقعیت تبدیل کند.",
  "حکیم (The Sage)": "📚 حکیم عاشق فهمیدن و کشف حقیقت است. دانش برایش قدرت است و خرد هدف نهایی.",
  "حاکم (The Ruler)": "👑 حاکم رهبر ذاتی است. نظم، کنترل و ساختار را دوست دارد و در مسئولیت آرامش می‌یابد.",
  "همدم یا انسان معمولی (The Everyman)": "🤝 همدم صادق، فروتن و واقعی است. به تعلق، سادگی و ارتباط انسانی ارزش می‌دهد.",
};

// -------------------------
// BOT STATE
// -------------------------
const userState = new Map();
const TOTAL_QUESTIONS = questions.length;
const QUESTIONS_PER_ARCHETYPE = TOTAL_QUESTIONS / archetypes.length;

// -------------------------
// UTILITIES
// -------------------------

// تبدیل اعداد فارسی و عربی به انگلیسی
function normalizeNumbers(input) {
  return input
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632));
}

// رندوم کردن ترتیب سوالات
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// -------------------------
// BOT LOGIC
// -------------------------

bot.start((ctx) => {
  const userId = ctx.from.id;
  userState.set(userId, {
    scores: Array(archetypes.length).fill(0),
    currentIndex: 0,
    order: shuffle(Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i + 1)),
    finished: false,
  });
  ctx.reply(
    "🪐 به تست آرکتایپ نیل خوش اومدی!\n\nبه هر جمله از ۰ تا ۱۰ امتیاز بده، بر اساس اینکه چقدر اون جمله بهت شباهت داره.\n\nبزن بریم 👇"
  );
  sendNextQuestion(ctx);
});

bot.on("text", (ctx) => {
  const userId = ctx.from.id;
  const state = userState.get(userId);

  if (!state || state.finished) {
    return ctx.reply("برای شروع دوباره، دستور /start رو بفرست 🌱");
  }

  // نرمال‌سازی ورودی
  const userInput = normalizeNumbers(ctx.message.text.trim());
  const score = parseFloat(userInput);

  if (isNaN(score) || score < 0 || score > 10) {
    return ctx.reply("لطفاً یک عدد بین صفر تا ده بفرست 🔢");
  }

  const currentQuestion = state.order[state.currentIndex];
  const archetypeIndex = Math.floor((currentQuestion - 1) / QUESTIONS_PER_ARCHETYPE);
  state.scores[archetypeIndex] += score;
  state.currentIndex++;

  if (state.currentIndex >= TOTAL_QUESTIONS) {
    state.finished = true;
    return sendResults(ctx, state);
  }

  sendNextQuestion(ctx);
});

function sendNextQuestion(ctx) {
  const userId = ctx.from.id;
  const state = userState.get(userId);
  const displayNumber = state.currentIndex + 1;
  const realQuestionNumber = state.order[state.currentIndex];
  const text = questions[realQuestionNumber - 1];

  ctx.reply(
    `سؤال ${displayNumber} از ${TOTAL_QUESTIONS}:\n\n${text}\n\nاز ۰ تا ۱۰ امتیاز بده.`,
    { parse_mode: "HTML" }
  );
}

// -------------------------
// RESULTS CARD
// -------------------------
function sendResults(ctx, state) {
  const results = archetypes.map((name, i) => ({
    name,
    score: state.scores[i],
  }));

  const sorted = results.sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const low3 = sorted.slice(-3).reverse();

  let msg = `
<b>🌌 پروفایل آرکتایپ نیل (NIL)</b>
<b>Nurturing Innovative Leadership</b>
━━━━━━━━━━━━━━━━━━

<b>🏆 سه آرکتایپ غالب تو:</b>
`;

  top3.forEach((a, i) => {
    msg += `\n<b>${i + 1}. ${a.name}</b> | امتیاز: ${a.score.toFixed(1)}\n`;
    msg += `🔹 ${archetypeDescriptions[a.name]}\n`;
  });

  msg += `\n━━━━━━━━━━━━━━━━━━
<b>🌑 سه آرکتایپ کم‌فعال‌تر:</b>
`;

  low3.forEach((a, i) => {
    msg += `\n<b>${i + 1}. ${a.name}</b> | امتیاز: ${a.score.toFixed(1)}\n`;
    msg += `▫️ ${archetypeDescriptions[a.name]}\n`;
  });

  msg += `
━━━━━━━━━━━━━━━━━━
<b>💫 نکته پایانی:</b>
این تست تو را در قالب زبان آرکتایپ‌ها نشان می‌دهد، نه در قالب برچسب ثابت. 
از ترکیب این الگوها می‌توانی برای خودآگاهی، رهبری مؤثرتر و طراحی مسیر رشدت در NIL استفاده کنی. 🌱
`;

  ctx.reply(msg, { parse_mode: "HTML" });
}

// -------------------------
// SERVER + WEBHOOK
// -------------------------
app.get("/", (req, res) => res.send("Helix Archetype Bot is running 🚀"));
app.use(express.json());
app.post(`/telegram-webhook`, (req, res) => {
  bot.handleUpdate(req.body, res);
  res.status(200).end();
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (process.env.APP_URL) {
    const webhookUrl = `${process.env.APP_URL}/telegram-webhook`;
    bot.telegram.setWebhook(webhookUrl);
    console.log(`✅ Webhook set to: ${webhookUrl}`);
  }
});
