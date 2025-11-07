require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const questions = require('./questions.json');

// ================== تنظیمات اصلی ==================

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL; // مثلا: https://helix-archetype-bot.onrender.com

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is missing.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

const archetypes = [
  { key: 'creator', name: 'خالق (Creator)' },
  { key: 'explorer', name: 'جستجوگر (Explorer)' },
  { key: 'rebel', name: 'یاغی (Rebel)' },
  { key: 'hero', name: 'قهرمان (Hero)' },
  { key: 'jester', name: 'دلقک (Jester)' },
  { key: 'caregiver', name: 'مراقب (Caregiver)' },
  { key: 'innocent', name: 'معصوم (Innocent)' },
  { key: 'lover', name: 'عاشق (Lover)' },
  { key: 'magician', name: 'جادوگر (Magician)' },
  { key: 'sage', name: 'حکیم (Sage)' },
  { key: 'ruler', name: 'حاکم (Ruler)' },
  { key: 'everyman', name: 'همدم / انسان معمولی (Everyman)' }
];

const TOTAL_QUESTIONS = questions.length; // باید ۱۲۰ باشه
const QUESTIONS_PER_ARCHETYPE = TOTAL_QUESTIONS / archetypes.length; // ۱۰

// توضیحات حرفه‌ای هر آرکتایپ
const archetypeDescriptions = {
  creator: "خالق، معمار دنیاهای جدید است. تو با ایده، طراحی، ساختن و خلق تمایز، دنیا را قابل تحمل‌تر و الهام‌بخش‌تر می‌کنی. وقتی این انرژی بالاست، می‌توانی هویت، محصول یا راه‌حل‌های منحصربه‌فرد خلق کنی. نقطه‌ی توجه: گیر نیفتادی در کمال‌گرایی و شروع نکردن؟",
  explorer: "جستجوگر، روح آزاد و عاشق تجربه است. تو وقتی زنده‌ای که در حال کشف، سفر، یادگیری و شکستن روتین باشی. این انرژی کمک می‌کند مرزهای امن تکراری را جابه‌جا کنی. حواست باشد از فرار دائمی و ناتمام گذاشتن مسیرها دوری کنی.",
  rebel: "یاغی، صدای «بس است» است. تو آن جایی وارد می‌شوی که سیستم‌ها پوسیده‌اند؛ میل به عدالت، اصالت و شکستن قفس‌ها داری. این انرژی می‌تواند تحول واقعی بسازد. مراقب باش فقط تخریب نکنی؛ عصبانیتت را تبدیل به راه‌حل و جنبش سازنده کن.",
  hero: "قهرمان، تجسم اراده، تلاش و مسئولیت‌پذیری است. تو دوست داری بایستی، بجنگی، نتیجه بگیری و الهام‌بخش باشی. این انرژی برای رهبری، مأموریت‌های سخت و عبور از بحران عالی است. مواظب فرسودگی، سخت‌گیری افراطی به خودت و دیگران باش.",
  jester: "دلقک، کیمیاگر لحظه است. تو توان تبدیل فشار به خنده و استرس به بازی را داری. این انرژی فضا را انسانی، زنده و قابل تحمل می‌کند. حرفه‌ای‌اش این است که زیر شوخی‌ها، آگاهی و صداقت باشد؛ حواست باشد پشت خنده، احساسات جدی خودت را دفن نکنی.",
  caregiver: "مراقب، قلب تپنده‌ی حمایت و همدلی است. تو امنیت عاطفی می‌سازی، حال دیگران برایت مهم است و می‌توانی نقش مربی، پرستار، همراه و حامی را عالی بازی کنی. مرزهای شخصی را فراموش نکن؛ مراقبت از خودت هم بخشی از مأموریت توست.",
  innocent: "معصوم، نگه‌دارنده‌ی امید، صداقت و سادگی است. تو دنیا را از دریچه نیت خوب، شفافیت و اعتماد می‌بینی. این انرژی اعتمادسازی و اخلاق را بالا می‌برد. حرفه‌ای‌اش این است که در عین مهربانی، ساده‌لوح نباشی و «نه» گفتن را هم بلد باشی.",
  lover: "عاشق، خالق عمق، صمیمیت و زیبایی است. تو در رابطه، احساس، لمس، نگاه و جزئیات عاطفی شکوفا می‌شوی. این انرژی برند، تیم، رابطه و فضا را زنده و جذاب می‌کند. مواظب وابستگی افراطی و از دست‌دادن خودت برای راضی‌کردن دیگران باش.",
  magician: "جادوگر، معمار تحول است. تو پترن‌ها را می‌بینی، نقاط را وصل می‌کنی و کمک می‌کنی دیگران از جایی به جای بهتر بروند. این انرژی برای کوچینگ، استراتژی، تسهیل‌گری و نوآوری عمیق فوق‌العاده است. حواست باشد در کنترل‌گری پنهان یا وعده‌های غیرواقعی نیفتی.",
  sage: "حکیم، جست‌وجوگر حقیقت است. تو طبیعتاً تحلیل‌گر، متفکر و عاشق یادگیری هستی. این انرژی کمک می‌کند تصمیم‌ها عمیق، مستند و آگاهانه باشند. مواظب به تعویق انداختن عمل به‌خاطر فکرکردن بی‌پایان و فاصله گرفتن از احساسات باش.",
  ruler: "حاکم، طراح نظم، ساختار و قدرت پایدار است. تو مسئولیت را جدی می‌گیری، دوست داری هدایت کنی، سیستم بچینی و کیفیت را حفظ کنی. این انرژی برای ساخت سازمان، تیم و استاندارد عالی است. مراقب کنترل‌گری، سخت‌گیری و فاصله گرفتن از آدم‌ها باش.",
  everyman: "همدم، فضای «باهم بودن» است. تو خودمانی، اصیل، بدون ژست و قابل اعتماد هستی. این انرژی اعتماد عمومی، تیم‌های صمیمی و فرهنگ سالم می‌سازد. حواست باشد برای پذیرفته شدن، خودت را کوچک نکنی یا از تمایزها و استعدادهای خودت غافل نشوی."
};

