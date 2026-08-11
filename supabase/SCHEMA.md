# Bowlkollen — Database Schema Map

**Purpose:** a single place to answer *"where is X defined?"* — because migrations here are
ad-hoc files, not timestamp-ordered, and several functions are (re)defined across multiple files.

> **The live database is the source of truth.** Functions use `CREATE OR REPLACE`, so whichever
> migration ran **last** wins. This map points you at the file you almost certainly want to edit,
> and flags every function that exists in more than one file so you don't edit a dead copy.

Last mapped: 2026-08-11 · 58 migration files in `supabase/migrations/`.

---

## Tables — by domain

### BITS pipeline — the real synced data (KEEP — this is ~99% of DB size)
| Table | Rows | Notes |
|---|---|---|
| `bits_match_delmatch` | **2.36M** | Bord/delmatch moat (2v2 head-to-heads). **The space driver.** Defined in `bits_match_delmatch.sql`. ⚠ Not in generated types — code casts `as unknown as SupabaseClient`. Run `gen:types` to fix. |
| `bits_match_player_results` | 634k | Exact per-player results (`bits_exact_results.sql`). |
| `bits_players` | 55.8k | Player registry (`bits_players.sql`). |
| `bits_matches` | 51.8k | All matches (`bits_tables.sql`). |
| `bits_match_scores` | 34.9k | ⚠ **LEGACY** heuristic name-guessing pipeline — superseded by the two above. Still written nightly (`syncPendingMatchScores`) but **nothing reads it for display**. DROP candidate: remove the sync calls, then drop the table. |
| `bits_teams` | 1.2k | `bits_tables.sql` |
| `bits_clubs` | 489 | `bits_tables.sql` |
| `bits_divisions` | 629 | `bits_tables.sql` |

### Team / captain
`team_claims`, `team_members`, `team_match_availability`, `team_lineups`, `team_lineup_slots`,
`team_posts` (+ `team_post_*` board tables), `team_sponsors`, `team_events`, `team_event_reactions`,
`invite_codes`, `invite_redemptions`, `availability_polls`, `availability_responses`.

### Player / social
`player_claims`, `follows`, `follow_counts`, `favorites`, `notifications`, `player_cheers`,
`oil_profiles`, `bowling_centers`, `pro_shops`, `profiles`, `seasons`, `standings`, `anon_views`.

### ⚠ Legacy parallel system (small; still has WEB callers — do NOT drop yet)
`matches` (1.3k), `match_results`, `match_lineups`, `players`, `teams`, `leagues`, `league_teams`,
`lineups`, `lineup_slots`, `match_predictions`, `club_claims`, `email_subscribers`.
Still read by web `/admin` (manual live-scoring entry), `/clubs`, `/club`, `/matches/[id]`.
Retiring these = a "unify on BITS data" refactor, not a quick drop.

---

## Functions (RPCs) — name → file

### 🔴 Duplicated across files — edit the canonical, ignore the rest
Verify against the live DB before assuming; `CREATE OR REPLACE` means last-run wins.

| Function | # files | **Canonical (edit this)** | Other copies |
|---|---|---|---|
| `get_team_availability` | 3 | **`fix_team_display_names.sql`** | invite_scoped_claims, team_availability |
| `get_team_members` | 2 | **`fix_team_display_names.sql`** | team_role_admin |
| `get_player_identity` | 3 | **`bits_player_public_id.sql`** | bits_player_junior, junior_follow_guard |
| `get_user_season_matches` | 4 | **`schema_season_matches.sql`** ⚠verify | feed_match_result, schema_fallback_division, team_follow_bridge |
| `submit_team_claim` | 3 | **`team_claims_identity.sql`** | invite_scoped_claims, team_claims |
| `set_team_role` | 3 | **`team_role_admin.sql`** | invite_scoped_claims, team_claims |
| `validate_and_redeem_invite_code` | 2 | **`invite_scoped_claims.sql`** | invite_codes |
| `update_team_claim_status` | 2 | **`team_claims_admin_review.sql`** | admin_model |
| `update_claim_status` | 2 | **`junior_follow_guard.sql`** | admin_model |
| `get_pending_team_claims` | 2 | **`team_claims_admin_review.sql`** | admin_model |
| `get_pending_claims` | 2 | **`junior_follow_guard.sql`** | admin_model |
| `get_pending_captain_requests` | 2 | **`invite_scoped_claims.sql`** | admin_model |
| `admin_bootstrap_captain` / `admin_create_bootstrap_code` | 2–3 | **`invite_scoped_claims.sql`** | admin_model, team_invite_redemption |
| `get_team_posts` | 2 | **`team_posts.sql`** | team_polls |

