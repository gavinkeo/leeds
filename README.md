# Leeds Trip Planner v11

This version adds **live reseller pricing** from:
- **Champions Travel**
- **P1 Travel**

## What changed
- `index.html` now loads `data/prices.json` and shows reseller price capsules on each fixture.
- Expanding a fixture shows the latest Champions / P1 quote found, with direct links.
- A GitHub Actions workflow refreshes prices automatically every 6 hours and also supports manual runs.

## Files added
- `data/prices.json` → front-end price feed
- `scripts/update-prices.mjs` → Node scraper for Champions Travel + P1 Travel
- `.github/workflows/update-prices.yml` → scheduled auto-refresh
- `package.json` → installs `cheerio` and runs the update script

## GitHub setup
1. Upload the full folder contents to your repo root.
2. Make sure **GitHub Actions** are enabled for the repo.
3. Push to `main`.
4. In GitHub, go to **Actions** → **Update reseller prices** → **Run workflow** once manually.
5. After that first run, `data/prices.json` will populate/update and the site will show live prices.

## Notes
- GitHub Pages is static, so the site cannot scrape Champions/P1 directly in the browser.
- The workaround is the right one: scrape in GitHub Actions, write results into `data/prices.json`, then have the page load that file.
- If a fixture is not currently listed by one of the resellers, the site simply won’t show a live price capsule for that provider.

## v11 fallback fix
The current reseller snapshot is also embedded inside `index.html`. That means prices still render when the page is opened locally or when `data/prices.json` is temporarily unreachable. On GitHub Pages, the scheduled workflow remains the dynamic source and replaces the embedded snapshot whenever it refreshes.
