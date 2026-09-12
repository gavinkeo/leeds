# Leeds Trip Planner v16

## v16 changes

### Flight-aware annual leave
The planner no longer assumes annual leave is simply the match day plus the following day.

It now builds a travel window from the actual Ryanair timetable:
- finds the latest usable Cork outbound that gets you to the destination with a realistic ground-transfer buffer;
- if the match-day flight is too late, it automatically moves the outbound to the previous available flight (searching up to three days earlier);
- always treats the following day as the normal travel-home day unless a genuine same-day return is possible;
- counts the previous night shift too when the outbound is before 14:00, because finishing a night shift and then taking a morning/early-afternoon flight is not treated as realistic;
- counts every scheduled shift that overlaps the resulting travel window.

So a Tuesday 20:00 match during a Mon/Tue/Wed night block can correctly require **36h annual leave**.

### Dynamic Ryanair schedules
`data/flights.json` is generated from Ryanair's published timetable API for the Cork routes used by the planner:
- ORK ↔ MAN
- ORK ↔ LPL
- ORK ↔ BHX
- ORK ↔ STN

The GitHub Action still runs hourly for Champions Travel / P1 Travel prices. Ryanair timetable data is refreshed every 12 hours (and is forced on every manual workflow run). A failed timetable request preserves the last known good month rather than deleting it.

This is important for routes such as Birmingham: BHX may be geographically ideal for Villa/Coventry, but the actual departure time can make it a poor match-trip route.

### Reseller capsules
Fixture-row capsules now use the full names:
- **Champions Travel €…**
- **P1 Travel €…**

If both providers have prices, both are shown.

### Tap a fixture
Expanding a fixture now shows:
- preferred Cork airport route;
- actual outbound/return Ryanair times for each possible TV slot;
- whether an earlier-day outbound is required;
- recalculated annual leave for that exact travel plan;
- onward travel notes;
- ticket route / away-allocation context;
- live reseller prices.

## GitHub files
Upload these at repository root:

```text
index.html
package.json
data/
  prices.json
  flights.json
scripts/
  update-prices.mjs
  update-flights.mjs
.github/
  workflows/
    update-prices.yml
```

If your file picker hides `.github`, edit the existing `.github/workflows/update-prices.yml` directly in GitHub and replace its contents with the v16 workflow.

After deploying v16, run **Actions → Update reseller prices → Run workflow** once. A manual run forces a full Ryanair timetable refresh immediately.

## v18 confirmed-fixture flight capsule
Confirmed league fixtures now show the optimal Ryanair itinerary directly in the main capsule row beside Champions Travel / P1 Travel prices.

- Evening Leeds home games: match-day ORK→MAN, next-day MAN→ORK.
- Daytime confirmed games: a genuine same-day return is selected when the timetable supports it and it improves the trip.
- Confirmed away games: the planner uses the best viable Ryanair gateway already configured for that opponent and shows any required pre-match travel date.
- The capsule includes outbound time, return time and the calculated annual-leave hit.
- It updates automatically when `data/flights.json` refreshes.


## v18 UI change
Confirmed fixtures now show the optimal flight plan as three compact capsules: one outbound flight, one return flight, and one annual-leave capsule. This replaces the long combined itinerary capsule.
