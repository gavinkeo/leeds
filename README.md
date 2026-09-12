# Leeds Trip Planner v13

## Important: upload the whole repo structure
The automatic Champions Travel / P1 updater is a GitHub Actions workflow. GitHub only sees it when this exact path exists in the repository:

```text
.github/workflows/update-prices.yml
```

The v13 ZIP is **repo-root ready**: `index.html`, `.github`, `data`, `scripts`, and `package.json` are all at the top level of the ZIP rather than inside another wrapper folder.

## Reseller prices
- Champions Travel + P1 prices are refreshed **hourly** at minute 17 UTC.
- You can also run it immediately from **Actions → Update reseller prices → Run workflow**.
- The website warns clearly when the feed is more than **2 hours old**.
- Temporary CT/P1 fetch failures preserve the last known good price rather than blanking it.
- Each GitHub Actions run now has a summary showing how many CT/P1 prices were found and whether either provider had fetch failures.

## Files that must be in the GitHub repo
```text
index.html
package.json
data/
  prices.json
scripts/
  update-prices.mjs
.github/
  workflows/
    update-prices.yml
```

## First run
After uploading/committing the files:
1. Open the repository's **Actions** tab.
2. Select **Update reseller prices**.
3. Choose **Run workflow** once.
4. When it goes green, `data/prices.json` will be committed automatically and the website will pick it up.

GitHub scheduled workflows are best-effort and may start a few minutes after :17, but an age over two hours is now visibly flagged on the site.


## v14 workflow fix
- Removed npm cache setup that required a missing `package-lock.json`.
- Updated GitHub actions runtime to `checkout@v7` / `setup-node@v7` with Node 24.
- Summary now explicitly says whether the scraper succeeded and how old the price file is.
