# Bowlkollen — Project Overview & Status

> Last updated: 2026-06-02
> For sharing with AI assistants (Gemini, GPT) to get outside perspective.

---

## What Is Bowlkollen?

Bowlkollen is a **live sports companion web app** for Swedish amateur and semi-professional bowling leagues — the leagues that SofaScore, FlashScore, and similar apps don't cover. The goal is to be the daily habit app for every bowler, club, and fan in Sweden, and eventually other European countries.

**Vision**: "The sports companion for every league that the big apps ignore."

**Target users**: Bowlers, club captains, fans following local Swedish bowling leagues.

**Live at**: Not yet deployed publicly (local dev / Vercel preview).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), React 19, TypeScript 5 |
| Styling | Inline CSS + Tailwind CSS 4, Framer Motion 12 |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Auth | Supabase Auth — Google OAuth + magic link email |
| Video gen | Remotion 4 (score highlight clips — wired but not fully live) |
| Data source | BITS (Swedish bowling federation) via scraping + import scripts |
| Icons | lucide-react |
| Export | xlsx (Excel export) |
| Screenshots | html2canvas |

---

## Swedish Bowling Context

Swedish bowling has a national league system. From top to bottom:
1. **Elitserien** — Top tier (men + women)
2. **Allsvenskan** — Second tier
3. **Division 1** (north, south, east, west, etc.)
4. **Division 2**, **3**, **4** below that

A match is played between two teams at a bowling alley. Each team puts up 4 boards (bord), each board has 2 players who play 4 games each. Scoring is complex — you win a board by having more total pins, and you win the match by winning more boards. Individual scores matter for stats (averages, honor roll, handicap).

**BITS** = the Swedish bowling federation's data system. Bowlkollen scrapes and imports BITS data for clubs, teams, players, and results.

---

## What Is Built

### Pages & Routes

| Route | What it does | Status |
|---|---|---|
| `/` | Home dashboard: live matches, standings, honor roll | Works (demo data) |
| `/teams` | Browse all clubs with county filter + team count | Live |
| `/teams/[id]` | Team detail: season stats, player roster, match history | Live |
| `/players` | Player directory, alphabetical, searchable | Live |
| `/players/[id]` | Player profile: game history, score tier, club affiliation | Live |
| `/league` | Division standings for all tiers with zone coloring | Live |
| `/clubs/[bitsId]` | BITS club detail page | Live |
| `/matches/[id]` | Match scorecard: game-by-game results, live updates | Live |
| `/admin` | Live scoring interface for admins | Live |
| `/compare/[id1]/[id2]` | Player vs player head-to-head | Live |
| `/compare/teams/[id1]/[id2]` | Team vs team head-to-head | Live |
| `/team/[id]/intern` | Team internal admin panel | Live |
| `/team/[id]/laguttagning/[matchid]` | Match lineup selection | Live |
| `/team/[id]/tillganglighet/[matchid]` | Player availability form | Live |
| `/hallar` | Bowling hall directory | Live |
| `/hallar/[id]` | Hall detail page | Live |
| `/klotshopar` | Pro shop directory | Live |
| `/oljeprofiler` | Oil pattern/lane configuration database | Live |
| `/tavlingar` | Major tournament overview (SM-slutspel, GP Final, SLLM) | Live |
| `/sllm` | Storm Lucky Larsen Masters — player squads + results | Live |
| `/puls` | Live pulse: real-time score updates ticker | Live |
| `/profile` | User profile: claim player, claim team captain | Live |
| `/login` | Google OAuth + magic link auth | Live |
| `/api/fetch` | Server-side proxy to bypass CORS (BITS scraping) | Live |
| `/api/sbf` | SBF API proxy — awaiting SBF authorization | Pending |
| `/api/sllm` | bowlres.se proxy — awaiting API access | Pending |

### Features in Detail

**Home Dashboard**
- Hero carousel: live matches with countdown, upcoming matches, major tournaments
- Tension score metric (how close a live match is based on board scores)
- Honor roll: individual games ≥ 220 across all live matches
- Standings tables for all active divisions
- Zone coloring: gold = SM-slutspel (playoffs), orange = relegation playoff, grey = relegated
- Recent results grouped by date

**Live Match Scoring (Admin)**
- Three-tab admin panel: Live Scoring / Match Management / Team Management
- Set up match lineup: 4 boards × 2 positions × 2 teams = 16 player slots
- Enter scores game-by-game (4 games per player)
- Auto-calculate board winners (banp system) and match score
- Change match status: upcoming → live → completed

**Match Scorecard**
- Real-time updates via Supabase subscriptions
- Full grid: boards, players, individual game scores, series totals, match totals
- High series / honor roll callouts
- H2H history between these two teams

**Team Pages**
- Season statistics (played/won/drawn/lost/points)
- Current division and standing position
- Player roster with average scores
- Recent match results with game-by-game breakdown

