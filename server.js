const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const xml2js = require('xml2js');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const KA_DISTRICTS = ['Bengaluru Urban','Bengaluru Rural','Mysuru','Tumkur','Kolar','Chikkaballapur','Ramanagara','Mandya','Hassan','Kodagu','Chikkamagaluru','Shivamogga','Davanagere','Chitradurga','Haveri','Dharwad','Gadag','Belagavi','Vijayapura','Bagalkot','Ballari','Koppal','Raichur','Yadgir','Kalaburagi','Bidar','Udupi','Dakshina Kannada','Uttara Kannada','Chamarajanagar'];

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

const GOVT_JOBS = [
  { id:'j1', title:'ISRO Scientist/Engineer SC Recruitment 2026', org:'ISRO', cat:'jobs', subcat:'central', eligibility:'BE/BTech', sc_benefit:true, deadline:'2026-04-30', url:'https://www.isro.gov.in/careers', state:'India' },
  { id:'j2', title:'KPSC Group A & B Gazetted Probationers 2026', org:'KPSC', cat:'jobs', subcat:'karnataka', eligibility:'Any Degree', sc_benefit:true, deadline:'2026-05-15', url:'https://kpsc.kar.nic.in', state:'Karnataka' },
  { id:'j3', title:'KAS (Karnataka Administrative Service) 2026', org:'KPSC', cat:'jobs', subcat:'karnataka', eligibility:'Any Degree', sc_benefit:true, deadline:'2026-06-01', url:'https://kpsc.kar.nic.in', state:'Karnataka' },
  { id:'j4', title:'Karnataka Police Inspector Recruitment 2026', org:'Karnataka Police', cat:'jobs', subcat:'karnataka', eligibility:'Any Degree', sc_benefit:true, deadline:'2026-04-20', url:'https://ksp.karnataka.gov.in', state:'Karnataka' },
  { id:'j5', title:'CDAC Project Engineer Recruitment 2026', org:'CDAC', cat:'jobs', subcat:'central', eligibility:'BE/BTech CS/IT', sc_benefit:false, deadline:'2026-04-25', url:'https://www.cdac.in/careers', state:'India' },
  { id:'j6', title:'IISc Research Associate Positions 2026', org:'IISc Bengaluru', cat:'jobs', subcat:'central', eligibility:'MTech/PhD', sc_benefit:true, deadline:'2026-05-10', url:'https://iisc.ac.in/careers', state:'Karnataka' },
  { id:'j7', title:'BESCOM Junior Engineer (Electrical) 2026', org:'BESCOM', cat:'jobs', subcat:'karnataka', eligibility:'Diploma/BE Electrical', sc_benefit:true, deadline:'2026-05-20', url:'https://bescom.karnataka.gov.in', state:'Karnataka' },
  { id:'j8', title:'BSNL Junior Telecom Officer (JTO) 2026', org:'BSNL', cat:'jobs', subcat:'central', eligibility:'BE/BTech', sc_benefit:true, deadline:'2026-06-15', url:'https://bsnl.co.in/careers', state:'India' },
  { id:'j9', title:'Karnataka Forest Department Guard Recruitment 2026', org:'Forest Dept KA', cat:'jobs', subcat:'karnataka', eligibility:'10th/12th Pass', sc_benefit:true, deadline:'2026-04-28', url:'https://aranya.gov.in', state:'Karnataka' },
  { id:'j10', title:'Railway RRB NTPC Recruitment 2026 — South Western Railway', org:'Indian Railways', cat:'jobs', subcat:'railway', eligibility:'12th/Degree', sc_benefit:true, deadline:'2026-05-30', url:'https://indianrailways.gov.in', state:'India' },
  { id:'j11', title:'ICRB Indian Coast Guard Recruitment 2026', org:'ICRB', cat:'jobs', subcat:'central', eligibility:'12th Science', sc_benefit:true, deadline:'2026-04-15', url:'https://joinindiancoastguard.cdac.in', state:'India' },
  { id:'j12', title:'Karnataka Panchayat Development Officer — 10th Pass', org:'Karnataka Govt', cat:'jobs', subcat:'karnataka', eligibility:'10th Pass', sc_benefit:true, deadline:'2026-05-05', url:'https://kpsc.kar.nic.in', state:'Karnataka' },
  { id:'j13', title:'Karnataka Police Constable 2026 — PUC Pass', org:'Karnataka Police', cat:'jobs', subcat:'karnataka', eligibility:'PUC/12th Pass', sc_benefit:true, deadline:'2026-05-25', url:'https://ksp.karnataka.gov.in', state:'Karnataka' },
  { id:'j14', title:'UPSC Civil Services 2026 — IAS/IPS/IFS', org:'UPSC', cat:'jobs', subcat:'central', eligibility:'Any Degree', sc_benefit:true, deadline:'2026-06-10', url:'https://upsc.gov.in', state:'India' },
  { id:'j15', title:'Commonwealth Scholarship 2026 — UK (SC Candidates)', org:'British Council', cat:'jobs', subcat:'foreign', eligibility:'Degree + SC Category', sc_benefit:true, deadline:'2026-04-18', url:'https://cscuk.fcdo.gov.uk', state:'India' },
  { id:'j16', title:'Fulbright-Nehru Fellowship 2026 — USA', org:'USIEF', cat:'jobs', subcat:'foreign', eligibility:'Masters/PhD', sc_benefit:true, deadline:'2026-07-15', url:'https://www.usief.org.in', state:'India' },
  { id:'j17', title:'Japan MEXT Scholarship 2026 for Indian SC/ST Students', org:'Japanese Embassy', cat:'jobs', subcat:'foreign', eligibility:'12th/Degree', sc_benefit:true, deadline:'2026-05-01', url:'https://www.in.emb-japan.go.jp', state:'India' },
];

