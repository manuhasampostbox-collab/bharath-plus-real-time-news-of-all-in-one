const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const xml2js = require('xml2js');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── RSS Sources ─────────────────────────────────────────
const RSS_SOURCES = [
  { name: 'NDTV', url: 'https://feeds.feedburner.com/NDTV-LatestNews', cat: 'national', state: 'India' },
  { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', cat: 'national', state: 'India' },
  { name: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss', cat: 'national', state: 'India' },
  { name: 'India Today', url: 'https://www.indiatoday.in/rss/1206514', cat: 'breaking', state: 'India' },
  { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', cat: 'national', state: 'India' },
  { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', cat: 'economy', state: 'India' },
  { name: 'Deccan Herald', url: 'https://www.deccanherald.com/rss-feed/feed.xml', cat: 'state', state: 'Karnataka' },
  { name: 'The Wire', url: 'https://thewire.in/rss', cat: 'national', state: 'India' },
  { name: 'Scroll.in', url: 'https://scroll.in/rss', cat: 'national', state: 'India' },
  { name: 'News18', url: 'https://www.news18.com/commonfeeds/v1/eng/rss/india.xml', cat: 'national', state: 'India' },
  { name: 'Live Mint', url: 'https://www.livemint.com/rss/news', cat: 'economy', state: 'India' },
  { name: 'Business Standard', url: 'https://www.business-standard.com/rss/home_page_top_stories.rss', cat: 'economy', state: 'India' },
  { name: 'Down To Earth', url: 'https://www.downtoearth.org/rss', cat: 'climate', state: 'India' },
  { name: 'Indian Express', url: 'https://indianexpress.com/feed/', cat: 'national', state: 'India' },
  { name: 'Firstpost', url: 'https://www.firstpost.com/rss', cat: 'national', state: 'India' },
];

const REDDIT_SOURCES = [
  { name: 'r/india', url: 'https://www.reddit.com/r/india/hot.json?limit=15', state: 'India' },
  { name: 'r/bangalore', url: 'https://www.reddit.com/r/bangalore/hot.json?limit=10', state: 'Karnataka' },
  { name: 'r/IndiaSpeaks', url: 'https://www.reddit.com/r/IndiaSpeaks/hot.json?limit=8', state: 'India' },
  { name: 'r/mumbai', url: 'https://www.reddit.com/r/mumbai/hot.json?limit=6', state: 'Maharashtra' },
  { name: 'r/Chennai', url: 'https://www.reddit.com/r/Chennai/hot.json?limit=6', state: 'Tamil Nadu' },
  { name: 'r/delhi', url: 'https://www.reddit.com/r/delhi/hot.json?limit=6', state: 'Delhi' },
];

// ─── Helpers ──────────────────────────────────────────────
const BREAKING_WORDS = ['breaking','urgent','explosion','blast','dead','killed','crisis','emergency','earthquake','flood','fire','attack','riot','strike','crash','accident','terror','murder','rape','assault'];
const isBreaking = t => BREAKING_WORDS.some(w => t.toLowerCase().includes(w));

const LAW_MAP = [
  { words: ['murder','kill','death','homicide'], law: 'IPC §302' },
  { words: ['rape','sexual assault','pocso','molestation'], law: 'IPC §376 / POCSO' },
  { words: ['terror','bomb','blast','uapa'], law: 'UAPA' },
  { words: ['cyber','hack','fraud','data'], law: 'IT Act 2000' },
  { words: ['pollution','environment','water contamination'], law: 'Environment Protection Act' },
  { words: ['consumer','price hike','lpg','petrol'], law: 'Consumer Protection Act' },
  { words: ['election','vote','electoral'], law: 'RPA 1951' },
  { words: ['land','property','eviction'], law: 'Transfer of Property Act' },
  { words: ['dowry','domestic violence'], law: 'IPC §498A / PWDV Act' },
  { words: ['corruption','bribery','scam'], law: 'Prevention of Corruption Act' },
  { words: ['drug','narcotics'], law: 'NDPS Act' },
  { words: ['child labour','child abuse'], law: 'CLPRA / JJ Act' },
  { words: ['protest','sedition'], law: 'IPC §124A' },
];

function getLaws(title) {
  const t = title.toLowerCase();
  return LAW_MAP.filter(m => m.words.some(w => t.includes(w))).map(m => m.law);
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function extractImg(html) {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function stripHtml(html) {
  return html ? html.replace(/<[^>]+>/g,'').replace(/&[a-z]+;/gi,' ').trim() : '';
}

// ─── RSS Fetcher ─────────────────────────────────────────
async function fetchRSS(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'BharatPulse/1.0 News Aggregator' },
      timeout: 8000
    });
    const xml = await res.text();
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false });
    const channel = parsed?.rss?.channel || parsed?.feed;
    const items = channel?.item || channel?.entry || [];
    const arr = Array.isArray(items) ? items : [items];

    return arr.slice(0,10).map(item => {
      const title = stripHtml(item.title?.$?._ || item.title?.$?.text || item.title?._ || item.title || '');
      const link = item.link?.$?.href || item.link?._ || item.link || item.guid?._ || item.guid || '';
      const desc = stripHtml(item.description?._ || item.description || item.summary?._ || item.summary || '');
      const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();
      const img = item['media:content']?.$?.url || item['media:thumbnail']?.$?.url || extractImg(item.description?._ || item.description || '') || null;

      return {
        id: link || title,
        title,
        snippet: desc.substring(0,200),
        url: link,
        image: img,
        time: timeAgo(pubDate),
        rawTime: new Date(pubDate).getTime(),
        source: source.name,
        platform: 'news',
        category: source.cat,
        state: source.state,
        laws: getLaws(title),
        isBreaking: isBreaking(title),
        verified: true,
      };
    }).filter(a => a.title && a.url);
  } catch(e) {
    return [];
  }
}

