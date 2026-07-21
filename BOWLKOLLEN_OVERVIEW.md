# Bowlkollen — Project Overview

> Last updated: 2026-07-21
> Accurate current state — use this to orient a new AI assistant or collaborator.
> **Vision & product philosophy live in `PRODUCT_CONSTITUTION.md` (read that first, bowling-only, today) and `PRODUCT_DIRECTION_RESET_2026.md` (why it changed). Longer-term ambition (multi-sport, federation/center/brand partnerships) lives in `VISION_FUTURE.md` — deliberately not part of today's plan. Monetization is locked in `MONETIZATION.md` (FREE / PRO PLAYER / PRO TEAM).**

---

## What is Bowlkollen?

The home of a bowler's entire bowling life — not another statistics site (BITS, Bowlat) and not another club-management tool (Svenskalag). See `PRODUCT_CONSTITUTION.md` for the Four Pillars (Prepare/Play/Improve/Remember) and Five Worlds (Me/My Team/My People/Competitions/Bowling) that every feature should map to.

**Live at**: invite-only soft launch (via `/invite/[code]` gate)
**Tech**: Next.js 16 App Router · React 19 · TypeScript 5 · Supabase · Framer Motion 12
**Open strategic question**: native app (Expo/React Native) vs. continuing web-first — see `PRODUCT_DIRECTION_RESET_2026.md`. Not yet decided/started; everything below is still the Next.js web app.

---

## Data sources

All match, player, club, and team data comes from **BITS** — the Swedish bowling federation's official data system, synced into Supabase via import scripts (no scraping). Tables: `bits_matches`, `bits_players`, `bits_clubs`, `bits_teams`, `bits_divisions`, `bits_match_player_results`.

Season ID convention: `2026` = the 2026/27 season (July 2026 → June 2027). Historical seasons 2021–2025 are backfilled (~45k matches, `scripts/backfill-seasons.ts`).

---

## Design system

| Token | Value |
|---|---|
| Background | `#0b0d10` (near-black) |
| Accent | `#f5c200` gold — active state, live focal point, genuine milestones only |
| Positive | `#30d47e` green — upward deltas, wins, gains |
| Negative | `#e05555` red — downward deltas, losses, danger |
| Text | Ink scale (`COLOR.ink`→`ink4`) via `@/lib/brand`, or `useColors()` on older pages — never hardcode hex |
| Body font | DM Sans |
| Display font | Barlow Condensed (scores, hero stats) |

**Rules**: no `any`, no magic numbers (`src/lib/constants.ts`), `next/image` not `<img>`, `next/link` not `<a>`, `useSession()` not `getSession()`. Full list in `AGENTS.md`.

Two UI generations currently coexist: the newer inline-style system (`COLOR`/`SPACE`/`TYPE`/`FONT` from `@/lib/brand`, used by `/lag`, `/divisioner`, `/schema`) and the older `useColors()`/Tailwind-adjacent system (legacy `/teams`, `/team`, `/profile`). New pages use the `brand.ts` system.

---

## Pages — current state

### Core navigation
Bottom nav: Hem / Schema / Hitta / Följer / Profil. **Open item**: replace Följer with Tävlingar and fold follow-management into a rebuilt Profil (see "What is NOT built yet").

| Route | Description | Status |
|---|---|---|
| `/` | Home feed v2 — algorithmic ranking, squircle filters | Live |
| `/schema` | Reference library — search + browse all divisions | Live |
| `/schema/atlas` | Division heatmaps / map mode | **Parked** — foundation built, no wireframe to iterate toward |
| `/discover` | Follow suggestions (teams, players) | Live |
| `/following` | Followed teams/players feed | Live |
| `/profile` | Old-generation account page (legacy `club_claims`/`teams`, direct `getSession()`) | Live but due for a rebuild as the real account hub |
| `/onboarding` | First-run flow — team pick, tiered follow suggestions, **now also surfaces the claim sheet inline when arriving via a team-scoped invite link** | Live |

### Team pages — `/lag` is canonical, `/teams`/`/team` are legacy

