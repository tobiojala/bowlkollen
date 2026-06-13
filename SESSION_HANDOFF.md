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
same components so they never drift. **Step 1 of 3 is done.**

- **[DONE] Step 1** — `src/lib/profile.ts`: canonical `ProfileData` shape +
  `buildProfileData()` (one home for stat math) + 9 tests. `IdentitySection`
  generalized to render from `ProfileData` + identity/level/achievements/
  bkRating props (no more mock-data imports). Mockup renders identically.
- **[NEXT] Step 2** — generalize the remaining sections the same way so they
  take `ProfileData`/props instead of importing mock `data.ts`:
  `DnaSection`, `AnalysisSection`, `FeedSection`, and the match-data sheets
  (`CurveSheet`, `MatchSheet`, `DuellSheet`, `DnaInfoSheet`). Mechanical now
  that the pattern is proven. Keep `/mockup` rendering identically at each step.
- **[THEN] Step 3** — real adapter + route: map Supabase `match_results` →
  `ProfileMatch[]` (compute W/L, opponent, home/away from the player's
  `team_id`), build `ProfileData`, and render the redesigned profile in
  `/players/[id]`. The old `app/players/[id]/_components/PlayerClient.tsx`
  (real data, OLD design) is the file being replaced — it already computes the
  same stats, so it's a guide, not a throwaway.

NOTE: `/players/[id]` still shows the OLD design on purpose until Step 3.
Only `/mockup` reflects the new design today.

## After the profile: the 16-day spine (LAUNCH_PLAN.md)

1. Home feed (`/`) redesign — first impression.
2. Player profile (this reconciliation).
3. Match detail (`/matches/[id]`) — score hero, serie pills, kill cyan glow.
Then: claim flow polish + manual approval, GDPR/junior guardrails, cross-app
token sweep, merge to `main` (~day 13), real data import, invite.
