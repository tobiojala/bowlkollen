# Bowlkollen — Prioritized Backlog

> Goal: get the app ready to show real bowlers and get honest feedback.
> Work top-to-bottom. Mark done with [x].

---

## 🔴 Must fix before showing anyone

- [x] **Flip DEMO flag to real data**
  Done — `DEMO = false` in both `src/app/page.tsx` and `src/app/league/page.tsx`. Added `calcHomeStandings()` to compute live Elitserien standings from Supabase match data. Empty state already handled by the existing `isEmpty` check.

- [x] **Player season average — calculate and display**
  Already computed from `match_results.games[]` in the team squad tab. Confirmed working.

- [x] **Player stats on team pages**
  Squad tab now shows: average, high game (BÄST), and match count (MATCHER) per player. Added `high` field to `playerStats` state and computation.

- [x] **Error boundaries + "something went wrong" UI**
  Team page (`src/app/teams/[id]/page.tsx`) now has `.catch()` on the Promise.all and renders a "Kunde inte ladda laget / Försök igen" screen. Error check ordered before the `!team` guard so it's reachable.

- [x] **Skeleton loaders on all detail pages**
  Team page now has animated skeleton boxes (banner, stats bar, match rows) instead of "Laddar...". Home page already had a full skeleton. Player and match pages still use text — add when touching those pages next.

---

## 🟠 High — affects usability and trust

- [ ] **Fix the /teams route confusion**
  `/teams` shows a list of clubs (Stockholms BK, etc.), not teams. Either rename the route to `/clubs` and update the bottom nav, or redesign it to actually show division standings / team list. A bowler clicking "Teams" expects to see their division table.

- [ ] **Admin: score validation**
  In `src/app/admin/page.tsx` — no bounds checking on score input (max is 300 per game in bowling), no duplicate check when adding players to a lineup, no confirmation before overwriting an existing result. Easy fixes that prevent bad data.

- [ ] **Lock or remove the /schema route**
  `src/app/schema/page.tsx` is a 719-line debug page visible to anyone. If it exposes schema or raw query output, either delete it or put it behind an admin auth check.

- [ ] **Link oil pattern to match detail**
  `matches.oil_profile` is a free-text string but `/oljeprofiler` has full profiles with descriptions. On the match detail page, make the oil pattern name a clickable link to the matching profile. Low effort, adds real value.

---

## 🟡 Polish — improves quality and maintainability

- [ ] **Native frame-by-frame score entry in admin**
  New feature. Extend the admin scoring panel to support entering individual frames (10 frames × 2 balls) per player, not just 4 game totals. This is the only path to shot-by-shot scorecards independent of scoring.se/Lanetalk/QubicaAMF (none of which have public APIs). Stores in a new `match_frames` table. Powers:
  - Detailed scorecard view on `/matches/[id]`
  - Automatic spare/strike detection and cumulative scoring
  - Pins left standing data (optional, for analytics later)

- [ ] **Split src/app/page.tsx into components**
  1,954 lines in one file. Extract: `HonorRoll`, `StandingsSection`, `RecentResults`, `HeroMatchCard` as separate components. The fetch logic can stay in the page but the render blocks need to move out. Makes it possible to work on one section without touching the others.

- [x] **Centralize shared helper functions**
  Added `shortDiv`, `dateLabel`, `countdown`, `divTierColor` to `src/lib/utils.ts`. Removed local copies from 8 files: all 4 shared components (TopPerformers, SeasonTimeline, TeamTableWidget, NextMatchPreview), Widgets.tsx, league/page, admin/page, puls/page, teams/[id]/page. `shortName` was already exported from utils — now properly imported everywhere.

- [x] **Share high game (Web Share API)**
  `ScoreChip` in `matches/[id]/page.tsx` now shows a ↗ share button for any score ≥220. Tapping opens the native share sheet with player name, score, and match URL. Falls back to clipboard copy on desktop. No extra dependencies.

---

## 🟢 Nice to have — retention features

- [ ] **Season average trend chart**
  On the player profile page, show a small line chart of rolling average over the last 10–20 games. Bowlers check this obsessively. A simple SVG sparkline is enough — no chart library needed.

- [ ] **Push notifications for followed teams**
  Users follow teams but never get notified when a match starts or ends. Needs: Web Push API + a service worker + a Supabase edge function trigger on match status change. Biggest retention lever, but highest effort.

- [ ] **Handicap display**
  Swedish club bowling often uses handicap (based on average vs. a target, e.g. 200). Show calculated handicap on the player profile and in match lineups. Formula: `max(0, (200 - average) × 0.8)` for typical Swedish rules.

- [ ] **Browse results from past seasons**
  No way to see results older than the current season. Add a season selector (2023/24, 2024/25, 2025/26) to the league standings and team history pages.

---

## Waiting / blocked

- [ ] **SBF API integration** — Email sent to api@swebowl.se, waiting for authorization.
- [ ] **Lanetalk frame data integration** — No public API. Best path is a formal partnership email to support@lanetalk.com. Pitch: Bowlkollen + Lanetalk = live frame-by-frame scores for every Bowlit alley in Sweden.
- [ ] **Remotion video clips** — Code exists, no API route or UI trigger yet. Revisit after core features are stable.