### Single-home functions (edit the named file)
**Bord / delmatch (this session's moat):**
`get_player_delmatch` → `get_player_delmatch.sql` · `get_match_rivalry` → `get_match_rivalry.sql` ·
`get_konstellationer` → `get_konstellationer.sql` · `get_player_scouting` → `get_player_scouting.sql` ·
`get_h2h` → `get_h2h.sql`

**Player:** `get_player_match_history`, `get_player_percentile` → `bits_player_public_id.sql` ·
`submit_player_claim` → `claim_license_verification.sql` · `bits_player_is_junior` → `bits_player_junior.sql`

**Team/lineup:** `get_team_lineup`, `save_team_lineup` → `team_lineups.sql` ·
`submit_availability_response` → `team_availability.sql` · `get_lineup_candidates` → `lineup_candidates.sql` ·
`get_team_lineup_history` → `lineup_history.sql` · lineup eligibility → `lineup_eligibility.sql`

**Invites/roles:** `create_team_invite_code`, `get_invite_scope`, `request_captain`, `transfer_captain`,
`get_verified_team_members` → `invite_scoped_claims.sql`

**Onboarding/discover:** `get_division_rivals`, `get_nearby_teams`, `get_regional_elitserien_teams`,
`get_team_roster`, `team_current_division` → `onboarding_suggestions.sql` ·
`get_discover_recent_players` → `discover_real_data.sql` · anon views → `onboarding_anon_views.sql`

**Resolvers (sync internals):** `resolve_bits_player_lic_nbrs` → `bits_players.sql` ·
`_by_agreement` → `bits_player_agreements.sql` · `_by_club` → `bits_resolve_by_club.sql` ·
`resolve_bits_team_id` → `team_follow_bridge.sql` · `fix_bits_home_team_assignment` → `bits_fix_home_team.sql`

**Misc:** `get_follow_count` → `follow_count_fn.sql` · `is_admin` → `admin_model.sql` ·
diary/notes/balls → `player_notes.sql`, `ball_arsenal.sql`, `match_balls.sql` ·
personalization → `profile_headers.sql`, `team_appearance.sql`, `claimed_badge.sql` ·
feed → `feed_reactions.sql`

---

## Convention going forward (to stop the mess)
1. **New migration files get a date prefix:** `20260811_short_name.sql` — so order is unambiguous.
2. **Never redefine a function in a new random file.** Edit its *canonical* file above and re-run it
   (idempotent `CREATE OR REPLACE`). If you must change the return columns, `DROP FUNCTION IF EXISTS`
   first in that same file.
3. **Update this map** when you add a table or a function (one line).
4. After any migration that changes a table/column, run `npm run gen:types` so the generated types
   stay honest (currently stale — missing `bits_match_delmatch`).

## Space note
Cleaning legacy tables frees almost nothing — `bits_match_delmatch` (2.36M rows) is essentially the
whole DB. To reduce it without losing history: composite PK instead of `bigserial id`, drop `synced_at`,
maybe `player_name` (resolvable via `lic_nbr`). Otherwise the honest fix is Supabase Pro (8 GB).
