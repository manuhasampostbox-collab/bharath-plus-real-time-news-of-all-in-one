# BharatPulse 🇮🇳
**India's Unified Real-Time News Intelligence Platform**

Live news from 15+ Indian outlets + Reddit India communities. All platforms. All states. One shareable link.

---

## Features
- Live RSS from NDTV, Times of India, The Hindu, India Today, ET, Deccan Herald, The Wire, and 8 more
- Reddit: r/india, r/bangalore, r/mumbai, r/Chennai, r/delhi, r/IndiaSpeaks
- Auto law-tagging (IPC, POCSO, Consumer Protection Act, etc.)
- Breaking news detection + emergency banner
- Price tracker (LPG, Petrol, Diesel, Essentials)
- Crime stats dashboard
- AI predictions
- Case tracker
- Search + State/Topic filters
- Source verification (shows exact URL + platform)
- Auto-refreshes every 5 minutes

---

## Deploy in 5 Minutes (Free on Render.com)

### Step 1 — Push to GitHub
1. Go to https://github.com/new and create a new repository called `bharatpulse`
2. Upload all these files:
   - `server.js`
   - `package.json`
   - `render.yaml`
   - `public/index.html`

### Step 2 — Deploy on Render (Free)
1. Go to https://render.com and sign up (free)
2. Click **"New Web Service"**
3. Connect your GitHub account and select `bharatpulse` repo
4. Render will auto-detect the config
5. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
6. Click **Deploy**
7. In 2-3 minutes you get a shareable URL like: `https://bharatpulse.onrender.com`

### Step 3 — Share
Copy your Render URL and share it with anyone!

---

## Run Locally
```bash
npm install
node server.js
# Open http://localhost:3000
```

---

## Architecture
```
Browser ←→ Express Server (server.js)
              ├── /api/news   → Fetches 15 RSS feeds + 6 Reddit feeds
              ├── /api/prices → Returns price data
              ├── /api/stats  → Returns crime stats
              └── /           → Serves public/index.html
```

---
Built with Express.js · Node.js · Vanilla JS · Google Fonts
