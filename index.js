// =========================
// Helix Archetype Bot - NIL Edition (Buttons, 1-5 Scale)
// =========================
const fetch=require("node-fetch");

require("dotenv").config();
const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const questions = require("./questions.json");

// -------------------------
// BASIC CONFIG
// -------------------------
const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL; // مثل: https://helix-archetype-bot.onrender.com
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing.");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const LOGO_STICKER_ID = process.env.LOGO_STICKER_ID || 'CAACAgQAAxkBAm44cGkPXdyXciBIHVlkD1ODOPDM83RLAAJEGQACIMOAUJtqsTmhZKL1NgQ';

const app = express();

// -------------------------
// ARCHETYPES & SETTINGS
// -------------------------

const archetypes = [
  { key: "creator", label: "🌈 خالق (The Creator)" },
  { key: "explorer", label: "🧭 جستجوگر (The Explorer)" },
  { key: "rebel", label: "⚡ یاغی (The Rebel)" },
  { key: "hero", label: "🛡️ قهرمان (The Hero)" },
  { key: "jester", label: "🎭 دلقک (The Jester)" },
  { key: "caregiver", label: "💗 مراقب (The Caregiver)" },
  { key: "innocent", label: "☀️ معصوم (The Innocent)" },
  { key: "lover", label: "💞 عاشق (The Lover)" },
  { key: "magician", label: "🔮 جادوگر (The Magician)" },
  { key: "sage", label: "📚 حکیم (The Sage)" },
  { key: "ruler", label: "👑 حاکم (The Ruler)" },
  { key: "everyman", label: "🤝 همدم / انسان معمولی (The Everyman)" },
];

const archetypeDescriptions = {
  creator:
    "تو وقتی زنده‌ای که در حال خلق‌کردن، طراحی‌کردن و ساختن چیزی متفاوتی. خلاقیت برایت فقط مهارت نیست، هویت است.",
  explorer:
    "روح تو با تجربه، سفر، کشف و آزادی زنده می‌شود. نمی‌توانی مدت طولانی در چارچوب بسته بمانی.",
  rebel:
    "در برابر بی‌عدالتی و قوانین بی‌منطق ساکت نمی‌مانی. می‌توانی شروع‌کننده‌ی تغییر و شکستن الگوهای فرسوده باشی.",
  hero:
    "بلند می‌شوی، می‌جنگی، می‌بری. از چالش فرار نمی‌کنی و می‌خواهی الگو و الهام‌بخش باشی.",
  jester:
    "می‌توانی فضا را سبک کنی، لبخند بیاوری و سختی‌ها را قابل تحمل‌تر کنی. شوخی برایت یک زبان ارتباطی جدی است.",
  caregiver:
    "برای دیگران بودن، حمایت، همدلی و مراقبت برایت طبیعی است. امنیت عاطفی می‌سازی.",
  innocent:
    "نگاهت شفاف و امیدوارانه است. به خوبی و صداقت باور داری و دلت می‌خواهد دنیا جای سالم‌تری باشد.",
  lover:
    "با عشق، رابطه، صمیمیت و زیبایی جان می‌گیری. حضور تو کیفیت احساسی فضا را بالا می‌برد.",
  magician:
    "الگوها را می‌بینی، عمق را درک می‌کنی و می‌توانی تغییر واقعی بسازی. تبدیل کردن ایده به تجربه، قلمرو توست.",
  sage:
    "دنبال فهمیدن، تحلیل و حقیقتی. دانش و آگاهی برایت جوهر قدرت است.",
  ruler:
    "دوست داری مسئولیت بگیری، ساختار بسازی و کیفیت را حفظ کنی. رهبری برایت طبیعی است.",
  everyman:
    "خودمانی، واقعی و بی‌ادعا هستی. برایت مهم است که بخشی از یک جمع اصیل و صمیمی باشی.",
};

const TOTAL_QUESTIONS = questions.length; // باید 120 باشد
const QUESTIONS_PER_ARCHETYPE = TOTAL_QUESTIONS / archetypes.length; // 10
const MAX_SCORE_PER_QUESTION = 5;
const MAX_SCORE_PER_ARCHETYPE = QUESTIONS_PER_ARCHETYPE * MAX_SCORE_PER_QUESTION;

// -------------------------
// STATE
// -------------------------

// userId → { order, currentIndex, scores{key}, finished, name }
const userState = new Map();

// -------------------------
// HELPERS
// -------------------------

