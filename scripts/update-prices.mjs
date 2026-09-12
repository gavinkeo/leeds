import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';

const FIXTURES = [
  { id: 'new-h', sort: '2026-09-14', home: 'Leeds United', away: 'Newcastle United' },
  { id: 'pal-h', sort: '2026-09-20', home: 'Leeds United', away: 'Crystal Palace' },
  { id: 'ars-a-oct', sort: '2026-10-10', home: 'Arsenal', away: 'Leeds United' },
  { id: 'mun-h', sort: '2026-10-18', home: 'Leeds United', away: 'Manchester United' },
  { id: 'sun-a-oct', sort: '2026-10-25', home: 'Sunderland', away: 'Leeds United' },
  { id: 'bou-a-oct', sort: '2026-10-31', home: 'Bournemouth', away: 'Leeds United' },
  { id: 'spurs-h', sort: '2026-11-07', home: 'Leeds United', away: 'Tottenham Hotspur' },
  { id: 'che-a', sort: '2026-11-21', home: 'Chelsea', away: 'Leeds United' },
  { id: 'cov-h', sort: '2026-11-28', home: 'Leeds United', away: 'Coventry City' },
  { id: 'mci-a', sort: '2026-12-02', home: 'Manchester City', away: 'Leeds United' },
  { id: 'ips-h', sort: '2026-12-05', home: 'Leeds United', away: 'Ipswich Town' },
  { id: 'liv-a', sort: '2026-12-12', home: 'Liverpool FC', away: 'Leeds United' },
  { id: 'ful-h', sort: '2026-12-19', home: 'Leeds United', away: 'Fulham' },
  { id: 'avl-a-box', sort: '2026-12-26', home: 'Aston Villa', away: 'Leeds United' },
  { id: 'hul-a-dec', sort: '2026-12-29', home: 'Hull City', away: 'Leeds United' },
  { id: 'eve-h', sort: '2027-01-01', home: 'Leeds United', away: 'Everton' },
  { id: 'mci-h', sort: '2027-01-06', home: 'Leeds United', away: 'Manchester City' },
  { id: 'spurs-a', sort: '2027-01-16', home: 'Tottenham Hotspur', away: 'Leeds United' },
  { id: 'che-h', sort: '2027-01-23', home: 'Leeds United', away: 'Chelsea' },
  { id: 'cov-a', sort: '2027-01-30', home: 'Coventry City', away: 'Leeds United' },
  { id: 'bou-h', sort: '2027-02-06', home: 'Leeds United', away: 'Bournemouth' },
  { id: 'eve-a', sort: '2027-02-10', home: 'Everton', away: 'Leeds United' },
  { id: 'avl-h', sort: '2027-02-20', home: 'Leeds United', away: 'Aston Villa' },
  { id: 'ful-a', sort: '2027-02-27', home: 'Fulham', away: 'Leeds United' },
  { id: 'hul-h', sort: '2027-03-03', home: 'Leeds United', away: 'Hull City' },
  { id: 'bha-h', sort: '2027-03-13', home: 'Leeds United', away: 'Brighton & Hove Albion' },
  { id: 'new-a', sort: '2027-03-20', home: 'Newcastle United', away: 'Leeds United' },
  { id: 'nfo-h', sort: '2027-04-10', home: 'Leeds United', away: 'Nottingham Forest' },
  { id: 'bre-a', sort: '2027-04-17', home: 'Brentford', away: 'Leeds United' },
  { id: 'liv-h', sort: '2027-04-24', home: 'Leeds United', away: 'Liverpool FC' },
  { id: 'ips-a', sort: '2027-05-01', home: 'Ipswich Town', away: 'Leeds United' },
  { id: 'ars-h', sort: '2027-05-08', home: 'Leeds United', away: 'Arsenal' },
  { id: 'mun-a', sort: '2027-05-15', home: 'Manchester United', away: 'Leeds United' },
  { id: 'sun-h', sort: '2027-05-23', home: 'Leeds United', away: 'Sunderland' },
  { id: 'pal-a', sort: '2027-05-30', home: 'Crystal Palace', away: 'Leeds United' }
];

const CHAMPIONS_PAGE_SLUG = {
  'Arsenal': 'arsenal', 'Aston Villa': 'aston-villa', 'Brentford': 'brentford',
  'Chelsea': 'chelsea', 'Crystal Palace': 'crystal-palace', 'Fulham': 'fulham',
  'Leeds United': 'leeds-united', 'Liverpool FC': 'liverpool-fc',
  'Manchester City': 'manchester-city', 'Manchester United': 'manchester-united',
  'Tottenham Hotspur': 'tottenham-hotspur'
};

