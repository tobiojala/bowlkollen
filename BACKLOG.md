# Bowlkollen — Backlog

> Work top-to-bottom within each tier. Updated 2026-07-01.
> Filter: "Does this make match day better for a player, fan, or club?" — if not, park it.

---

## 🔴 High — missing features that matter to real users

### Competition / tournament depth
`/tavlingar` exists as a thin overview. It needs:
- SM-slutspel bracket detail (who plays who, results per round)
- Per-competition standings table
- Match cards that link to `/matches/[id]`
This is the first "real" page a serious bowler or admin checks besides their own team.

### Live match signal
`isLive = false` is hardcoded everywhere. A match being live is the single most important event in the app. Options:
- Poll BITS for status changes every 60–90 seconds when a match is scheduled today
- Or hook into match start/end events from admin panel (manual trigger, simpler)
Without this, the "live" visual language (red pulse, "NU" label, LiveCard hero) is decoration.

### Season average sparkline on player profile
Bowlers track their average obsessively. A small SVG line of rolling 10-game average under the player's stat block would be the most-checked feature on the profile page. Pure client-side math from existing `MatchLog` data — no new queries needed.

### Duplicate route cleanup
`/league` and `/divisioner` both show division standings. `/matches/[id]` and `/matcher/[id]` both show the same match. `/teams`/`/team` (legacy, uuid-keyed, ~10% coverage) and `/lag` (canonical, works for every team, now has the full captain toolkit `/team` had) are now the biggest one — `/lag` should win and the legacy routes redirect/retire. Decide canonical URLs, redirect the others, remove dead code.

---

## 🟠 Medium — improves quality and trust

### Competition page (SM, GP, SLLM)
`/tavlingar` exists but is thin. Each major competition should have a dedicated page:
- Current bracket / round results
- Historical winners
- Link to all matches in that competition

### Atlas map view — needs a clearer reference
Foundation is built (pinch to enter, per-division SVG grids, color-coded by division identity). The visual result was not satisfying without a concrete wireframe to build toward. **Do not iterate** until there's a Stitch mockup or sketch showing exactly what "zoom out and see all divisions glowing" should look like. Park until then.

### Venue page
Tappable venue pill on match cards → `/venues/[id]` with address, map, Google Maps link, upcoming matches at this hall. Blocked by: `venue_id` not yet in `MatchPreviewPayload`. Wire that first.

### Push notifications
Web Push API + service worker + Supabase edge function trigger on match status change. Biggest retention lever, highest effort. Needs live signal (above) to be meaningful.

### Oil pattern → match link
`/oljeprofiler` has full profiles. Match detail shows the pattern name as a string. Make it a `<Link>` to the matching profile. Low effort, adds real navigation depth.

---

## 🟡 Polish — things that matter but aren't blockers

### Handicap display
Swedish club bowling uses handicap frequently. Formula: `max(0, (200 - average) × 0.8)`. Show on player profile and in match lineups. Data is available (we have averages).

### Past season browser
~~No way to see results older than current season.~~ Partially done: `/lag` falls back to last season's final table when the current season has no finished matches yet, and 5 historical seasons (2021–2025) are now backfilled. Still missing: a season selector on `/league`/`/divisioner` and team history for seasons further back than "previous."

### Player ranking
"Where do I rank vs. other players in my division by average?" — a simple leaderboard within a division/club. No new data needed, just a query sorted by computed average.

### Weekday header removal on Atlas heatmap
The day-letter row (M T O T F L S) above each month makes the heatmap read as a calendar app rather than an activity map. User intention is to remove it. Left pending because it's a one-line change once decided.

---

## 🟢 Future / deferred

### Auto-Story Engine
Narrative event detection: upsets, 300 games, derbies, promotion battles. Full spec in `AUTO_STORY_ENGINE_SPEC.md`. Phase 1 SQL schema drafted. This is what eventually makes Atlas cells mean something more than raw match count. **Do not build before the story detection data exists.**

### Frame-by-frame scoring
Enter individual frames (10 frames × 2 balls) per player instead of just 4 game totals. Powers detailed scorecard view, automatic strike/spare detection, pins-left analytics. Requires new `match_frames` table and admin UI extension.

### BK Rating
Full "mot fältet" performance rating system. Spec in `BK_RATING_SPEC.md`. Deferred — needs stable player averages at scale first.

### Remotion video clips
Code exists, no API route or UI trigger. Revisit after core features are stable.

### Multi-sport / international
Phase 2+ (see `VISION_FUTURE.md`). Not now.

---

## Waiting / blocked externally

- **SBF API** — Email sent to api@swebowl.se. Would replace manual BITS import with real-time sync.
- **Lanetalk frame data** — No public API. Formal partnership pitch to support@lanetalk.com needed.