// ساخت آرایه رندوم 1..N
function createShuffledQuestions() {
  const arr = [];
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) arr.push(i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// بر اساس شماره سوال، آرکتایپ مربوطه
function getArchetypeKeyForQuestion(qNumber) {
  if (qNumber < 1 || qNumber > TOTAL_QUESTIONS) return null;
  const index = Math.floor((qNumber - 1) / QUESTIONS_PER_ARCHETYPE); // 0..11
  const archetype = archetypes[index];
  return archetype ? archetype.key : null;
}

// ساخت نمودار متنی ساده (0 تا 10 بلوک)
function makeBar(percent) {
  const blocks = Math.round(percent / 10); // 0..10
  const filled = "▓".repeat(blocks);
  const empty = "░".repeat(10 - blocks);
  return filled + empty;
}



// -------------------------
// BOT: START & FLOW
// -------------------------

bot.start(async(ctx) => {
  const userId = ctx.from.id;
  const name =
    (ctx.from.first_name || "") +
    (ctx.from.last_name ? " " + ctx.from.last_name : "");

  // آماده‌سازی وضعیت کاربر
  const scores = {};
  archetypes.forEach((a) => (scores[a.key] = 0));

  userState.set(userId, {
    name: name || "دوست عزیز",
    order: createShuffledQuestions(),
    currentIndex: 0,
    scores,
    finished: false,
  });
  if(LOGO_STICKER_ID){
    try{
      await ctx.replyWithSticker(LOGO_STICKER_ID);
    }catch(err){
      console.error("🚨 Failed to send logo sticker:", err);
    }
  }

  

  const intro =
    "🪐 <b>Helix Archetype Bot</b>\n" +
    "Nurturing Innovative Leadership\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "به تست آرکتایپ نیل خوش اومدی 🌱\n\n" +
    "🔢 <b>نحوه امتیازدهی (۱ تا ۵):</b>\n" +
    "۱️⃣ اصلاً من نیستم\n" +
    "۲️⃣ یه کم منم\n" +
    "۳️⃣ تا حدی منم\n" +
    "۴️⃣ خیلی منم\n" +
    "۵️⃣ کاملاً خودِ منم\n\n" +
    "سریع، حسی و بدون وسواس جواب بده. آماده‌ای؟";

  ctx.reply(intro, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("🚀 شروع تست", "start_quiz")],
    ]),
  });
});

// شروع تست بعد از زدن دکمه
bot.action("start_quiz", (ctx) => {
  const userId = ctx.from.id;
  const state = userState.get(userId);

  if (!state) {
    // اگر به هر دلیل state نیست، دوباره /start بخواد
    return ctx.answerCbQuery("برای شروع، /start رو بفرست 🌱", { show_alert: true });
  }

  if (state.finished) {
    return ctx.answerCbQuery("تستت قبلاً تموم شده. برای شروع دوباره /start رو بفرست.");
  }

  ctx.answerCbQuery();
  sendNextQuestion(ctx);
});

// هندل انتخاب امتیاز ۱ تا ۵ با دکمه
bot.action(/^score_([1-5])$/, (ctx) => {
  const userId = ctx.from.id;
  const state = userState.get(userId);

  if (!state || state.finished) {
    ctx.answerCbQuery("برای شروع یا تکرار، /start رو بفرست 🌱", { show_alert: true });
    return;
  }

  const score = parseInt(ctx.match[1], 10);

  const currentIndex = state.currentIndex;
  if (currentIndex >= TOTAL_QUESTIONS) {
    state.finished = true;
    ctx.answerCbQuery();
    sendResults(ctx, state);
    return;
  }

  const realQuestionNumber = state.order[currentIndex];
  const archetypeKey = getArchetypeKeyForQuestion(realQuestionNumber);

  if (archetypeKey && state.scores[archetypeKey] !== undefined) {
    state.scores[archetypeKey] += score;
  }

  state.currentIndex += 1;

  ctx.answerCbQuery(`امتیاز ${score} ثبت شد ✅`);

  if (state.currentIndex >= TOTAL_QUESTIONS) {
    state.finished = true;
    return sendResults(ctx, state);
  }

  return sendNextQuestion(ctx);
});