const P1_SLUGS = {
  'Leeds United': ['leeds-united'], 'Newcastle United': ['newcastle-united','newcastle'],
  'Crystal Palace': ['crystal-palace'], 'Arsenal': ['arsenal'],
  'Manchester United': ['manchester-united'], 'Sunderland': ['sunderland'],
  'Bournemouth': ['bournemouth'], 'Tottenham Hotspur': ['tottenham-hotspur','tottenham'],
  'Chelsea': ['chelsea'], 'Coventry City': ['coventry-city','coventry'],
  'Manchester City': ['manchester-city'], 'Ipswich Town': ['ipswich-town','ipswich'],
  'Liverpool FC': ['liverpool-fc','liverpool'], 'Fulham': ['fulham'],
  'Aston Villa': ['aston-villa'], 'Hull City': ['hull-city','hull'],
  'Everton': ['everton'],
  'Brighton & Hove Albion': ['brighton-hove-albion','brighton-and-hove-albion','brighton'],
  'Nottingham Forest': ['nottingham-forest','forest'], 'Brentford': ['brentford']
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';
const fetchCache = new Map();
let FX = { EUR: 1, USD: null, GBP: null };

function normalize(text='') { return text.replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim(); }
function escapeRegExp(str) { return str.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function number(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[^\d.,]/g,'').replace(/,(?=\d{3}(?:\D|$))/g,'').replace(',','.');
  const n = Number(cleaned); return Number.isFinite(n) ? n : null;
}
function codeFromCurrency(token='') {
  const t = token.toUpperCase();
  if (t.includes('€') || t === 'EUR') return 'EUR';
  if (t.includes('$') || t === 'USD') return 'USD';
  if (t.includes('£') || t === 'GBP') return 'GBP';
  return null;
}
function toEUR(amount, currency) {
  if (amount == null || !currency) return null;
  if (currency === 'EUR') return Math.round(amount);
  const rate = FX[currency];
  if (!rate) return null;
  // Frankfurter/ECB rate is units of foreign currency per €1.
  return Math.round(amount / rate);
}
function isChallenge(page) {
  const s = `${page.status} ${page.norm.slice(0,1400)}`.toLowerCase();
  return /cloudflare|captcha|verify you are human|checking your browser|access denied|bot detection|challenge-platform/.test(s);
}

async function fetchText(url) {
  if (fetchCache.has(url)) return fetchCache.get(url);
  const result = await (async()=>{
    try {
      const res = await fetch(url, {
        redirect:'follow',
        headers:{
          'user-agent':UA,
          'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'accept-language':'en-IE,en-GB;q=0.9,en;q=0.8',
          'cache-control':'no-cache',
          'pragma':'no-cache',
          'upgrade-insecure-requests':'1'
        }
      });
      const text = await res.text();
      const $ = load(text);
      const norm = normalize($('body').text());
      return {ok:res.ok,status:res.status,url:res.url,text,norm,title:normalize($('title').text())};
    } catch(error) {
      return {ok:false,status:0,url,text:'',norm:'',title:'',error:String(error)};
    }
  })();
  fetchCache.set(url,result); return result;
}

async function loadFx() {
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,GBP', { headers:{'user-agent':UA} });
    if (!r.ok) return;
    const j = await r.json();
    if (j?.rates?.USD) FX.USD = Number(j.rates.USD);
    if (j?.rates?.GBP) FX.GBP = Number(j.rates.GBP);
  } catch {}
}

function firstMoneyAfter(text, startPattern, maxChars=500) {
  const start = text.search(startPattern);
  if (start < 0) return null;
  const chunk = text.slice(start, start + maxChars);
  // Handles From €204, From $240, From £175, From EUR 204, etc.
  const m = chunk.match(/From\s*(€|\$|£|EUR|USD|GBP)\s*([0-9][0-9.,]*)/i);
  if (!m) return null;
  const sourceCurrency = codeFromCurrency(m[1]);
  const sourcePrice = number(m[2]);
  const price = toEUR(sourcePrice, sourceCurrency);
  return { price, sourcePrice, sourceCurrency };
}

async function getChampionsQuote(f) {
  const slug = CHAMPIONS_PAGE_SLUG[f.home];
  if (!slug) return {price:null,url:null,status:'unsupported'};
  const cleanUrl = `https://champions-travel.com/football/${slug}`;
  // Some versions of the site honour this; harmless if ignored.
  const page = await fetchText(cleanUrl + '?currency=EUR');
  if (!page.ok || isChallenge(page)) return {price:null,url:cleanUrl,status:page.ok?'blocked':'fetch-failed',http:page.status};

  const title = `${f.home} v ${f.away}`;
  const result = firstMoneyAfter(page.norm, new RegExp(escapeRegExp(title),'i'), 650);
  if (result?.price != null) return {...result,url:cleanUrl,status:'ok'};
  if (result && result.price == null) return {...result,url:cleanUrl,status:'fx-unavailable'};

  // Distinguish a valid event page we failed to parse from a genuine absence.
  if (new RegExp(escapeRegExp(title),'i').test(page.norm)) {
    return {price:null,url:cleanUrl,status:'parse-miss',title:page.title,http:page.status};
  }
  return {price:null,url:cleanUrl,status:'not-listed',title:page.title,http:page.status};
}

