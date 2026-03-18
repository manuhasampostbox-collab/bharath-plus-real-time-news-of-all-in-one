const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const xml2js = require('xml2js');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const RSS_SOURCES = [
  { name: 'NDTV', url: 'https://feeds.feedburner.com/NDTV-LatestNews', cat: 'national', state: 'India' },
  { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', cat: 'national', state: 'India' },
  { name: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss', cat: 'national', state: 'India' },
  { name: 'India Today', url: 'https://www.indiatoday.in/rss/1206514', cat: 'breaking', state: 'India' },
  { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', cat: 'national', state: 'India' },
  { name: 'Indian Express', url: 'https://indianexpress.com/feed/', cat: 'national', state: 'India' },
  { name: 'The Wire', url: 'https://thewire.in/rss', cat: 'national', state: 'India' },
  { name: 'Scroll.in', url: 'https://scroll.in/rss', cat: 'national', state: 'India' },
  { name: 'News18', url: 'https://www.news18.com/commonfeeds/v1/eng/rss/india.xml', cat: 'national', state: 'India' },
  { name: 'Firstpost', url: 'https://www.firstpost.com/rss', cat: 'national', state: 'India' },
  { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', cat: 'economy', state: 'India' },
  { name: 'Live Mint', url: 'https://www.livemint.com/rss/news', cat: 'economy', state: 'India' },
  { name: 'Business Standard', url: 'https://www.business-standard.com/rss/home_page_top_stories.rss', cat: 'economy', state: 'India' },
  { name: 'Financial Express', url: 'https://www.financialexpress.com/feed/', cat: 'economy', state: 'India' },
  { name: 'MoneyControl', url: 'https://www.moneycontrol.com/rss/latestnews.xml', cat: 'economy', state: 'India' },
  { name: 'Down To Earth', url: 'https://www.downtoearth.org/rss', cat: 'climate', state: 'India' },
  { name: 'Hindu Environment', url: 'https://www.thehindu.com/sci-tech/energy-and-environment/feeder/default.rss', cat: 'climate', state: 'India' },
  { name: 'NDTV Health', url: 'https://feeds.feedburner.com/ndtv/Wlfp', cat: 'health', state: 'India' },
  { name: 'Hindu Health', url: 'https://www.thehindu.com/sci-tech/health/feeder/default.rss', cat: 'health', state: 'India' },
  { name: 'NDTV Tech', url: 'https://feeds.feedburner.com/ndtv/Bexn', cat: 'tech', state: 'India' },
  { name: 'Inc42', url: 'https://inc42.com/feed/', cat: 'tech', state: 'India' },
  { name: 'Deccan Herald', url: 'https://www.deccanherald.com/rss-feed/feed.xml', cat: 'state', state: 'Karnataka' },
  { name: 'Hindu Karnataka', url: 'https://www.thehindu.com/news/national/karnataka/feeder/default.rss', cat: 'state', state: 'Karnataka' },
  { name: 'TOI Delhi', url: 'https://timesofindia.indiatimes.com/rssfeeds/2918240.cms', cat: 'state', state: 'Delhi' },
  { name: 'Hindu Chennai', url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', cat: 'state', state: 'Tamil Nadu' },
  { name: 'TOI Mumbai', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128672765.cms', cat: 'state', state: 'Maharashtra' },
  { name: 'NDTV Sports', url: 'https://feeds.feedburner.com/ndtv/Bhy3', cat: 'sports', state: 'India' },
  { name: 'Cricbuzz', url: 'https://www.cricbuzz.com/rss-feeds/cricket-news', cat: 'sports', state: 'India' },
  { name: 'NDTV Crime', url: 'https://feeds.feedburner.com/ndtv/Cb4k', cat: 'crime', state: 'India' },
  { name: 'India TV', url: 'https://www.indiatvnews.com/rssnews/India.xml', cat: 'national', state: 'India' },
  { name: 'NDTV YT', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCZFMm1mMw0F81Z37aaEzTUA', cat: 'national', state: 'India', platform: 'youtube' },
  { name: 'Republic TV YT', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCvyNRVOT7EVeAKSCkieOr0Q', cat: 'national', state: 'India', platform: 'youtube' },
  { name: 'India Today YT', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCYPvAwZP8pZhSMW8qs7cVCw', cat: 'national', state: 'India', platform: 'youtube' },
];

const REDDIT_SOURCES = [
  { name: 'r/india', url: 'https://www.reddit.com/r/india/hot.json?limit=15', state: 'India', cat: 'national' },
  { name: 'r/IndiaSpeaks', url: 'https://www.reddit.com/r/IndiaSpeaks/hot.json?limit=10', state: 'India', cat: 'national' },
  { name: 'r/IndiaOpen', url: 'https://www.reddit.com/r/IndiaOpen/hot.json?limit=8', state: 'India', cat: 'national' },
  { name: 'r/bangalore', url: 'https://www.reddit.com/r/bangalore/hot.json?limit=10', state: 'Karnataka', cat: 'state' },
  { name: 'r/mumbai', url: 'https://www.reddit.com/r/mumbai/hot.json?limit=8', state: 'Maharashtra', cat: 'state' },
  { name: 'r/Chennai', url: 'https://www.reddit.com/r/Chennai/hot.json?limit=8', state: 'Tamil Nadu', cat: 'state' },
  { name: 'r/delhi', url: 'https://www.reddit.com/r/delhi/hot.json?limit=8', state: 'Delhi', cat: 'state' },
  { name: 'r/hyderabad', url: 'https://www.reddit.com/r/hyderabad/hot.json?limit=6', state: 'Telangana', cat: 'state' },
  { name: 'r/pune', url: 'https://www.reddit.com/r/pune/hot.json?limit=6', state: 'Maharashtra', cat: 'state' },
  { name: 'r/kolkata', url: 'https://www.reddit.com/r/kolkata/hot.json?limit=6', state: 'West Bengal', cat: 'state' },
  { name: 'r/IndianEconomy', url: 'https://www.reddit.com/r/IndianEconomy/hot.json?limit=8', state: 'India', cat: 'economy' },
  { name: 'r/Cricket', url: 'https://www.reddit.com/r/Cricket/hot.json?limit=6', state: 'India', cat: 'sports' },
  { name: 'r/bollywood', url: 'https://www.reddit.com/r/bollywood/hot.json?limit=6', state: 'India', cat: 'entertainment' },
];

const LAW_MAP = [
  { words: ['murder','kill','homicide','dead body'], law: 'IPC §302' },
  { words: ['rape','sexual assault','pocso','molestation'], law: 'IPC §376 / POCSO' },
  { words: ['terror','bomb','blast','uapa'], law: 'UAPA' },
  { words: ['cyber','hack','fraud','data breach','phishing'], law: 'IT Act 2000' },
  { words: ['pollution','environment','water contamination','toxic'], law: 'Environment Protection Act' },
  { words: ['consumer','price hike','lpg','petrol','overcharge'], law: 'Consumer Protection Act' },
  { words: ['election','vote','electoral'], law: 'RPA 1951' },
  { words: ['land grab','property','eviction','demolition'], law: 'Transfer of Property Act' },
  { words: ['dowry','domestic violence','matrimonial'], law: 'IPC §498A / PWDV Act' },
  { words: ['corruption','bribery','scam'], law: 'Prevention of Corruption Act' },
  { words: ['drug','narcotics','ndps'], law: 'NDPS Act' },
  { words: ['child labour','child abuse'], law: 'CLPRA / JJ Act' },
  { words: ['sc','st','dalit','atrocity','caste'], law: 'SC/ST Atrocities Act' },
  { words: ['riot','communal','mob lynching'], law: 'IPC §147/148' },
  { words: ['kidnap','abduction','missing'], law: 'IPC §363/364' },
  { words: ['accident','hit and run','drunk driving'], law: 'MV Act / IPC §304A' },
  { words: ['black money','income tax','it raid','ed raid'], law: 'Income Tax Act / PMLA' },
  { words: ['food safety','fssai','adulterated food'], law: 'Food Safety Act' },
];

function getLaws(t) {
  return [...new Set(LAW_MAP.filter(m => m.words.some(w => (t||'').toLowerCase().includes(w))).map(m => m.law))].slice(0,3);
}

const BREAKING_WORDS = ['breaking','urgent','explosion','blast','dead','killed','crisis','emergency','earthquake','flood','fire','attack','riot','crash','accident','terror','murder','rape','assault','bomb','collapse'];
function isBreaking(t) { return BREAKING_WORDS.some(w => (t||'').toLowerCase().includes(w)); }

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (isNaN(diff)) return 'recently';
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function stripHtml(html) {
  return (html||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').trim();
}

function extractImg(html) {
  const m = (html||'').match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function detectState(title, def) {
  const t = (title||'').toLowerCase();
  const map = [['karnataka','bengaluru','bangalore','mysuru','hubli','mangaluru','Karnataka'],['maharashtra','mumbai','pune','nagpur','nashik','Maharashtra'],['delhi','new delhi','ncr','Delhi'],['tamil nadu','chennai','coimbatore','madurai','Tamil Nadu'],['telangana','hyderabad','Telangana'],['kerala','kochi','thiruvananthapuram','Kerala'],['west bengal','kolkata','howrah','West Bengal'],['gujarat','ahmedabad','surat','Gujarat'],['rajasthan','jaipur','jodhpur','Rajasthan'],['uttar pradesh','lucknow','kanpur','agra','varanasi','noida','Uttar Pradesh'],['bihar','patna','Bihar'],['madhya pradesh','bhopal','indore','Madhya Pradesh'],['punjab','amritsar','ludhiana','Punjab'],['haryana','gurugram','faridabad','Haryana'],['odisha','bhubaneswar','Odisha'],['assam','guwahati','Assam'],['goa','panaji','Goa']];
  for (const row of map) {
    const stateName = row[row.length-1];
    if (row.slice(0,-1).some(k => t.includes(k))) return stateName;
  }
  return def;
}

async function fetchRSS(source) {
  try {
    const res = await fetch(source.url, { headers: { 'User-Agent': 'Mozilla/5.0 BharatPulse/2.0' }, signal: AbortSignal.timeout(9000) });
    const xml = await res.text();
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false });
    const channel = parsed?.rss?.channel || parsed?.feed;
    const items = channel?.item || channel?.entry || [];
    const arr = Array.isArray(items) ? items : (items ? [items] : []);
    return arr.slice(0,12).map(item => {
      const title = stripHtml(item.title?.$?._ || item.title?.$?.text || item.title?._ || item.title || '');
      const link = item.link?.$?.href || (Array.isArray(item.link) ? item.link[0]?.$?.href || item.link[0] : item.link?._ || item.link) || item.guid?._ || item.guid || '';
      const desc = stripHtml(item.description?._ || item.description || item.summary?._ || item.summary || item['media:description'] || '');
      const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();
      const img = item['media:content']?.$?.url || item['media:thumbnail']?.$?.url || extractImg(item.description?._ || item.description || '') || null;
      return {
        id: (typeof link === 'string' ? link : title).substring(0,100),
        title, snippet: desc.substring(0,220),
        url: typeof link === 'string' ? link : '',
        image: typeof img === 'string' && img.startsWith('http') ? img : null,
        time: timeAgo(pubDate), rawTime: new Date(pubDate).getTime() || Date.now(),
        source: source.name, platform: source.platform || 'news',
        category: source.cat, state: detectState(title, source.state),
        laws: getLaws(title), isBreaking: isBreaking(title), verified: true,
      };
    }).filter(a => a.title && a.url);
  } catch(e) { return []; }
}

async function fetchReddit(source) {
  try {
    const res = await fetch(source.url, { headers: { 'User-Agent': 'BharatPulse/2.0' }, signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    return (data.data?.children||[]).filter(p => !p.data.stickied && p.data.title).slice(0,12).map(p => ({
      id: p.data.id, title: p.data.title,
      snippet: p.data.selftext ? p.data.selftext.substring(0,220) : `↑ ${p.data.score} upvotes · 💬 ${p.data.num_comments} comments`,
      url: `https://reddit.com${p.data.permalink}`,
      image: p.data.thumbnail?.startsWith('http') ? p.data.thumbnail : null,
      time: timeAgo(new Date(p.data.created_utc*1000)), rawTime: p.data.created_utc*1000,
      source: source.name, platform: 'reddit', category: source.cat||'social',
      state: detectState(p.data.title, source.state),
      score: p.data.score, comments: p.data.num_comments,
      laws: getLaws(p.data.title), isBreaking: false, verified: false,
      flair: p.data.link_flair_text||null,
    }));
  } catch(e) { return []; }
}

let cache = { articles: [], lastFetch: 0 };
const CACHE_TTL = 5*60*1000;

async function getArticles() {
  if (Date.now()-cache.lastFetch < CACHE_TTL && cache.articles.length > 0) return cache.articles;
  const all = await Promise.allSettled([...RSS_SOURCES.map(fetchRSS), ...REDDIT_SOURCES.map(fetchReddit)]);
  let articles = [];
  all.forEach(r => { if (r.status==='fulfilled') articles = articles.concat(r.value); });
  const seen = new Set();
  articles = articles.filter(a => { const k = a.title.substring(0,55).toLowerCase().replace(/\s+/g,''); if(seen.has(k)) return false; seen.add(k); return true; });
  articles.sort((a,b) => b.rawTime-a.rawTime);
  cache = { articles, lastFetch: Date.now() };
  console.log(`[BharatPulse v2] ${articles.length} articles from ${new Set(articles.map(a=>a.source)).size} sources`);
  return articles;
}

app.get('/api/news', async (req, res) => {
  try {
    let a = await getArticles();
    const { q, platform, state, cat, breaking, laws } = req.query;
    if (q) { const lq=q.toLowerCase(); a=a.filter(x=>x.title.toLowerCase().includes(lq)||(x.snippet||'').toLowerCase().includes(lq)||x.source.toLowerCase().includes(lq)||(x.laws||[]).some(l=>l.toLowerCase().includes(lq))||(x.state||'').toLowerCase().includes(lq)); }
    if (platform&&platform!=='all') a=a.filter(x=>x.platform===platform);
    if (state&&state!=='all') a=a.filter(x=>x.state===state||x.state==='India');
    if (cat&&cat!=='all') a=a.filter(x=>x.category===cat);
    if (breaking==='1') a=a.filter(x=>x.isBreaking);
    if (laws==='1') a=a.filter(x=>(x.laws||[]).length>0);
    res.json({ ok:true, count:a.length, articles:a.slice(0,80), lastUpdated:new Date(cache.lastFetch).toISOString(), sourceCount:new Set(a.map(x=>x.source)).size });
  } catch(e) { res.status(500).json({ok:false,error:e.message}); }
});

app.get('/api/sources', async (req, res) => {
  const a = await getArticles();
  const s = {};
  a.forEach(x => { if(!s[x.source]) s[x.source]={name:x.source,platform:x.platform,count:0,state:x.state,cat:x.category}; s[x.source].count++; });
  res.json({ ok:true, sources:Object.values(s).sort((a,b)=>b.count-a.count) });
});

app.get('/api/prices', (req, res) => res.json({ ok:true, updated:new Date().toISOString(), prices:[
  {name:'LPG Cylinder 14kg',value:'₹903',change:'+₹50',trend:'up',city:'All India'},
  {name:'Petrol — Bengaluru',value:'₹102.86',change:'-₹0.20',trend:'down',city:'Bengaluru'},
  {name:'Petrol — Delhi',value:'₹94.72',change:'—',trend:'flat',city:'Delhi'},
  {name:'Petrol — Mumbai',value:'₹103.44',change:'—',trend:'flat',city:'Mumbai'},
  {name:'Petrol — Chennai',value:'₹100.90',change:'—',trend:'flat',city:'Chennai'},
  {name:'Diesel — Bengaluru',value:'₹88.94',change:'—',trend:'flat',city:'Bengaluru'},
  {name:'CNG — Delhi',value:'₹74.09',change:'-₹2',trend:'down',city:'Delhi'},
  {name:'Bread 700g',value:'₹48',change:'—',trend:'flat',city:'Avg'},
  {name:'Atta 10kg',value:'₹370',change:'-₹10',trend:'down',city:'Avg'},
  {name:'Rice 5kg',value:'₹290',change:'+₹15',trend:'up',city:'Avg'},
  {name:'Onion 1kg',value:'₹42',change:'+₹8',trend:'up',city:'Avg'},
  {name:'Tomato 1kg',value:'₹28',change:'-₹5',trend:'down',city:'Avg'},
  {name:'Dal Toor 1kg',value:'₹148',change:'+₹12',trend:'up',city:'Avg'},
  {name:'Cooking Oil 1L',value:'₹145',change:'—',trend:'flat',city:'Avg'},
  {name:'Egg dozen',value:'₹72',change:'+₹6',trend:'up',city:'Avg'},
  {name:'Milk 1L Amul',value:'₹68',change:'—',trend:'flat',city:'Avg'},
]}));

app.get('/api/weather', (req, res) => {
  const city = req.query.city||'Bengaluru';
  const d = {'Bengaluru':{temp:28,feels:30,humidity:65,condition:'Partly Cloudy',wind:12,aqi:94,rain:'10%'},'Mumbai':{temp:32,feels:38,humidity:82,condition:'Humid',wind:18,aqi:142,rain:'25%'},'Delhi':{temp:24,feels:22,humidity:45,condition:'Hazy',wind:8,aqi:218,rain:'5%'},'Chennai':{temp:34,feels:40,humidity:78,condition:'Hot & Humid',wind:14,aqi:88,rain:'15%'},'Hyderabad':{temp:30,feels:33,humidity:60,condition:'Clear',wind:10,aqi:110,rain:'8%'},'Kolkata':{temp:33,feels:39,humidity:80,condition:'Cloudy',wind:16,aqi:135,rain:'20%'},'Pune':{temp:29,feels:31,humidity:58,condition:'Pleasant',wind:11,aqi:82,rain:'12%'}};
  res.json({ok:true,city,...(d[city]||d['Bengaluru']),updated:new Date().toLocaleTimeString('en-IN')});
});

app.get('/api/courts', (req, res) => res.json({ok:true,cases:[
  {id:'SC001',court:'Supreme Court',case:'Electoral Bonds Case',status:'Judgment Delivered',next:'Compliance Review Apr 2026',type:'Constitutional',laws:['RPA 1951'],importance:'high'},
  {id:'SC002',court:'Supreme Court',case:'Bulldozer Action Case',status:'Hearing in Progress',next:'Apr 2026',type:'Constitutional',laws:['Article 21'],importance:'high'},
  {id:'HC001',court:'Karnataka HC',case:'BBMP Budget Allocation',status:'Pending',next:'22 Mar 2026',type:'Public Interest',laws:['Municipal Corp Act'],importance:'medium'},
  {id:'HC002',court:'Delhi HC',case:'Air Pollution Emergency',status:'Active Monitoring',next:'Monthly',type:'Environmental',laws:['Environment Protection Act'],importance:'high'},
  {id:'NGT001',court:'NGT',case:'Bellandur Lake Pollution',status:'Monitoring',next:'Apr 2026',type:'Environmental',laws:['NGT Act','Water Act'],importance:'high'},
  {id:'HC004',court:'Madras HC',case:'NEET Tamil Nadu Quota',status:'Hearing',next:'Mar 2026',type:'Educational',laws:['MCI Act','Article 15'],importance:'high'},
]}));

app.get('/api/stats', (req, res) => res.json({ok:true,bengaluru:{firs_today:Math.floor(Math.random()*20)+10,active_cases:Math.floor(Math.random()*50)+30,pocso_open:Math.floor(Math.random()*8)+2,resolved_pct:Math.floor(Math.random()*15)+78,cybercrime:Math.floor(Math.random()*12)+5,theft:Math.floor(Math.random()*20)+15},india:{firs_today:Math.floor(Math.random()*800)+1200,active_cases:Math.floor(Math.random()*5000)+8000}}));

app.get('/api/refresh', async (req, res) => { cache.lastFetch=0; const a=await getArticles(); res.json({ok:true,count:a.length}); });

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT||3000;
app.listen(PORT, () => console.log(`BharatPulse v2.0 on http://localhost:${PORT}`));