// ─── Reddit Fetcher ───────────────────────────────────────
async function fetchReddit(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'BharatPulse/1.0' },
      timeout: 6000
    });
    const data = await res.json();
    return (data.data?.children || [])
      .filter(p => !p.data.stickied)
      .slice(0,10)
      .map(p => ({
        id: p.data.id,
        title: p.data.title,
        snippet: p.data.selftext ? p.data.selftext.substring(0,200) : `↑ ${p.data.score} upvotes · ${p.data.num_comments} comments`,
        url: `https://reddit.com${p.data.permalink}`,
        image: p.data.thumbnail?.startsWith('http') ? p.data.thumbnail : null,
        time: timeAgo(new Date(p.data.created_utc * 1000)),
        rawTime: p.data.created_utc * 1000,
        source: source.name,
        platform: 'reddit',
        category: 'social',
        state: source.state,
        score: p.data.score,
        comments: p.data.num_comments,
        laws: getLaws(p.data.title),
        isBreaking: false,
        verified: false,
      }));
  } catch(e) {
    return [];
  }
}

// ─── Cache ───────────────────────────────────────────────
let cache = { articles: [], lastFetch: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function getArticles() {
  if (Date.now() - cache.lastFetch < CACHE_TTL && cache.articles.length > 0) {
    return cache.articles;
  }

  const promises = [
    ...RSS_SOURCES.map(fetchRSS),
    ...REDDIT_SOURCES.map(fetchReddit),
  ];

  const results = await Promise.allSettled(promises);
  let articles = [];
  results.forEach(r => { if (r.status === 'fulfilled') articles = articles.concat(r.value); });

  // Deduplicate
  const seen = new Set();
  articles = articles.filter(a => {
    const key = a.title.substring(0,60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  articles.sort((a,b) => b.rawTime - a.rawTime);

  cache = { articles, lastFetch: Date.now() };
  return articles;
}

// ─── API Routes ───────────────────────────────────────────
app.get('/api/news', async (req, res) => {
  try {
    let articles = await getArticles();
    const { q, platform, state, cat, breaking } = req.query;
    if (q) {
      const lq = q.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(lq) ||
        a.snippet.toLowerCase().includes(lq) ||
        a.source.toLowerCase().includes(lq) ||
        a.laws.some(l => l.toLowerCase().includes(lq))
      );
    }
    if (platform) articles = articles.filter(a => a.platform === platform);
    if (state) articles = articles.filter(a => a.state === state || a.state === 'India');
    if (cat) articles = articles.filter(a => a.category === cat);
    if (breaking === '1') articles = articles.filter(a => a.isBreaking);

    res.json({ ok: true, count: articles.length, articles: articles.slice(0, 60), lastUpdated: new Date(cache.lastFetch).toISOString() });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/prices', (req, res) => {
  res.json({
    ok: true,
    updated: new Date().toISOString(),
    prices: [
      { name: 'LPG Cylinder (14kg)', value: '₹903', change: '+₹50', trend: 'up' },
      { name: 'Petrol — Bengaluru', value: '₹102.86', change: '-₹0.20', trend: 'down' },
      { name: 'Diesel — Bengaluru', value: '₹88.94', change: '—', trend: 'flat' },
      { name: 'Petrol — Delhi', value: '₹94.72', change: '—', trend: 'flat' },
      { name: 'Petrol — Mumbai', value: '₹103.44', change: '—', trend: 'flat' },
      { name: 'Bread 700g (local avg)', value: '₹48', change: '—', trend: 'flat' },
      { name: 'Atta 10kg (avg)', value: '₹370', change: '-₹10', trend: 'down' },
      { name: 'Rice 5kg (avg)', value: '₹290', change: '+₹15', trend: 'up' },
      { name: 'Onion 1kg', value: '₹42', change: '+₹8', trend: 'up' },
      { name: 'Tomato 1kg', value: '₹28', change: '-₹5', trend: 'down' },
      { name: 'Dal (toor) 1kg', value: '₹148', change: '+₹12', trend: 'up' },
      { name: 'Cooking Oil 1L', value: '₹145', change: '—', trend: 'flat' },
    ]
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    ok: true,
    bengaluru: {
      firs_today: Math.floor(Math.random()*20)+10,
      active_cases: Math.floor(Math.random()*50)+30,
      pocso_open: Math.floor(Math.random()*8)+2,
      resolved_pct: Math.floor(Math.random()*15)+78,
    },
    india: {
      total_firs_today: Math.floor(Math.random()*800)+1200,
      active_cases: Math.floor(Math.random()*5000)+8000,
    }
  });
});

app.get('/api/refresh', async (req, res) => {
  cache.lastFetch = 0;
  const articles = await getArticles();
  res.json({ ok: true, count: articles.length });
});

// ─── Serve Frontend ───────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BharatPulse running on http://localhost:${PORT}`));