function allP1Money(text) {
  const out=[];
  const rx=/From\s*(€|\$|£|EUR|USD|GBP)\s*([0-9][0-9.,]*)/gi;
  for (const m of text.matchAll(rx)) {
    const idx=m.index??0;
    const before=text.slice(Math.max(0,idx-55),idx).toLowerCase();
    if (before.includes('hotel needed')) continue;
    const sourceCurrency=codeFromCurrency(m[1]);
    const sourcePrice=number(m[2]);
    const price=toEUR(sourcePrice,sourceCurrency);
    out.push({price,sourcePrice,sourceCurrency});
  }
  return out;
}

async function getP1Quote(f) {
  const hs=P1_SLUGS[f.home]||[], as=P1_SLUGS[f.away]||[];
  let sawBlocked=false, sawFetchFail=false, sawValidPage=false;
  for (const h of hs) for (const a of as) {
    const cleanUrl=`https://www.p1travel.com/en/football/premier-league/${h}-vs-${a}`;
    const page=await fetchText(cleanUrl+'?currency=EUR');
    if (!page.ok) { sawFetchFail=true; continue; }
    if (isChallenge(page)) { sawBlocked=true; continue; }
    if (/Page Not Found|Could not find requested resource/i.test(page.text)) continue;
    sawValidPage=true;
    const prices=allP1Money(page.norm).filter(x=>x.price!=null);
    if (prices.length) {
      const best=prices.reduce((a,b)=>b.price<a.price?b:a);
      return {...best,url:cleanUrl,status:'ok'};
    }
    const raw=allP1Money(page.norm);
    if (raw.length) return {...raw[0],price:null,url:cleanUrl,status:'fx-unavailable'};
    return {price:null,url:cleanUrl,status:'parse-miss',title:page.title,http:page.status};
  }
  return {price:null,url:null,status:sawBlocked?'blocked':sawFetchFail?'fetch-failed':sawValidPage?'parse-miss':'not-listed'};
}

// Never erase a good known price merely because a scrape returned no number.
// Dynamic prices replace it as soon as a fresh numeric quote is successfully parsed.
function preserveGood(fresh, previous) {
  if (fresh && typeof fresh.price === 'number') return fresh;
  if (previous && typeof previous.price === 'number') {
    return {
      ...previous,
      stale:true,
      status:`stale-${fresh?.status || 'no-price'}`,
      lastAttemptStatus:fresh?.status || 'no-price'
    };
  }
  return fresh;
}

async function readPrevious(){
  try{return JSON.parse(await readFile('data/prices.json','utf8'));}
  catch{return {fixtures:{}};}
}

async function main(){
  await loadFx();
  const generatedAt=new Date().toISOString();
  const previous=await readPrevious();
  const out={generatedAt,providers:['champions','p1'],fx:{base:'EUR',USD:FX.USD,GBP:FX.GBP},fixtures:{}};

  for (const f of FIXTURES) {
    const [ctFresh,p1Fresh]=await Promise.all([getChampionsQuote(f),getP1Quote(f)]);
    const prev=previous.fixtures?.[f.id]||{};
    const champions=preserveGood(ctFresh,prev.champions);
    const p1=preserveGood(p1Fresh,prev.p1);
    out.fixtures[f.id]={home:f.home,away:f.away,date:f.sort,checkedAt:generatedAt,champions,p1};
    const cExtra=champions?.sourceCurrency&&champions.sourceCurrency!=='EUR'?` ${champions.sourceCurrency}${champions.sourcePrice}→€${champions.price??'?'}`:'';
    const pExtra=p1?.sourceCurrency&&p1.sourceCurrency!=='EUR'?` ${p1.sourceCurrency}${p1.sourcePrice}→€${p1.price??'?'}`:'';
    console.log(`${f.id}: CT=${champions?.price??'—'} [${champions?.status}]${cExtra} | P1=${p1?.price??'—'} [${p1?.status}]${pExtra}`);
  }

  await mkdir('data',{recursive:true});
  await writeFile('data/prices.json',JSON.stringify(out,null,2)+'\n','utf8');
}

main().catch(e=>{console.error(e);process.exit(1);});