| Route | Description | Status |
|---|---|---|
| `/lag/[bits_team_id]` | **Canonical team page** — works for every team (not just the ~10% in the legacy `teams` table). Hero with ambient glow + gradient ring avatar, unified stat row, narrative story banner, standings ladder, previous-season fallback, published-lineup preview, captain toolbar | Live |
| `/lag/[id]/tillganglighet/[matchid]` | Availability responder ("Kan du spela?") | Live |
| `/lag/[id]/laguttagning/[matchid]` | Lineup builder — captain-only edit, real stats (no gamified tiers), publish gated on all 8 slots filled | Live |
| `/teams`, `/teams/[id]` | Legacy team/club directory + detail (uuid-keyed, ~10% coverage) | Live, being superseded |
| `/team/[id]/intern`, `/laguttagning`, `/tillganglighet` | Legacy captain tools (the ones `/lag` just replaced) | Live, dead code once `/teams`→`/lag` redirect sweep happens |
| `/clubs/[bitsId]` | BITS club detail | Live |

### Match & player detail

| Route | Description | Status |
|---|---|---|
| `/matcher/[id]` | Canonical match page | Live |
| `/matches/[id]` | Legacy match page (same data) | Live, duplicate — pick one, redirect the other |
| `/players`, `/players/[id]` | Player directory + profile (real BITS data, stat-hero identity) | Live |
| `/compare/[id1]/[id2]`, `/compare/teams/...` | Comparisons | Live |

### Browse & explore

| Route | Description | Status |
|---|---|---|
| `/divisioner`, `/divisioner/[id]` | Division standings (list-design-language template — cardless, face-off rows, calendar/CSV export) | Live |
| `/league` | Older division standings view | Live, duplicate of `/divisioner` |
| `/hallar`, `/hallar/[id]` | Bowling hall directory | Live |
| `/klotshopar`, `/oljeprofiler` | Pro shop / oil pattern directories | Live, low priority |
| `/tavlingar` | Major tournament overview | Live, thin |
| `/sllm`, `/sm-slutspel` | Named tournament pages | Live |

### User & auth / admin

| Route | Description | Status |
|---|---|---|
| `/login`, `/reset-password`, `/legal`, `/landing` | Standard auth/legal/waitlist | Live |
| `/invite/[code]` | Invite-gate entry — now scoped (`site_access` / `team_claim` / `new_team_bootstrap`), not just flat site access | Live |
| `/admin/claims` | Player claims, team claims, **captain-request queue, bootstrap-link generator** | Live |
| `/admin/bits`, `/admin/players`, `/admin` | BITS sync, player mgmt, live scoring panel | Live |

### Dead / parked

`/puls`, `/mockup`, `/sllm` (content, not app), `/klotshopar`, `/oljeprofiler`, `/mer`, `/[slug]` catch-all — candidates for the repo cleanup pass (see open items). `/api/fetch` is an **unauthenticated open proxy with zero callers — should be deleted**; `/api/scoring` is the same shape but has one real caller and should be allowlisted to `bits.swebowl.se`.

---

## Key systems

### Team claims + captain trust model (built 2026-07-21, migrations not yet run in Supabase)
A license number alone isn't proof of identity (findable on bits.swebowl.se) — `team_claims.vouched` distinguishes "a number matched" from "arrived via a link a currently-verified teammate or admin actually shared." Captain elevation is fully gated: no self-declare, no "only member" shortcut. Paths to captain: a redeemed `new_team_bootstrap` code (admin-issued, bounded by number of teams not players), a hand-off from the current captain (`transfer_captain`), or an admin-approved `request_captain`. Verified members mint shareable `team_claim` invite codes for teammates ("Bjud in lagkompis") — sharing the link *is* the vouch. Same root cause (license-number-only auto-verify) also affects the older player-profile claim flow; not yet hardened there.

Migrations pending a Supabase run, in order: `team_claims.sql` → `team_claims_admin_review.sql` → `team_claims_identity.sql` → `team_availability.sql` → `team_lineups.sql` → `invite_scoped_claims.sql`.

