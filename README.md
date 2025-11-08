
🧬 Helix Archetype Test Bot

A Telegram-based personality archetype assessment built with Node.js and Telegraf.
Developed as part of the NIL (Nurturing Innovative Leadership) initiative to combine technology with human development.


---

🚀 Overview

Helix Archetype Bot helps users explore their dominant and less-active archetypes through an interactive quiz of 50 questions.
Built with a focus on clean UX, dynamic scoring, and coaching-style reflections, it bridges the gap between software design and self-awareness work.

After completing the test, users receive:

🎯 A ranked list of 12 archetypes with scores and percentages

📊 A radar chart visualization (auto-generated via QuickChart API)

💭 A short coaching reflection for personal growth

🌑 Summary of less active archetypes for balanced development



---

⚙️ Core Features

Interactive Telegram UI — answer each question via inline buttons (1–5 scale)

Adaptive Persian text layout (RTL) — fully localized UX

Dynamic radar chart generation using QuickChart.io

Custom NIL Helix logo sticker for consistent brand identity

Fully stateless logic — no database dependency

Clean modular scoring engine in index.js

Uptime monitoring (UptimeRobot) + cloud deployment (Render)



---

🧠 Tech Stack

Layer Technology

Bot Framework Telegraf.js
Backend Node.js (ES module syntax)
Visualization QuickChart.io
Deployment Render.com
Monitoring UptimeRobot
Environment dotenv



---

🧩 Architecture

Each archetype is represented by:

A key, label, and emoji symbol

10 mapped questions

A short descriptive narrative (for feedback)

Automatic score normalization out of 50


At runtime:

1. The bot walks the user through 50 inline-button questions.


2. Responses are scored and grouped by archetype.


3. The system computes weighted averages and identifies top & bottom 3.


4. A radar chart image is generated and displayed alongside textual feedback.




---

🧪 Setup

git clone https://github.com/ErfanBashiri95/helix-archetype-bot
cd helix-archetype-bot
npm install

Create a .env file:

BOT_TOKEN=your_telegram_bot_token
NIL_STICKER_ID=your_logo_sticker_file_id

Run locally:

node index.js


---

🌐 Deployment

Option 1: Deploy to Render
Option 2: Deploy via Railway

Set your webhook:

https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=<YOUR_RENDER_URL>


---

💬 Sample Output (in Persian)

🏆 سه آرکتایپ فعال‌تر تو:
1. عاشق 💖 — 90%
2. رهبر 👑 — 85%
3. خالق 🎨 — 82%

🌑 سه آرکتایپ کم‌فعال‌تر:
1. جست‌وجوگر 🧭 — 62%
2. معصوم ☀️ — 70%
3. عاشق 💕 — 72%

📊 نمودار کلی شخصیت:
(رادارچارت به صورت خودکار نمایش داده می‌شود)


---

🧭 Design Philosophy

> “Technology can mirror human potential —
when built with awareness and empathy.”



Helix Archetype Bot is not just a quiz.
It’s a bridge between behavioral insight and system design, turning data into reflection and conversation.


---

👤 Developer

Erfan Bashiri
Full-Stack Developer & Purpose-Driven Coach
📍 Tehran, Iran
💼 LinkedIn · 💻 GitHub