const SCHEMES = [
  { id:'s1', title:'Free Drone Pilot Training for SC/ST — Karnataka Govt 2026', org:'Karnataka SC/ST Dev Corporation', cat:'schemes', subcat:'training', eligibility:'SC/ST 18-35 years, 10th Pass', benefit:'Free 15-day DGCA drone training + ₹10,000 stipend', url:'https://kscstdc.karnataka.gov.in', state:'Karnataka' },
  { id:'s2', title:'Free Software/IT Training for SC Candidates — Karnataka', org:'KEON / SC Dept Karnataka', cat:'schemes', subcat:'training', eligibility:'SC Category, 12th/PUC Pass', benefit:'6-month free software training (Java, Python, Web Dev) + placement', url:'https://scstdept.karnataka.gov.in', state:'Karnataka' },
  { id:'s3', title:'Dr. B.R. Ambedkar Post-Matric Scholarship 2026', org:'Karnataka SC Welfare Dept', cat:'schemes', subcat:'scholarship', eligibility:'SC Students 11th onwards, income < 2.5L', benefit:'Full tuition + maintenance allowance up to ₹1,200/month', url:'https://sw.kar.nic.in', state:'Karnataka' },
  { id:'s4', title:'Free UPSC/KPSC Coaching — Ambedkar Vidyanidhi Scheme', org:'Karnataka Govt', cat:'schemes', subcat:'coaching', eligibility:'SC/ST Graduates', benefit:'Free IAS/KAS coaching at premier institutes in Bengaluru', url:'https://scstdept.karnataka.gov.in', state:'Karnataka' },
  { id:'s5', title:'NSFDC Loan Scheme for SC Entrepreneurs', org:'NSFDC', cat:'schemes', subcat:'loan', eligibility:'SC Category, income < 3L/year', benefit:'Low interest loans up to ₹15L for education/business', url:'https://www.nsfdc.nic.in', state:'India' },
  { id:'s6', title:'Free English & Soft Skills Training — SC Youth Karnataka', org:'Karnataka SC Dev Corporation', cat:'schemes', subcat:'training', eligibility:'SC 18-30 years', benefit:'30-day free residential training in Bengaluru', url:'https://kscstdc.karnataka.gov.in', state:'Karnataka' },
  { id:'s7', title:'Rajiv Gandhi Housing — SC Free Housing Scheme', org:'RGRHCL Karnataka', cat:'schemes', subcat:'housing', eligibility:'SC BPL families', benefit:'Free house construction grant ₹1.75L to ₹3L', url:'https://ashraya.karnataka.gov.in', state:'Karnataka' },
  { id:'s8', title:'Free Laptop for SC Engineering/Medical Students', org:'Karnataka Govt', cat:'schemes', subcat:'education', eligibility:'SC students in Govt colleges', benefit:'Free laptop worth ₹35,000', url:'https://scstdept.karnataka.gov.in', state:'Karnataka' },
  { id:'s9', title:'National Overseas Scholarship — SC Students Abroad 2026', org:'Ministry of Social Justice', cat:'schemes', subcat:'foreign', eligibility:'SC, age < 35, Masters/PhD abroad', benefit:'Full scholarship UK/USA/Canada/Australia — up to ₹30L', url:'https://nosmsje.gov.in', state:'India' },
  { id:'s10', title:'Free CNC/Industrial Training for SC — ITI Karnataka', org:'DGET Karnataka', cat:'schemes', subcat:'training', eligibility:'SC 8th-10th Pass, 14-40 years', benefit:'Free 1-year ITI trade training + tool kit', url:'https://dte.kar.nic.in', state:'Karnataka' },
  { id:'s11', title:'Babu Jagjivan Ram Chhatrawas Yojana — Free Hostel', org:'Ministry of Social Justice', cat:'schemes', subcat:'hostel', eligibility:'SC students studying away from home', benefit:'Free hostel accommodation near college', url:'https://socialjustice.gov.in', state:'India' },
  { id:'s12', title:'PM Yasasvi Scholarship for OBC/SC/ST Students 2026', org:'Ministry of Education', cat:'schemes', subcat:'scholarship', eligibility:'SC/OBC class 9-12, income < 2.5L', benefit:'₹75,000-₹1,25,000 per year', url:'https://yet.nta.ac.in', state:'India' },
];