// ذخیره وضعیت کاربرها در حافظه
const userState = new Map();

// ================== ابزارهای کمک‌کننده ==================

// ساخت لیست رندوم سوال‌ها
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

// پیدا کردن کلید آرکتایپ بر اساس شماره سوال
function getArchetypeKeyForQuestion(qNumber) {
  if (qNumber < 1 || qNumber > TOTAL_QUESTIONS) return null;
  const index = Math.floor((qNumber - 1) / QUESTIONS_PER_ARCHETYPE); // 0..11
  const archetype = archetypes[index];
  return archetype ? archetype.key : null;
}

// گرفتن آبجکت آرکتایپ با کلید
function getArchetypeByKey(key) {
  return archetypes.find((a) => a.key === key);
}

// متن توضیح نهایی برای هر آرکتایپ (بر اساس جایگاه)
function buildArchetypeExplanation(key, isHigh) {
  const info = getArchetypeByKey(key);
  const base = archetypeDescriptions[key] || '';
  if (!info || !base) return '';

  if (isHigh) {
    return `⭐ ${info.name}\nاین آرکتایپ در تو «فعاله و تاثیرگذار» ظاهر شده. یعنی این جنس انرژی، نگاه و رفتار، بخش قابل توجهی از سبک تو در رهبری، تصمیم‌گیری و زندگیه:\n${base}\n`;
  } else {
    return `⚪ ${info.name}\nاین آرکتایپ در این مرحله از زندگی تو «کمتر فعاله». الزاماً ضعف نیست؛ فقط نشون می‌ده این نوع انرژی الان محور هویتت نیست. اگر لازم شد، می‌تونی آگاهانه بخشی از کیفیت‌هایش را تقویت کنی:\n${base}\n`;
  }
}

// ================== منطق ربات ==================

// /start → شروع یا ریست تست برای هر کاربر
bot.start((ctx) => {
  const userId = ctx.from.id;
  const name =
    (ctx.from.first_name || '') +
    (ctx.from.last_name ? ' ' + ctx.from.last_name : '');

  const order = createShuffledQuestions();

  const scores = {};
  archetypes.forEach((a) => {
    scores[a.key] = 0;
  });

  userState.set(userId, {
    name: name || 'دوست عزیز',
    order,
    currentIndex: 0,
    scores,
    finished: false
  });

  ctx.reply(
    `سلام ${name || 'دوست عزیز'} 🌱
به تست آرکتایپ شخصیتی خوش آمدی.

به هر جمله از ۰ تا ۱۰ امتیاز بده:
۰ = اصلاً شبیه من نیست
۱۰ = کاملاً این خودِ منم

سریع، حسی و بدون وسواس جواب بده.
بیا شروع کنیم ✅`
  ).then(() => {
    sendNextQuestion(ctx);
  });
});

// /reset → پاک کردن وضعیت و شروع دوباره
bot.command('reset', (ctx) => {
  const userId = ctx.from.id;
  userState.delete(userId);
  ctx.reply('تستت ریست شد. برای شروع دوباره /start رو بفرست 🔁');
});