**Player Pages**
- Game history and running average
- Score tier badge: Elite (250+) / Gold (220–249) / Blue (200–219) / Normal
- Team affiliation
- Claim profile (link to your user account)

**Club System**
- BITS club data: county, home hall, active status
- Team count per club
- Club detail with associated teams

**User System**
- Google OAuth + magic link email login
- Claim a player profile ("this is me")
- Claim team captain / manager role
- Follow teams (favorites)
- Personal widget dashboard

**Other Features**
- Bowling hall directory with venue details
- Pro shop directory
- Oil pattern database (e.g. Sport patterns, house shots)
- Tournament pages (SM-slutspel bracket, SLLM squads)
- Player vs player comparison
- Team vs team comparison
- Availability form (tell your captain if you're available for a match)
- Lineup selection (captain picks the lineup)

---

## Data Models (Supabase/PostgreSQL)

```
matches          — home/away team, score, status, division, date, venue, oil_profile
match_lineups    — player name, board, position, team, match
match_results    — per-player game scores (int array [g1,g2,g3,g4]), board, position
teams            — name, club, city, division affiliation
players          — name, team_id
bits_clubs       — BITS club data: name, county, hall, active flag, logo_url
bits_teams       — BITS team data: division, club link
favorites        — user → team follow
player_claims    — user claims ownership of a player profile
club_claims      — user claims captain/manager role for a team
```

---

## Design Language

- Dark mode only (light mode hidden for now)
- Background: near-black `#10161e`
- Accent: gold `#f5c200` for highlights, rankings, badges
- Glass morphism UI: `backdrop-filter: blur()` + semi-transparent surfaces
- Floating pill navigation (top nav + bottom tabs on mobile)
- Mobile-first, max content width ~600px
- Framer Motion for page transitions and list animations
- Score tiers use color coding: gold, blue, normal

---

## Current Limitations & Known Issues

1. **Home page runs on demo/mock data** — `const DEMO = true` in `src/app/page.tsx`. Real data queries are written but disabled. The app needs real match data entered.

2. **No live season data yet** — The database has clubs and teams from BITS import, but match results need to be entered manually via the admin panel (or via SBF API once authorized).

3. **SBF API access pending** — Applied for access to the Swedish bowling federation's official API (`api@swebowl.se`). Once approved, standings and results can be synced automatically.

4. **All styling is inline CSS** — Every component uses `style={{}}` props. No shared CSS constants, no design tokens. Makes global updates slow and repetitive.

5. **Giant page files** — `page.tsx` (home) is 1,954 lines. Several other pages are 600–800 lines. Everything is in one file per route.

6. **No error boundaries** — If a Supabase query fails, the page may blank silently.

7. **No skeleton loaders** on most pages (only text-based "Laddar...").

8. **Admin panel lacks validation** — No bounds check on scores, no duplicate lineup detection.

9. **Remotion video generation** — Components exist but no API route or UI to trigger video rendering.

10. **No push notifications** — Users can't get alerted when a followed team's match starts or ends.

11. **No player averages** — The data model supports per-game scores but there's no computed per-player season average shown in standings or on team pages.

---

## What's Working Well

- The design looks clean and polished (dark glass UI, gold accents, smooth animations)
- Supabase real-time subscriptions are wired up for live match updates
- The scoring system correctly handles Swedish bowling's board/banp point system
- BITS data import scripts work (clubs and teams are loaded)
- Auth flow is complete: Google OAuth, magic link, session persistence
- Player claim / captain claim system is fully built
- Mobile layout is clean (floating pills nav, bottom tab bar)
- The division zone coloring system (playoffs, relegation) matches SvBF rules
- All major routes are built and functional

---

## What A Bowler Wants (Gap Analysis)

Things real bowlers would expect that are missing or incomplete:

| Want | Status |
|---|---|
| See my team's schedule | Partial (needs real match data) |
| See live scores during a match | Built, needs data |
| See my season average | Not computed/displayed |
| See my ranking vs other players | Not built |
| Get notified when my team plays | Not built |
| Compare myself to teammates | Partial (head-to-head exists) |
| See handicap | Not built |
| Download my stats | Not built |
| Club captain to manage lineup | Built (laguttagning page) |
| See who's available for next match | Built (tillganglighet page) |
| Share my high game on social media | Remotion exists but not live |
| Browse results from past seasons | Not built |
| See oil pattern for tonight's match | Partial (oljeprofiler exists, not linked to matches) |

---

## Questions for Outside Review

1. What features should be prioritized to make this useful enough that a bowler opens it every week?
2. Is the scoring/lineup data model correct for Swedish team bowling (4 boards, 4 games, banp system)?
3. What's the best way to handle the transition from demo data to real data without breaking the UI?
4. How should per-player season averages be calculated and stored (materialized view? computed on read?)?
5. What's missing from the club captain experience to make them willing to enter data themselves?
6. Is Remotion worth pursuing for social sharing, or is there a simpler approach?
7. What would make bowlers check this daily instead of just after matches?