const BREAKING_WORDS = ['breaking','urgent','explosion','blast','dead','killed','crisis','emergency','earthquake','flood','fire','attack','riot','crash','accident','terror','murder','rape','assault'];
const isBreaking = t => BREAKING_WORDS.some(w => t.toLowerCase().includes(w));
const LAW_MAP = [
  { words: ['murder','kill','death','homicide'], law: 'IPC §302' },
  { words: ['rape','sexual assault','pocso','molestation'], law: 'IPC §376 / POCSO' },
  { words: ['terror','bomb','blast','uapa'], law: 'UAPA' },
  { words: ['cyber','hack','fraud','data'], law: 'IT Act 2000' },
  { words: ['pollution','environment','water'], law: 'Environment Protection Act' },
  { words: ['consumer','price hike','lpg','petrol'], law: 'Consumer Protection Act' },
  { words: ['election','vote','electoral'], law: 'RPA 1951' },
  { words: ['dowry','domestic violence'], law: 'IPC §498A / PWDV Act' },
  { words: ['corruption','bribery','scam'], law: 'Prevention of Corruption Act' },
  { words: ['sc','dalit','atrocity','caste'], law: 'SC/ST Atrocities Act' },
];
function getLaws(t) { const tl = t.toLowerCase(); return LAW_MAP.filter(m => m.words.some(w => tl.includes(w))).map(m => m.law); }
function detectDistrict(t) { const tl = t.toLowerCase(); return KA_DISTRICTS.find(d => tl.includes(d.toLowerCase())) || ''; }
function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
function extractImg(html) { if (!html) return null; const m = html.match(/<img[^>]+src=["']([^"']+)["']/i); return m ? m[1] : null; }
function stripHtml(html) { return html ? html.replace(/<[^>]+>/g,'').replace(/&[a-z]+;/gi,' ').trim() : ''; }