// ارسال سوال بعدی برای کاربر
function sendNextQuestion(ctx) {
  const userId = ctx.from.id;
  const state = userState.get(userId);

  if (!state) {
    return ctx.reply('برای شروع تست، دستور /start رو بفرست 🌱');
  }

  if (state.finished) {
    return ctx.reply('تستت تموم شده. برای شروع دوباره /start رو بفرست.');
  }

  if (state.currentIndex >= TOTAL_QUESTIONS) {
    state.finished = true;
    return sendResults(ctx, state);
  }

  const displayNumber = state.currentIndex + 1;
  const realQuestionNumber = state.order[state.currentIndex];
  const text = questions[realQuestionNumber - 1];

  if (!text) {
    return ctx.reply('خطا در بارگذاری سوال. لطفاً بعداً دوباره تلاش کن 🙏');
  }

  ctx.reply(
    `سؤال ${displayNumber} از ${TOTAL_QUESTIONS}:

${text}

از ۰ تا ۱۰ امتیاز بده.`
  );
}

// هندل همه پیام‌های متنی به‌عنوان پاسخ (وقتی وسط تست هست)
bot.on('text', (ctx) => {
  const userId = ctx.from.id;
  const state = userState.get(userId);

  // اگر تستی برای این کاربر فعال نیست
  if (!state) {
    return ctx.reply('برای شروع تست آرکتایپ، دستور /start رو بفرست 🌱');
  }

  if (state.finished) {
    return ctx.reply('تستت تموم شده. برای شروع دوباره /start رو بفرست 🔁');
  }

  const raw = (ctx.message.text || '').trim();

  // فقط عدد
  if (!/^\d+$/.test(raw)) {
    return ctx.reply('فقط یک عدد بین ۰ تا ۱۰ بفرست 🙂');
  }

  const score = parseInt(raw, 10);
  if (score < 0 || score > 10) {
    return ctx.reply('نمره باید بین ۰ تا ۱۰ باشه 🌡️');
  }

  const realQuestionNumber = state.order[state.currentIndex];
  const archetypeKey = getArchetypeKeyForQuestion(realQuestionNumber);

  if (archetypeKey && state.scores[archetypeKey] !== undefined) {
    state.scores[archetypeKey] += score;
  }

  state.currentIndex += 1;

  if (state.currentIndex >= TOTAL_QUESTIONS) {
    state.finished = true;
    return sendResults(ctx, state);
  }

  return sendNextQuestion(ctx);
});

// محاسبه و ارسال نتایج نهایی
function sendResults(ctx, state) {
  const maxScorePerArchetype = QUESTIONS_PER_ARCHETYPE * 10;

  const results = archetypes.map((a) => {
    const rawScore = state.scores[a.key] || 0;
    const percent =
      maxScorePerArchetype > 0
        ? Math.round((rawScore / maxScorePerArchetype) * 100)
        : 0;
    return {
      key: a.key,
      name: a.name,
      rawScore,
      percent
    };
  });

  // مرتب از بیشتر به کمتر
  results.sort((a, b) => b.percent - a.percent);

  const top3 = results.slice(0, 3);
  const bottom3 = results.slice(-3);

  let msg = `✅ ${state.name} عزیز، تستت تموم شد.

🔺 سه آرکتایپ «غالب» تو:
`;

  top3.forEach((r, i) => {
    msg += `${i + 1}. ${r.name} — ${r.percent}%\n`;
  });

  msg += `\n🔻 سه آرکتایپ «کم‌فعال» تو:
`;

  bottom3.forEach((r, i) => {
    msg += `${i + 1}. ${r.name} — ${r.percent}%\n`;
  });

  msg += `\n📌 تفسیر حرفه‌ای آرکتایپ‌های کلیدی تو:\n\n`;

  // توضیح برای ۳ غالب
  top3.forEach((r) => {
    msg += buildArchetypeExplanation(r.key, true) + '\n';
  });

  // توضیح برای ۳ کم‌فعال
  bottom3.forEach((r) => {
    msg += buildArchetypeExplanation(r.key, false) + '\n';
  });

  msg +=
    'یادت باشه این نتایج «نقاط غالب انرژی شخصیت» تو رو نشون می‌ده، نه برچسب قطعی. می‌تونی براساسش آگاهانه‌تر زندگی و رهبری کنی. 🌱';

  return ctx.reply(msg);
}

// ================== وب‌سرور و وبهوک ==================

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
    console.log('⚠️ APP_URL is not set. Webhook will not be configured automatically.');
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
