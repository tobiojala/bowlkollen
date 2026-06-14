# Foundations for scale

Engineering groundwork so the app can grow safely. Status + the plan.

## ✅ CI (done)
`.github/workflows/ci.yml` runs on push (`main`, `claude/**`) and PRs:
- **Hard gates:** `tsc --noEmit` and `npm run test` (both green today).
- **Soft gate:** `npm run lint` (`continue-on-error`) until the pre-existing
  `set-state-in-effect` findings are cleaned, then make it blocking.
- **build** job is scaffolded but `if: false` — enable it after adding repo
  secrets `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (`next build` needs them).

## 🟡 Typed data layer (in progress — needs your Supabase access for the accurate step)
**Why:** 144 `any`/`as any`/`as unknown as` casts and an untyped Supabase
client. The DB boundary is the highest-leverage place to add type safety —
it turns schema drift into compile errors instead of runtime bugs.

**Tables in scope (27):** availability_polls, availability_responses,
bits_clubs, bits_teams, bowling_centers, club_claims, email_subscribers,
favorites, lineup_slots, lineups, match_lineups, match_predictions,
match_results, matches, notifications, oil_profiles, player_cheers,
player_claims, players, pro_shops, profiles, team_event_reactions,
team_events, team_members, team_posts, team_sponsors, teams.

**The accurate path (do this, don't hand-roll):**
1. Generate types from the live schema:
   `SUPABASE_PROJECT_ID=<ref> npm run gen:types`
   (needs the Supabase CLI — `npx supabase` — logged in, or a
   `SUPABASE_ACCESS_TOKEN`). Writes `src/lib/database.types.ts`.
2. Type the clients: `createClient<Database>()` /
   `createBrowserClient<Database>()` in `src/lib/supabase*.ts`.
3. Then retire the 144 casts incrementally, file by file — typed `.from()`
   results replace `as unknown as X[]`. tsc will guide each one.

> ⚠️ Do **not** wire a hand-written `Database` type: a partial/incorrect one
> makes every `.from()` typecheck against it and would break the green build.
> The core tables (teams/players/matches/match_results) aren't in the
> `supabase/*.sql` files, so the generator is the only accurate source.

**Safe now, without DB types** (started): replace `any` that can be typed from
existing `src/lib/types.ts` models or `@supabase/supabase-js` (`User`, etc.) —
component state, callback params, event handlers.

## Next foundations (ranked, after the typed layer)
1. **Scoring/standings correctness** — make league table + match scoring match
   `BLABOKEN.md` (banpoäng → matchpoäng) and lock with tests. Trust-critical.
2. **Server Components + ISR** — 28 of 33 pages are `'use client'` doing
   client-side fetches; move the top-traffic ones (home/match/teams) to the
   prescribed SC + prefetch + `createPublicSupabase()` pattern (see AGENTS.md).
3. **GDPR/junior gate** — blocked on the `birth_year` data-model decision.
4. **Tailwind migration** — see `TAILWIND_MIGRATION.md` (DX; lowest scale-impact).
