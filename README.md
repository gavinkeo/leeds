# Leeds Trip Planner v15

## Important price-updater fix
The previous scraper assumed GitHub's runner would see euro prices. GitHub-hosted runners can be geolocated outside Ireland, so reseller pages may return `$` or `£` instead. That produced a successful workflow with **0 quoted fixtures** because the parser only recognised `€`.

v15 fixes that by:
- recognising EUR / USD / GBP symbols and codes;
- converting USD/GBP quotes back to EUR using a live Frankfurter/ECB exchange rate;
- using a normal Chrome user-agent and better request headers;
- detecting challenge/block pages;
- treating parse misses as diagnostic states rather than silently wiping data;
- **never erasing a previously good numeric price just because a scrape returned no price**;
- showing fresh vs retained counts and detailed CT/P1 scrape statuses in the Actions summary.

## What to replace in the repo
1. Replace `scripts/update-prices.mjs` with the v15 version.
2. Replace `data/prices.json` with the v15 version to restore current known quotes immediately.
3. Replace `.github/workflows/update-prices.yml` using GitHub's editor (because `.github` is hidden in many upload dialogs).
4. Run **Actions → Update reseller prices → Run workflow** once.

A healthy run should show non-zero quoted counts. If some figures are retained rather than fresh, the status breakdown will now explain whether that provider was blocked, missing, or could not be parsed.
