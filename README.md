# Leeds Trip Planner v12

## v12 UI cleanup
- Fixture-card capsule area now shows **only reseller prices**: `CT €...` and `P1 €...`.
- If both resellers have a price for the same fixture, both capsules are shown.
- Full-season tracker, watchlist and TV release radar have moved **below the fixture timeline**.
- The long hero description has been removed.
- Tapping a fixture now opens a proper **Travel logistics** panel with Cork flight gateway, onward journey, return approach, ticket route/allocation and best annual-leave outcome.
- Added **Cheapest reseller first** sorting.
- Saved trip state stays inside the expanded fixture instead of cluttering the main row.

## Dynamic reseller prices
The existing live-price setup remains:
- `scripts/update-prices.mjs`
- `data/prices.json`
- `.github/workflows/update-prices.yml`

GitHub Actions refreshes the reseller feed every 6 hours. `index.html` also contains a fallback snapshot so the page still renders prices if the JSON feed cannot be fetched locally.
