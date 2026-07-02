# Bowlkollen — Project Overview

> Last updated: 2026-07-01
> Accurate current state — use this to orient a new AI assistant or collaborator.

---

## What is Bowlkollen?

A live sports companion for Swedish amateur and semi-professional bowling leagues. The leagues that Sofascore, Flashscore, and similar apps ignore. The goal is to become the daily habit app for every bowler, club, and fan in Sweden — and eventually other European countries.

**Live at**: invite-only soft launch (via `/invite/[code]` gate)
**Tech**: Next.js 16 App Router · React 19 · TypeScript 5 · Supabase · Framer Motion 12

---

## Data sources

All match, player, club, and team data comes from **BITS** — the Swedish bowling federation's official data system, synced into Supabase via import scripts. Tables: `bits_matches`, `bits_players`, `bits_clubs`, `bits_teams`, `bits_divisions`. No scraping — this is official federation data.

Season ID convention: `2025` = the 2025/26 season (July 2025 → June 2026).

---

## Design system

| Token | Value |
|---|---|
| Background | `#0b0d10` (near-black) |
| Accent | `#f5c200` gold — active state, live focal point, genuine milestones only |
| Positive | `#5dcaa5` green — upward deltas, wins, gains |
| Negative | `#e05555` red — downward deltas, losses, danger |
| Text | Ink scale via `useColors()` — never hardcode hex in components |
| Body font | DM Sans |
| Display font | Brand display (headings, stats numbers) |

**Rules**: `useColors()` hook always, never manual theme switch. `next/image` not `<img>`. `next/link` not `<a>`. `useSession()` not `getSession()`. No `any`. No magic numbers — use `src/lib/constants.ts`.

---

## Pages — current state

### Core navigation (bottom nav: Hem / Schema / Hitta / Följer / Profil)

| Route | Description | Status |
|---|---|---|
| `/` | Home feed — LiveCard hero, MatchRow results, standings widget | Live, real data |
| `/schema` | Season view — PulsHero arc + SeasonWeekline, week-grouped match feed, pinch→Atlas | Live, follow-scoped |
| `/schema/atlas` | Atlas — full-season division heatmaps, map mode (pinch or LayoutGrid icon) | Live |
| `/discover` | Onboarding suggestions — follow teams, teammates, rivals | Live |
| `/following` | Followed teams/players feed | Live |
| `/profile` | User profile — claim player, link account | Live |

### Match & player detail

| Route | Description | Status |
|---|---|---|
| `/matches/[id]` | Match scorecard — live updates via Supabase realtime | Live |
| `/matcher/[id]` | Same as above (Swedish URL, kept for legacy links) | Live |
| `/players` | Player directory — alphabetical, searchable | Live |
| `/players/[id]` | Player profile — BITS data, MatchLog, PlayerDNA | Live, real BITS data |
| `/compare/[id1]/[id2]` | Player vs player comparison | Live |
| `/compare/teams/[id1]/[id2]` | Team vs team comparison | Live |

### Team & club

| Route | Description | Status |
|---|---|---|
| `/teams` | Team/club directory | Live |
| `/teams/[id]` | Team detail — stats, roster, match history | Live |
| `/clubs/[bitsId]` | BITS club detail | Live |
| `/club/[club_slug]` | Legacy club URL | Live |
| `/team/[id]/intern` | Team internal admin panel | Live |
| `/team/[id]/laguttagning/[matchid]` | Match lineup selection (captain) | Live |
| `/team/[id]/tillganglighet/[matchid]` | Player availability form | Live |

### Browse & explore

| Route | Description | Status |
|---|---|---|
| `/divisioner` | Division standings | Live |
| `/divisioner/[id]` | Division detail | Live |
| `/league` | Division standings (older view — may overlap with /divisioner) | Live |
| `/hallar` | Bowling hall directory | Live |
| `/hallar/[id]` | Hall detail | Live |
| `/klotshopar` | Pro shop directory | Live |
| `/oljeprofiler` | Oil pattern database | Live |
| `/tavlingar` | Major tournament overview (SM-slutspel, GP Final, SLLM) | Live |
| `/sllm` | Storm Lucky Larsen Masters — squads + results | Live |

### User & auth

