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
  'Arsenal': 'arsenal',
  'Aston Villa': 'aston-villa',
  'Brentford': 'brentford',
  'Chelsea': 'chelsea',
  'Crystal Palace': 'crystal-palace',
  'Fulham': 'fulham',
  'Leeds United': 'leeds-united',
  'Liverpool FC': 'liverpool-fc',
  'Manchester City': 'manchester-city',
  'Manchester United': 'manchester-united',
  'Tottenham Hotspur': 'tottenham-hotspur'
};

const CHAMPIONS_NAME = {
  'Leeds United': 'Leeds United',
  'Newcastle United': 'Newcastle United',
  'Crystal Palace': 'Crystal Palace',
  'Arsenal': 'Arsenal',
  'Manchester United': 'Manchester United',
  'Sunderland': 'Sunderland',
  'Bournemouth': 'Bournemouth',
  'Tottenham Hotspur': 'Tottenham Hotspur',
  'Chelsea': 'Chelsea',
  'Coventry City': 'Coventry City',
  'Manchester City': 'Manchester City',
  'Ipswich Town': 'Ipswich Town',
  'Liverpool FC': 'Liverpool FC',
  'Fulham': 'Fulham',
  'Aston Villa': 'Aston Villa',
  'Hull City': 'Hull City',
  'Everton': 'Everton',
  'Brighton & Hove Albion': 'Brighton & Hove Albion',
  'Nottingham Forest': 'Nottingham Forest',
  'Brentford': 'Brentford'
};

const P1_SLUGS = {
  'Leeds United': ['leeds-united'],
  'Newcastle United': ['newcastle-united', 'newcastle'],
  'Crystal Palace': ['crystal-palace'],
  'Arsenal': ['arsenal'],
  'Manchester United': ['manchester-united'],
  'Sunderland': ['sunderland'],
  'Bournemouth': ['bournemouth'],
  'Tottenham Hotspur': ['tottenham-hotspur', 'tottenham'],
  'Chelsea': ['chelsea'],
  'Coventry City': ['coventry-city', 'coventry'],
  'Manchester City': ['manchester-city'],
  'Ipswich Town': ['ipswich-town', 'ipswich'],
  'Liverpool FC': ['liverpool-fc', 'liverpool'],
  'Fulham': ['fulham'],
  'Aston Villa': ['aston-villa'],
  'Hull City': ['hull-city', 'hull'],
  'Everton': ['everton'],
  'Brighton & Hove Albion': ['brighton-hove-albion', 'brighton-and-hove-albion', 'brighton'],
  'Nottingham Forest': ['nottingham-forest', 'forest'],
  'Brentford': ['brentford']
};

const USER_AGENT = 'Mozilla/5.0 (compatible; LeedsTripPlannerBot/1.0; +https://github.com/)';
const fetchCache = new Map();

function normalize(text = '') {
  return text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseEuro(raw) {
  if (raw == null) return null;
  const clean = String(raw).replace(/[^\d.,]/g, '').replace(/,(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const num = Number(clean);
  return Number.isFinite(num) ? num : null;
}

async function fetchText(url) {
  if (fetchCache.has(url)) return fetchCache.get(url);
  const result = await (async () => {
    try {
      const res = await fetch(url, { headers: { 'user-agent': USER_AGENT, 'accept-language': 'en-IE,en;q=0.9' } });
      const text = await res.text();
      return { ok: res.ok, status: res.status, url: res.url, text, norm: normalize(load(text)('body').text()) };
    } catch (error) {
      return { ok: false, status: 0, url, text: '', norm: '', error: String(error) };
    }
  })();
  fetchCache.set(url, result);
  return result;
}

function championsMatchTitle(home, away) {
  return `${CHAMPIONS_NAME[home] || home} v ${CHAMPIONS_NAME[away] || away}`;
}

async function getChampionsQuote(fixture) {
  const slug = CHAMPIONS_PAGE_SLUG[fixture.home];
  if (!slug) return { price: null, url: null, status: 'unsupported' };
  const url = `https://champions-travel.com/football/${slug}`;
  const page = await fetchText(url);
  if (!page.ok) return { price: null, url, status: 'fetch-failed' };

  const title = championsMatchTitle(fixture.home, fixture.away);
  const exact = new RegExp(`${escapeRegExp(title)}[\\s\\S]{0,280}?From\\s*€\\s*([0-9]+(?:[.,][0-9]+)?)`, 'i');
  const exactMatch = page.norm.match(exact);
  if (exactMatch) {
    return { price: parseEuro(exactMatch[1]), url, status: 'ok' };
  }

  return { price: null, url, status: 'not-listed' };
}

function extractP1Prices(normText) {
  const prices = [];
  const regex = /From\s*€\s*([0-9]+(?:[.,][0-9]+)?)/gi;
  for (const match of normText.matchAll(regex)) {
    const idx = match.index ?? 0;
    const context = normText.slice(Math.max(0, idx - 35), Math.min(normText.length, idx + 45)).toLowerCase();
    if (context.includes('hotel needed')) continue;
    const value = parseEuro(match[1]);
    if (value != null) prices.push(value);
  }
  return prices;
}

async function getP1Quote(fixture) {
  const homeSlugs = P1_SLUGS[fixture.home] || [];
  const awaySlugs = P1_SLUGS[fixture.away] || [];
  let hadFetchFailure = false;

  for (const homeSlug of homeSlugs) {
    for (const awaySlug of awaySlugs) {
      const url = `https://www.p1travel.com/en/football/premier-league/${homeSlug}-vs-${awaySlug}`;
      const page = await fetchText(url);
      if (!page.ok) { hadFetchFailure = true; continue; }
      if (/Page Not Found|Could not find requested resource/i.test(page.text)) continue;
      const prices = extractP1Prices(page.norm);
      if (!prices.length) {
        return { price: null, url, status: 'listed-no-price' };
      }
      return { price: Math.min(...prices), url, status: 'ok' };
    }
  }

  return { price: null, url: null, status: hadFetchFailure ? 'fetch-failed' : 'not-listed' };
}

function preserveOnTransientFailure(fresh, previous) {
  if (fresh?.status !== 'fetch-failed') return fresh;
  if (previous && typeof previous.price === 'number') {
    return { ...previous, stale: true, status: 'stale-fetch-failed' };
  }
  return fresh;
}

async function readPrevious() {
  try { return JSON.parse(await readFile('data/prices.json', 'utf8')); }
  catch { return { fixtures: {} }; }
}

async function main() {
  const generatedAt = new Date().toISOString();
  const previous = await readPrevious();
  const out = {
    generatedAt,
    providers: ['champions', 'p1'],
    fixtures: {}
  };

  for (const fixture of FIXTURES) {
    const [champions, p1] = await Promise.all([
      getChampionsQuote(fixture),
      getP1Quote(fixture)
    ]);

    const prev = previous.fixtures?.[fixture.id] || {};
    const safeChampions = preserveOnTransientFailure(champions, prev.champions);
    const safeP1 = preserveOnTransientFailure(p1, prev.p1);

    out.fixtures[fixture.id] = {
      home: fixture.home,
      away: fixture.away,
      date: fixture.sort,
      checkedAt: generatedAt,
      champions: safeChampions,
      p1: safeP1
    };

    console.log(`${fixture.id}: CT=${safeChampions.price ?? '—'} (${safeChampions.status}) | P1=${safeP1.price ?? '—'} (${safeP1.status})`);
  }

  await mkdir('data', { recursive: true });
  await writeFile('data/prices.json', JSON.stringify(out, null, 2) + '\n', 'utf8');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