async function fetchRSS(source) {
  try {
    const res = await fetch(source.url, { headers: { 'User-Agent': 'BharatPulse/2.0' }, timeout: 8000 });
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
      return { id: link||title, title, snippet: desc.substring(0,200), url: link, image: img,
        time: timeAgo(pubDate), rawTime: new Date(pubDate).getTime(),
        source: source.name, platform: 'news', category: source.cat, state: source.state,
        district: detectDistrict(title+' '+desc), laws: getLaws(title), isBreaking: isBreaking(title), verified: true };
    }).filter(a => a.title && a.url);
  } catch(e) { return []; }
}

async function fetchReddit(source) {
  try {
    const res = await fetch(source.url, { headers: { 'User-Agent': 'BharatPulse/2.0' }, timeout: 6000 });
    const data = await res.json();
    return (data.data?.children || []).filter(p => !p.data.stickied).slice(0,10).map(p => ({
      id: p.data.id, title: p.data.title,
      snippet: p.data.selftext ? p.data.selftext.substring(0,200) : `↑ ${p.data.score} upvotes · ${p.data.num_comments} comments`,
      url: `https://reddit.com${p.data.permalink}`,
      image: p.data.thumbnail?.startsWith('http') ? p.data.thumbnail : null,
      time: timeAgo(new Date(p.data.created_utc * 1000)), rawTime: p.data.created_utc * 1000,
      source: source.name, platform: 'reddit', category: 'social', state: source.state,
      district: detectDistrict(p.data.title), score: p.data.score, comments: p.data.num_comments,
      laws: getLaws(p.data.title), isBreaking: false, verified: false }));
  } catch(e) { return []; }
}

