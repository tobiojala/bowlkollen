# Session handoff — start here

Quick-start context for continuing the Bowlkollen redesign in a new session.
Read this first, then the linked docs as needed.

## Where everything lives

- **Working branch:** `claude/focused-goldberg-c4sl1f` (all redesign work).
  `main` is untouched — the live site is safe; nothing ships until we merge.
- Local == remote == latest commit. Pull the branch and run.
- **Run:** `npm run dev` → use the printed `Network` URL + path on phone.
  Watch for stale dev servers / wrong port (this has bitten us 3×: if it says
  "Port 3000 in use" or "Another next dev server is already running", `kill`
  the old PID and restart, then use the exact printed port).
- **Test:** `npm run test` (91 passing). Build needs Supabase env vars
  (prod has them; locally `NEXT_PUBLIC_SUPABASE_URL` + `_ANON_KEY`).

## Decisions locked (don't re-litigate — see docs)

- **Center of gravity: consumer freemium app**, NOT admin SaaS. (`MONETIZATION.md`)
- **Free = overview + identity + social + your own data + logistics;
  PRO = depth, scouting others, prediction, vanity.** Launch FREE; turn the
  wall on after density; tag PRO features with `requiresPro` as we build.
- **BK Rating at launch = "kommer snart" teaser** (full mot-fältet engine is a
  fast-follow once data is dense). Gated by `BK_READY` in mockup data.
- **Junior policy = public, no social until guardian/captain claims.**
- **Team page** = lightweight logistics layer (auto-feed, availability,
  lineup, events), NOT club admin. Deferred past soft launch.

## Key docs in repo root

- `LAUNCH_PLAN.md` — the 16-day soft-launch plan (spine-only redesign).
- `REDESIGN_PLAN.md` — full rollout: 5 templates, route-by-route phases.
- `MONETIZATION.md` — free/PRO line, claim funnel, pricing, guardrails.
- `BK_RATING_SPEC.md` — the metric: mot-fältet, 4 pillars, source weights.
- `TEAM_PAGE_AUDIT.md` / `AUTO_STORY_ENGINE_SPEC.md` — team-side (later phase).

## What's DONE

- Design system: tokens (near-black tonal palette, type scale, gold budget) in
  `globals.css` + `lib/theme.ts`; primitives in `components/ui/primitives.tsx`.
- `/mockup` fully redesigned: identity-first hierarchy, swipeable hero deck
  (Säsongssnitt / BK / Ranking), DNA with recency gradient, prediction fan in
  the curve sheet, all 6 sheets re-skinned (dark page-layer), BK Rating
  explainer sheet. Components split into `app/mockup/_components/`.
- BK Rating engine: `lib/bk-rating.ts` + 19 tests + `BK_RATING_SPEC.md`.
- Consolidation merge of the parallel Cursor work (sport-config, Sentry,
  vitest/e2e, story-engine SQL, etc.) re-skinned to the design system.
- NextMatchCard redesigned. Phone testing fixed (`allowedDevOrigins`).

## IN PROGRESS — Player profile reconciliation (3 steps)

Goal: port the mockup design onto the REAL `/players/[id]` route, sharing the
same components so they never drift. **All 3 steps are done — the redesigned
profile is live on `/players/[id]` with real data.**

- **[DONE] Step 1** — `src/lib/profile.ts`: canonical `ProfileData` shape +
  `buildProfileData()` (one home for stat math) + 9 tests. `IdentitySection`
  generalized to render from `ProfileData` + identity/level/achievements/
  bkRating props (no more mock-data imports). Mockup renders identically.
- **[DONE] Step 2** — generalized the remaining sections + match-data sheets to
  render from `ProfileData`/props instead of importing mock `data.ts`:
  `DnaSection` (`overlayAvgs` prop), `AnalysisSection` (`data` + `firstName`),
  `FeedSection` (`data` + `challenges` + `reactions`), `CurveSheet`
  (`matches` + `upcoming`), `MatchSheet` (`match` + `highlight`), `DuellSheet`
  (`lastSeasonAvgs` + `firstDate`/`lastDate`), `DnaInfoSheet`
  (`matchCount` + `highlights` + `initials`). Added view-model types
  (`ProfileUpcoming`/`ProfileHighlight`/`ProfileChallenge`/`ProfileReactions`)
  to `profile.ts`. Only `COLORS` (design tokens) still imported from `data.ts`,
  same as Step 1. `/mockup` renders identically; 91 tests + tsc + lint green.
  (`ChallengesSheet`/`BkRatingSheet` are out of scope — not match-data sheets.)
- **[DONE] Step 3** — real adapter + redesigned route:
  - `src/lib/profile-adapter.ts`: `resultsToProfileMatches()` maps Supabase
    `match_results` → `ProfileMatch[]` (W/L, opponent, home/away from the
    player's `team_id`, oldest-first) + `buildProfileFromResults()`. 8 tests.
  - `PlayerProfileView.tsx` (pure presentation, reuses the shared mockup
    sections + sheets) and `PlayerProfileClient.tsx` (real data → adapter →
    view, plus card / H2H / edit modals). `page.tsx` now renders
    `PlayerProfileClient`. The dark redesign renders for real players.
  - Also finished generalizing `ProfileDNA` (the chart Step 2 missed): it now
    takes `highlights` + `initials` props instead of importing mock
    `DNA_HIGHLIGHTS` / hardcoding "SH"; coords rounded to kill an SSR hydration
    mismatch. `/mockup` still renders pixel-identical.
  - 99 tests + tsc + lint + `next build` all green.

  LAUNCH-STATE / placeholders on the real profile (intentional, wire later):
  • BK Rating = "kommer snart" (`bkRating={null}`) per the locked decision.
  • Followers/following show `0` — no count source yet (`identity` TODO).
  • Challenges/reactions/ranking/level are empty (no real data source yet).
  • Achievements come from `player.achievements` (real strings → chips).

  FOLLOW-UPS: the old `PlayerClient.tsx` + `PlayerDNA.tsx` + `PlayerMatchLog.tsx`
  are now superseded but kept as reference — delete once avatar-upload and real
  follower counts are ported into the new view. Optional: relocate the shared
  sections out of `app/mockup/_components/` into `components/profile/` so the
  real route doesn't import from a route folder.

NOTE: `/players/[id]` now shows the NEW design. `/mockup` remains the design
playground (mock data); the two share the same components.

## After the profile: the 16-day spine (LAUNCH_PLAN.md)

1. Home feed (`/`) redesign — first impression.
2. Player profile (this reconciliation).
3. Match detail (`/matches/[id]`) — score hero, serie pills, kill cyan glow.
Then: claim flow polish + manual approval, GDPR/junior guardrails, cross-app
token sweep, merge to `main` (~day 13), real data import, invite.
