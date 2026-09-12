import { mkdir, readFile, writeFile } from 'node:fs/promises';

const ROUTES = [
  ['ORK','MAN'], ['MAN','ORK'],
  ['ORK','LPL'], ['LPL','ORK'],
  ['ORK','BHX'], ['BHX','ORK'],
  ['ORK','STN'], ['STN','ORK']
];

const MONTHS = [];
for (let year = 2026, month = 9; year < 2027 || (year === 2027 && month <= 5); ) {
  MONTHS.push({ year, month });
  month += 1;
  if (month === 13) { year += 1; month = 1; }
}

const MAX_AGE_HOURS = 12;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';

async function readPrevious() {
  try { return JSON.parse(await readFile('data/flights.json', 'utf8')); }
  catch { return { generatedAt: null, routes: {}, status: {} }; }
}

function monthPrefix(year, month) {
  return `${year}-${String(month).padStart(2,'0')}-`;
}

function copyWithoutMonth(routeData = {}, year, month) {
  const prefix = monthPrefix(year, month);
  return Object.fromEntries(Object.entries(routeData).filter(([date]) => !date.startsWith(prefix)));
}

async function fetchMonth(orig, dest, year, month) {
  const url = `https://services-api.ryanair.com/timtbl/3/schedules/${orig}/${dest}/years/${year}/months/${month}`;
  try {
    const res = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'user-agent': UA,
        'accept-language': 'en-IE,en;q=0.9',
        'cache-control': 'no-cache'
      },
      signal: AbortSignal.timeout(15000)
    });

    // Ryanair can return 404 where no timetable exists for a route/month.
    if (res.status === 404) return { ok: true, empty: true, url, days: {} };
    if (!res.ok) return { ok: false, status: `http-${res.status}`, url, days: {} };

    const data = await res.json();
    const days = {};
    for (const dayEntry of data?.days || []) {
      const day = Number(dayEntry?.day);
      if (!Number.isInteger(day) || day < 1 || day > 31) continue;
      const date = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const flights = (dayEntry?.flights || []).map(f => ({
        departureTime: f?.departureTime || null,
        arrivalTime: f?.arrivalTime || null,
        flightNumber: f?.flightNumber || null
      })).filter(f => f.departureTime && f.arrivalTime);
      if (flights.length) days[date] = flights;
    }
    return { ok: true, empty: false, url, days };
  } catch (error) {
    return { ok: false, status: error?.name === 'TimeoutError' ? 'timeout' : 'fetch-failed', url, days: {}, error: String(error) };
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runner() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return results;
}

async function main() {
  const previous = await readPrevious();
  const force = process.env.FORCE_FLIGHTS === '1';
  const prevMs = Date.parse(previous?.generatedAt || '');
  const ageHours = Number.isFinite(prevMs) ? (Date.now() - prevMs) / 3600000 : Infinity;

  if (!force && ageHours < MAX_AGE_HOURS) {
    console.log(`Flight timetable feed is ${ageHours.toFixed(1)}h old; skipping until ${MAX_AGE_HOURS}h refresh window.`);
    return;
  }

  const jobs = [];
  for (const [orig, dest] of ROUTES) {
    for (const { year, month } of MONTHS) jobs.push({ orig, dest, year, month });
  }

  console.log(`Refreshing ${jobs.length} Ryanair route-month timetables...`);
  const results = await mapLimit(jobs, 6, async job => {
    const result = await fetchMonth(job.orig, job.dest, job.year, job.month);
    const flights = Object.values(result.days || {}).reduce((n, day) => n + day.length, 0);
    console.log(`${job.orig}-${job.dest} ${job.year}-${String(job.month).padStart(2,'0')}: ${result.ok ? `${flights} flights` : result.status}`);
    return { ...job, ...result };
  });

  const routes = structuredClone(previous?.routes || {});
  const coverage = structuredClone(previous?.coverage || {});
  let successful = 0, failed = 0, preserved = 0, flightCount = 0;
  const failures = [];

  for (const r of results) {
    const key = `${r.orig}-${r.dest}`;
    routes[key] ||= {};
    coverage[key] ||= [];
    const ym = `${r.year}-${String(r.month).padStart(2,'0')}`;
    if (r.ok) {
      successful += 1;
      routes[key] = { ...copyWithoutMonth(routes[key], r.year, r.month), ...r.days };
      if (!coverage[key].includes(ym)) coverage[key].push(ym);
    } else {
      failed += 1;
      const prefix = monthPrefix(r.year, r.month);
      const hadOld = Object.keys(routes[key]).some(date => date.startsWith(prefix));
      if (hadOld) preserved += 1;
      failures.push(`${key} ${r.year}-${String(r.month).padStart(2,'0')} ${r.status}`);
    }
  }

  for (const route of Object.values(routes)) {
    for (const day of Object.values(route)) flightCount += day.length;
  }

  // Only advance generatedAt if at least one timetable request actually succeeded.
  const generatedAt = successful ? new Date().toISOString() : previous?.generatedAt || null;
  const out = {
    generatedAt,
    source: 'Ryanair timetable API',
    localTimes: true,
    refreshWindowHours: MAX_AGE_HOURS,
    routes,
    coverage,
    status: {
      requests: results.length,
      successful,
      failed,
      preservedMonths: preserved,
      flightsLoaded: flightCount,
      failures: failures.slice(0, 30)
    }
  };

  await mkdir('data', { recursive: true });
  await writeFile('data/flights.json', JSON.stringify(out, null, 2) + '\n', 'utf8');

  if (failed && !successful) {
    console.warn(`All ${failed} Ryanair timetable requests failed; retained previous data.`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