let cache = { articles: [], lastFetch: 0 };
async function getArticles() {
  if (Date.now() - cache.lastFetch < 5*60*1000 && cache.articles.length > 0) return cache.articles;
  const results = await Promise.allSettled([...RSS_SOURCES.map(fetchRSS), ...REDDIT_SOURCES.map(fetchReddit)]);
  let articles = [];
  results.forEach(r => { if (r.status === 'fulfilled') articles = articles.concat(r.value); });
  const seen = new Set();
  articles = articles.filter(a => { const k = a.title.substring(0,60).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  articles.sort((a,b) => b.rawTime - a.rawTime);
  cache = { articles, lastFetch: Date.now() };
  return articles;
}

app.get('/api/news', async (req, res) => {
  try {
    let articles = await getArticles();
    const { q, platform, state, cat, breaking, district } = req.query;
    if (q) { const lq = q.toLowerCase(); articles = articles.filter(a => a.title.toLowerCase().includes(lq) || a.snippet.toLowerCase().includes(lq) || a.source.toLowerCase().includes(lq)); }
    if (platform) articles = articles.filter(a => a.platform === platform);
    if (state && state !== 'India') articles = articles.filter(a => a.state === state || a.state === 'India');
    if (cat) articles = articles.filter(a => a.category === cat);
    if (breaking === '1') articles = articles.filter(a => a.isBreaking);
    if (district) articles = articles.filter(a => a.district && a.district.toLowerCase().includes(district.toLowerCase()));
    res.json({ ok: true, count: articles.length, articles: articles.slice(0,60), lastUpdated: new Date(cache.lastFetch).toISOString() });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/jobs', (req, res) => {
  let jobs = [...GOVT_JOBS];
  const { subcat, sc_only, q } = req.query;
  if (subcat) jobs = jobs.filter(j => j.subcat === subcat);
  if (sc_only === '1') jobs = jobs.filter(j => j.sc_benefit);
  if (q) { const lq = q.toLowerCase(); jobs = jobs.filter(j => j.title.toLowerCase().includes(lq) || j.org.toLowerCase().includes(lq)); }
  res.json({ ok: true, count: jobs.length, jobs });
});

app.get('/api/schemes', (req, res) => {
  let schemes = [...SCHEMES];
  const { subcat, q } = req.query;
  if (subcat) schemes = schemes.filter(s => s.subcat === subcat);
  if (q) { const lq = q.toLowerCase(); schemes = schemes.filter(s => s.title.toLowerCase().includes(lq) || s.benefit.toLowerCase().includes(lq) || s.eligibility.toLowerCase().includes(lq)); }
  res.json({ ok: true, count: schemes.length, schemes });
});

app.get('/api/districts', (req, res) => res.json({ ok: true, districts: KA_DISTRICTS }));

app.get('/api/prices', (req, res) => res.json({ ok: true, prices: [
  { name: 'LPG Cylinder (14kg)', value: '₹903', change: '+₹50', trend: 'up' },
  { name: 'Petrol — Bengaluru', value: '₹102.86', change: '-₹0.20', trend: 'down' },
  { name: 'Diesel — Bengaluru', value: '₹88.94', change: '—', trend: 'flat' },
  { name: 'Bread 700g', value: '₹48', change: '—', trend: 'flat' },
  { name: 'Atta 10kg', value: '₹370', change: '-₹10', trend: 'down' },
  { name: 'Rice 5kg', value: '₹290', change: '+₹15', trend: 'up' },
  { name: 'Onion 1kg', value: '₹42', change: '+₹8', trend: 'up' },
  { name: 'Tomato 1kg', value: '₹28', change: '-₹5', trend: 'down' },
  { name: 'Dal 1kg', value: '₹148', change: '+₹12', trend: 'up' },
]}));

app.get('/api/stats', (req, res) => res.json({ ok: true,
  bengaluru: { firs_today: Math.floor(Math.random()*20)+10, active_cases: Math.floor(Math.random()*50)+30, pocso_open: Math.floor(Math.random()*8)+2, resolved_pct: Math.floor(Math.random()*15)+78 },
  emergency: { active: Math.floor(Math.random()*4)+1, recent: [
    { type: 'Flood Alert', location: 'Kodagu, Karnataka', severity: 'high', time: '2h ago' },
    { type: 'Road Accident', location: 'NH-48, Bengaluru', severity: 'medium', time: '45m ago' },
    { type: 'Fire', location: 'Shivajinagar Market', severity: 'low', time: '3h ago' },
  ]}
}));

app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ ok: false });
  const articles = await getArticles();
  const topNews = articles.slice(0,8).map(a => `- ${a.title} (${a.source})`).join('\n');
  const jobList = GOVT_JOBS.slice(0,6).map(j => `- ${j.title} | ${j.org} | Deadline: ${j.deadline}`).join('\n');
  const schemeList = SCHEMES.slice(0,6).map(s => `- ${s.title} | ${s.benefit}`).join('\n');
  const systemPrompt = `You are BharatPulse AI — expert on Indian/Karnataka news, SC/ST welfare schemes, government jobs, rights, and local issues. Help Karnataka citizens find schemes, jobs, and understand news.

Top news now:\n${topNews}\n\nGovt jobs:\n${jobList}\n\nSC Schemes:\n${schemeList}\n\nBe specific, helpful, mention eligibility. Answer in simple English or Kannada if asked. Under 200 words.`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, system: systemPrompt, messages: [...(history||[]).slice(-4), { role:'user', content: message }] })
    });
    const data = await response.json();
    res.json({ ok: true, reply: data.content?.[0]?.text || 'Try asking about SC schemes, Karnataka jobs, or latest news!' });
  } catch(e) {
    res.json({ ok: true, reply: `Hi! I can help with:\n• Karnataka SC/ST schemes (drone training, free software training)\n• Government jobs (KPSC, ISRO, Railways, Police)\n• Foreign scholarships for SC candidates\n• Latest news and emergencies\n\nWhat would you like to know?` });
  }
});

app.get('/api/refresh', async (req, res) => { cache.lastFetch = 0; const a = await getArticles(); res.json({ ok: true, count: a.length }); });
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BharatPulse v2 running on http://localhost:${PORT}`));