// ارسال سوال بعدی با دکمه‌ها
function sendNextQuestion(ctx) {
  const userId = ctx.from.id;
  const state = userState.get(userId);

  if (!state) {
    return ctx.reply("برای شروع تست، /start رو بفرست 🌱");
  }

  if (state.finished || state.currentIndex >= TOTAL_QUESTIONS) {
    state.finished = true;
    return sendResults(ctx, state);
  }

  const displayNumber = state.currentIndex + 1;
  const realQuestionNumber = state.order[state.currentIndex];
  const text = questions[realQuestionNumber - 1];

  if (!text) {
    return ctx.reply("خطا در بارگذاری سؤال. لطفاً بعداً دوباره تلاش کن 🙏");
  }

  const message =
    `📝 سؤال ${displayNumber} از ${TOTAL_QUESTIONS}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `${text}\n\n` +
    "یکی از گزینه‌ها رو انتخاب کن 👇";

  ctx.reply(message, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback("1️⃣", "score_1"),
        Markup.button.callback("2️⃣", "score_2"),
        Markup.button.callback("3️⃣", "score_3"),
        Markup.button.callback("4️⃣", "score_4"),
        Markup.button.callback("5️⃣", "score_5"),
      ],
    ]),
  });
}

// -------------------------
// RESULTS
// -------------------------

function sendResults(ctx, state) {
  const results = archetypes.map((a) => {
    const raw = state.scores[a.key] || 0;
    const percent = Math.round((raw / MAX_SCORE_PER_ARCHETYPE) * 100);
    return {
      key: a.key,
      label: a.label,
      raw,
      percent,
    };
  });

  results.sort((a, b) => b.percent - a.percent);

  const top3 = results.slice(0, 3);
  const low3 = results.slice(-3).reverse();

  let msg =
    `🌌 <b>پروفایل آرکتایپی تو در NIL</b>\n` +
    "Nurturing Innovative Leadership\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `🏆 <b>سه آرکتایپ غالب تو:</b>\n`;

  top3.forEach((r, i) => {
    msg += `\n${i + 1}. ${r.label}\n`;
    msg += `▸ امتیاز: ${r.raw.toFixed(1)} از ${MAX_SCORE_PER_ARCHETYPE}\n`;
    msg += `▸ درصد: ${r.percent}%\n`;
    msg += `▸ نمودار: ${makeBar(r.percent)}\n`;
    msg += `🔹 ${archetypeDescriptions[r.key]}\n`;
  });

  msg += `\n━━━━━━━━━━━━━━━━━━\n`;
  msg += `🌑 <b>سه آرکتایپ کم‌فعال‌تر:</b>\n`;

  low3.forEach((r, i) => {
    msg += `\n${i + 1}. ${r.label}\n`;
    msg += `▸ امتیاز: ${r.raw.toFixed(1)} از ${MAX_SCORE_PER_ARCHETYPE}\n`;
    msg += `▸ درصد: ${r.percent}%\n`;
    msg += `▸ نمودار: ${makeBar(r.percent)}\n`;
    msg += `🔹 این آرکتایپ در تو کم‌فعال‌تره؛ یعنی در رفتار و تصمیم‌هات کمتر خودش رو نشون می‌ده. اگر بخوای، می‌تونی آگاهانه فضاهایی بسازی تا این بخش از شخصیتت فرصت بروز و رشد بیشتری پیدا کنه.\n`;
    msg += `▫️ ${archetypeDescriptions[r.key]}\n`;
  });

  msg +=
  "\n━━━━━━━━━━━━━━━━━━\n" +
  "این نتیجه، برچسب یا قضاوت نیست — فقط تصویریه از الگوهای فعالی که الان در تو بیشتر یا کمتر دیده می‌شن. " +
  "آگاهی ازش می‌تونه کمکت کنه مسیر رشدت رو آگاهانه‌تر انتخاب کنی. 🌱";


  // ساخت نمودار تصویری با QuickChart
const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
  type: "radar",
  data: {
    labels: archetypes.map(a => a.label),
    datasets: [{
      label: "Archetype Profile",
      data: archetypes.map(a => Math.round((state.scores[a.key] / MAX_SCORE_PER_ARCHETYPE) * 100)),
      borderColor: "rgba(90, 130, 255, 0.9)",
      backgroundColor: "rgba(90, 130, 255, 0.3)",
      pointBackgroundColor: "rgba(255, 255, 255, 0.9)",
      borderWidth: 2
    }]
  },
  options: {
    scales: {
      r: {
        angleLines: { color: "rgba(255,255,255,0.1)" },
        grid: { color: "rgba(255,255,255,0.2)" },
        pointLabels: { color: "rgba(220,220,255,0.9)", font: { size: 12 } },
        ticks: { color: "#bbb" }
      }
    },
    plugins: { legend: { display: false } },
    backgroundColor: "#0b0d2a"
  }
}))}`;

// نمایش تدریجی (ابتدا متن، بعد عکس)
ctx.reply(msg, { parse_mode: "HTML" })
  .then(() => {
    setTimeout(() => {
      ctx.replyWithPhoto(chartUrl, {
        caption: "📊 نمای کلی آرکتایپ‌های تو",
      });
    }, 2500); // ۲.۵ ثانیه بعد از نمایش متن
  });
return;

}

// -------------------------
// SERVER + WEBHOOK + HEALTH
// -------------------------

app.get("/", (req, res) => {
  res.send("Helix Archetype Bot is running 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK ✅");
});

const webhookPath = "/telegram-webhook";

app.use(express.json());

app.post(webhookPath, (req, res) => {
  bot.handleUpdate(req.body)
    .then(() => res.sendStatus(200))
    .catch((err) => {
      console.error("🚨 Error handling update:", err);
      res.sendStatus(500);
    });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (APP_URL) {
    const webhookUrl = `${APP_URL}${webhookPath}`;
    try {
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`✅ Webhook set to: ${webhookUrl}`);
    } catch (err) {
      console.error(
        "🚨 Error setting webhook:",
        err.response?.description || err
      );
    }
  } else {
    console.log("⚠️ APP_URL is not set. Webhook not configured automatically.");
  }
});

// Graceful stop (Render, etc.)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