### Availability + lineup builder
`team_match_availability` (one row per verified member per match) and `team_lineups`/`team_lineup_slots` (slots reference `bits_players.public_id`, not `user_id` — a captain can seat anyone on the roster regardless of app signup). Published lineups are **public** on `/lag` (fans see who's playing); drafts are team-private. No gamified rating/tier system — real BITS stats only (licence average, appearances, form), per the Constitution's anti-gamification stance.

### Follow system
`follows` table (player/team/division) + RLS. `FollowButton` component (icon/pill variants). Onboarding suggests teammates, Elitserien players, division rivals.

### Season history
5 historical seasons (2021–2025, ~45k matches) backfilled via `scripts/backfill-seasons.ts` (standalone — `lib/bits-client`/`lib/bits-sync` are `server-only`-guarded and can't be imported outside the Next bundle). `/lag` falls back to last season's final table when the current season has no finished matches yet.

### Invite gating
`ENABLE_INVITE_GATE` flag, `bk_invite` signed cookie. Extended this session from flat site-access to scoped codes (`code_type`: `site_access`/`team_claim`/`new_team_bootstrap`, `scope_bits_team_id`, `issued_by`).

### App-wide UI chrome
Top/bottom scroll blur bands live in `AppShell.tsx` (hoisted from home-feed-only) — same treatment on every route.

---

## What is NOT built yet (high priority)

- **Native app decision** — see `PRODUCT_DIRECTION_RESET_2026.md`. Nothing native exists (no Expo/Capacitor/React Native) — 100% Next.js web today.
- **Repo route cleanup** — execute the keep/redirect/park/delete pass: `/teams`→`/lag`, `/matches`→`/matcher`, `/league`→`/divisioner`, delete `/puls`/`/api/fetch`, allowlist `/api/scoring`.
- **Profile rebuild** — `/profile` is old-generation (legacy tables, direct `getSession()`). Should become the real account hub (claimed identity, team memberships/roles, follow management) once the nav swaps Följer→Tävlingar.
- **Competition/tournament depth** — `/tavlingar` is a thin overview; needs bracket detail, per-competition standings.
- **Live match signal** — `isLive` is stubbed `false` everywhere.
- **Push notifications** — the Constitution names this explicitly under Prepare/Play (captain messages, live scores); no native push exists without a native shell.
- **Sponsor showcase on team pages** — discussed, needs its own data model + admin upload flow. Not started.
- **Auto-Story Engine** — narrative event detection (upsets, 300 games, derbies). Spec in `AUTO_STORY_ENGINE_SPEC.md`. Not shipped — though the `/lag` story banner (`lib/team-narrative.ts`) already does a lighter version of this for team-level standings narratives.
- **Identity hardening beyond team claims** — the license-number-as-identity-proof issue is fixed for team claims; player-profile claims (`submit_player_claim`) have the same root vulnerability, not yet addressed.

---

## File structure conventions

```
src/
  app/                    # Next.js App Router pages
    [route]/
      page.tsx            # Async Server Component (public data via createPublicSupabase)
      _components/        # Client components for this route
  components/             # Shared UI (AppShell, Nav, BottomNav, ThemeProvider...)
  lib/
    types.ts              # All domain types — single source of truth
    constants.ts           # STALE times, season dates, thresholds — no magic numbers
    queries.ts             # React Query hooks (large — availability/lineup/claims/invite hooks all live here)
    brand.ts               # COLOR, FONT, SPACE, RADIUS, MOTION tokens (the newer design system)
    divisions.ts           # Division categorical color system
    division-standings.ts  # computeStandings, tier detection, buildTeamNarrativeInput, standingsNeighbors
    team-narrative.ts       # Story-archetype engine + NARRATIVE_COLOR/NARRATIVE_ICON
    lineup.ts               # Pure lineup-completeness + roster-sort logic
    calendar.ts, csv.ts     # .ics / CSV export builders
    invite-cookie.ts        # HMAC-signed invite cookie sign/verify
    bits-client.ts, bits-sync.ts  # BITS API + Supabase sync (server-only — can't import outside Next bundle)
    supabase.ts, supabase-server.ts, supabase-public.ts
  __tests__/              # Unit tests (vitest) — pure lib functions only
scripts/
  backfill-seasons.ts      # Standalone historical-season backfill (bypasses server-only guard)
supabase/migrations/       # ~30 files, flat — candidate for subfolder grouping
```

**Note**: `src/lib/` is 36 files flat and `supabase/migrations/` is ~30 files flat — both flagged as candidates for reorganization, not yet done (bigger blast radius than the route cleanup since it touches imports everywhere).

---

## Test + build

```bash
npm run test        # vitest — 209 tests, all pure lib functions
npm run build       # Next.js production build — must pass before any PR
npx tsc --noEmit    # Type check
```