| Route | Description | Status |
|---|---|---|
| `/login` | Google OAuth + magic link | Live |
| `/reset-password` | Password reset | Live |
| `/onboarding` | First-run flow | Live |
| `/landing` | Email waitlist (Mailchimp sync) | Live |
| `/legal` | GDPR-compliant privacy policy | Live |
| `/prediktion` | Match prediction game + leaderboard | Live |
| `/mer` | "More" overflow menu | Live |
| `/invite/[code]` | Invite-gate entry (soft-launch access control) | Live |

### Admin

| Route | Description | Status |
|---|---|---|
| `/admin` | Live scoring panel | Live |
| `/admin/bits` | BITS sync panel | Live |
| `/admin/claims` | Manual player claim review (esp. juniors) | Live |
| `/admin/players` | Player management | Live |

### Dev / staging only

| Route | Description |
|---|---|
| `/mockup` | Player profile design iteration scratchpad — not linked in nav |
| `/schema/atlas` → map mode | Atlas map view (pinch to access) — foundation built, visual WIP |

---

## Key systems

### Follow system
`follows` table + RLS. `useFollows` / `useToggleFollow` queries. `FollowButton` component. `/following` page. Onboarding suggests teammates, Elitserien players, and rivals based on claimed team.

### Player claims
License number auto-verifies adults instantly. Juniors always require manual review at `/admin/claims`. DB trigger blocks following unclaimed juniors. Claim flow at `/profile`.

### Invite gating
`ENABLE_INVITE_GATE` flag. `/invite/[code]` sets a signed cookie. Admin-controlled code list. Attribution tracked per code.

### Season scoping
`/schema` defaults to "Din säsong" (matches from divisions your followed players/teams appear in), falls back to Elitserien for new users. Personalized via `get_user_season_matches()` RPC.

### Schema → Atlas
- `/schema` (PulsHero arc + week feed): pinch inward → navigates to `/schema/atlas`
- `/schema/atlas` (per-division heatmaps): pinch inward → enters map mode (all 48 division grids visible simultaneously). Tap a grid → zoom back into that division.

---

## What is NOT built yet (high priority)

- **Competition/tournament page** — SM-slutspel bracket detail, per-competition standings. `/tavlingar` exists as an overview but lacks depth.
- **Venue page** — venue pill on match cards is not yet tappable. Needs `venue_id` in MatchPreviewPayload first.
- **Live now signal** — `isLive` is stubbed `false` everywhere. Real live match detection requires polling or webhook from BITS.
- **Season average trend** — sparkline of rolling average on player profile.
- **Push notifications** — follow a team, get notified when their match starts/ends.
- **Auto-Story Engine** — narrative event detection (upsets, 300 games, derbies). Spec in `AUTO_STORY_ENGINE_SPEC.md`. Phase 1 SQL → sync → TeamFeed started but not shipped.
- **Atlas map view polish** — foundation built (pinch to enter, per-division color-coded SVG grids), but visual result needs a clearer reference before iterating further.

---

## File structure conventions

```
src/
  app/                    # Next.js App Router pages
    [route]/
      page.tsx            # Async Server Component (public data via createPublicSupabase)
      _components/        # Client components for this route
  components/             # Shared UI components (AppShell, Nav, BottomNav, ThemeProvider...)
  lib/
    types.ts              # All domain types — single source of truth
    constants.ts          # STALE times, season dates, thresholds — no magic numbers
    queries.ts            # React Query hooks
    brand.ts              # COLOR, FONT, SPACE tokens
    divisions.ts          # Division categorical color system
    division-standings.ts # Tier detection, TIER_COLOR, MOSAIC_TIER_COLOR, divisionColor()
    color.ts              # HSL math utilities (hexToHsl, hslToHex, hashStr)
    profile-adapter.ts    # BITS player data → UI profile shape
    profile.ts            # Player DNA, scoring analytics
    supabase.ts           # Browser Supabase client
    supabase-server.ts    # Server Supabase clients (public + auth-aware)
  __tests__/              # Unit tests (vitest) — pure lib functions only
```

---

## Test + build

```bash
npm run test        # vitest — 171 tests, all pure lib functions
npm run build       # Next.js production build — must pass before any PR
npx tsc --noEmit    # Type check
```

CI: `.github/workflows/ci.yml` — typecheck + unit tests on every push. Build job scaffolded but disabled (needs env secrets in repo settings).
