# Web ↔ Native Parity Matrix

**Single source of truth for what exists where.** The standing rule (memory
`feedback_web_full_parity`) is that **web must have FULL parity with native** —
every native feature/tool/action must be doable on web too, laid out for the
wider screen; web is never "native minus phone-only bits". We also want native
brought up on the surfaces web pioneered, so the two converge.

Check this each session before building; update the cell in the same PR that
changes the capability. Keep it honest — a 🟡 you haven't verified is better
than a ✅ you assumed.

**Legend:** ✅ full · 🟡 partial / different shape · ❌ missing · ➖ n/a by design

**Shared IA (design-polish phase, 2026-08-19):** both apps use one primary nav —
**Hem · Schema · Hitta · Tävlingar · Profil**. World-5 reference (divisioner,
klubbar, hallar, klotshopar) lives under **Hitta → Utforska bowling**; **Profil is
"me" only**. Next polish phases: shared component primitives, then motion.

Last surveyed: 2026-08-18 (route/screen + lib survey; cells marked _?_ need a human check).

---

## World 1 — Me (my game)

| Feature | Web | Native | Notes / gap |
|---|:--:|:--:|---|
| Player profile | ✅ `/players/[id]` | ✅ `/player/[id]` | Web has the ProfileTrend redesign (glow-drag graph, hero deck). Native = bring the redesign over. |
| Personal tools hub (Profil) | ✅ `/profile` | ✅ `(tabs)/profile` | Both at parity (captain/account/diary/prep/oil/scouting/balls). |
| Bowling diary / prep | ✅ `/prep/[matchId]` | ✅ `/prep/[matchId]` (`diary.ts`) | Both. |
| Ball arsenal | ✅ `/arsenal/add` | ✅ `/arsenal/add` (`balls.ts`) | Both. |
| Oil profiles | ✅ `/oljeprofiler` | 🟡 (in diary) | Web has a dedicated page; native folds oil into diary. Gap: native dedicated oil surface. |
| Scouting | ✅ (profile) | ✅ `scouting.ts` | Both. |
| Compare (players) | ✅ `/compare/[a]/[b]` | ✅ `/compare/[a]/[b]` | Both. |
| Team stats (deep) | ✅ `/lag/[id]/statistik` (+ inline summary + OG share card) | ✅ `/lag/[id]/statistik` (+ inline summary) | **Parity (2026-08-19)** — shared `computeTeamStats` engine (pinfall-first, 9 tests); both apps: summary on team page + deep page (ProfileTrend). Web also has a sponsor OG share card + Dela. |
| Compare (teams) | ✅ `/compare/teams/[id1]/[id2]` (BITS) | ✅ `/compare/teams/[a]/[b]` | **Parity (2026-08-19)** — both on `computeTeamStats` + opponent picker; leading side green. |

## World 2 — My Team

| Feature | Web | Native | Notes / gap |
|---|:--:|:--:|---|
| Team profile | ✅ `/lag/[id]` | ✅ `/lag/[id]` | Both (BITS canonical). |
| Roster / laget | ✅ (in `/lag/[id]`) | ✅ `/lag/[id]/laget` | Both. |
| Team schedule | ✅ (`/lag/[id]`, `/schema`) | ✅ `/lag/[id]/schema` | Both. |
| Lineup builder (laguttagning) | ✅ `/lag/[id]/laguttagning/[mid]` | ✅ `/lag/[id]/laguttagning/[mid]` | Both. Suggestion tool + hierarchy + konstellationer now on **both** (native-first `konstellationer.ts`; web caught up this session). |
| Availability (tillgänglighet) | ✅ `/lag/[id]/tillganglighet/[mid]` | ✅ (`team-admin.ts`) | Both. |
| Anslagstavla (nyheter) | ✅ `/lag/[id]/nyheter` | ✅ `/lag/[id]/nyheter` (`team-posts.ts`) | Both. |
| In-team join (kod / licens) | ✅ ClaimTeamSheet | ✅ `/lag/[id]/ga-med` | **Parity (2026-08-19)** — both take an optional invite code (vouch → instant) + licence (→ pending review). Same RPC `submit_team_claim`, same security (`account_verification_hardening.sql`). |
| Admin (claims/players/bits) | ✅ `/admin/*` | ➖ | Web-only console by design. |

## World 3 — My People (follow / feed)

| Feature | Web | Native | Notes / gap |
|---|:--:|:--:|---|
| Home feed | ✅ `/` (ranking engine) | ✅ `(tabs)/index` | **Parity (2026-08-18):** native `buildFeed` now uses `rankScore` ported from web's `scoreEntry` (recency + event/serie boosts); upcoming still leads. |
| Feed cards (social posts + react) | ✅ (`feed_reactions`) | ✅ (`feed-reactions.ts`) | Both like/save/share. |
| **Auto-Story Engine** | ✅ (BITS, fixed 2026-08-18) | ✅ read+render (2026-08-18) | **Parity on consumption.** Generation stays server-side on the web brain (cron/route writes `team_events`); native reads by `bits_team_id` (`lib/story-events.ts`) and renders `StoryCard`. The "Remember" pillar is now on both. |
| Follow (players/teams) | ✅ `/following` | ✅ `/following` (`follows.ts`) | Both (IG-style counts). |
| Discover / Hitta | ✅ `/discover` | ✅ `(tabs)/discover` | Both. |

## World 4 — Competitions

| Feature | Web | Native | Notes / gap |
|---|:--:|:--:|---|
| Match page | ✅ `/matcher/[id]` | ✅ `/matcher/[id]` | Both. Scorecard/serie sheet — _verify native has it_. |
| Match bordsvy (2v2 delmatch) | ✅ `matcher/[id]/_components/DelmatchBoard` | ✅ `components/DelmatchBoard` | Both (2026-08-25). Shared `computeDelmatcher` in `@bowlkollen/core`. |
| Match "hetaste bordet" (rivalry) | ✅ `matcher/[id]/_components/RivalryCallout` | ✅ `components/RivalryCallout` | Both (2026-08-25). Same `get_match_rivalry` RPC. |
| Player delmatch/career record | ❌ | ✅ `computePlayerDelmatchRecord` | **Native ahead** — profile delmatch section not yet on web (logic is in core, ready to reuse). |
| Schema (season) | ✅ `/schema` | ✅ `(tabs)/schema` | Both. |
| Schema Atlas / map | ✅ `/schema/atlas`, `/atlas/karta` | ❌ | **Web ahead** — no native atlas/map. |
| Division browse + detail | ✅ `/schema` (+ `/divisioner/[id]`) | ✅ schema tab (+ `/division/[id]`) | **Parity** — native's schema tab already browses all divisions (`useDivisions` → `bits_divisions`, grouped by tier, searchable). Web's `/divisioner` redirects to `/schema`. (Matrix corrected 2026-08-19.) |
| Tävlingar (bowlres center comps) | ✅ `/tavlingar` | ✅ `(tabs)/tavlingar` | **Parity (2026-08-19)** — curated list moved to `@bowlkollen/core` (`competitions.ts`); both render it. 5th shared tab. |
| Tipsligan (predictions) | ✅ `/prediktion`, `/puls` | ❌ | **Web-only.** |
| SM-slutspel | ✅ `/sm-slutspel` | ❌ | **Web-only.** |
| Eligibility (spelklarhet) | ✅ (in laguttagning) | ✅ (in laguttagning) | **Parity (2026-08-19).** Shared engine in `@bowlkollen/core` (`eligibility.ts`, SvBF §D306, 13 tests). Web: `lib/eligibility.ts` (same `get_lineup_eligibility` RPC) + per-slot mark + `EligibilityBanner`. Native: CandidateRow/LineupSeating. Needs `lineup_eligibility.sql` RPC live (degrades safely if absent). |
| Calendar (.ics / subscribe) | 🟡 `.ics` export in `/schema` | ✅ `/kalender` (`calendar-subs.ts`) | Different shapes; roughly covered both ways. |

## World 5 — Bowling (the wider sport)

| Feature | Web | Native | Notes / gap |
|---|:--:|:--:|---|
| Clubs | ✅ `/clubs/[bitsId]` (redesigned, BITS-native) | ✅ `/club/[id]` | **Parity (2026-08-19)** — `lib/clubs.ts` + native screen; teams link to `/lag`, reachable from the team page. Web redesigned to the design language (no emoji, tokens, `/lag` links). Legacy `/club/[slug]` (old useColors) still exists — retire it. |
| Halls / venues | ✅ `/hallar`, `/hallar/[id]` | ✅ `/hallar` | **Parity (2026-08-19)** — native `lib/halls.ts` (`bowling_centers`) + screen (map/boka/scoring/specs) + Profil BOWLING entry. |
| Klotshopar | ✅ `/klotshopar` | ✅ `/klotshopar` | **Parity (2026-08-19)** — native `lib/pro-shops.ts` + screen + Profil "BOWLING" entry. |

---

## Foundational / cross-cutting

| Item | Status | Notes |
|---|:--:|---|
| **Theme tokens** | 🟡 in progress | **Shared set DONE (2026-08-18):** `packages/core/src/tokens.ts` = canonical `COLOR`/`TYPE`/`SPACE`/`RADIUS`; web `brand.ts` + native `theme.ts` both re-export it (FONT stays per-app, MOTION web-only). Web + native colour can no longer diverge. **Remaining:** web still has a *second*, older colour system — `@/lib/theme` (`useColors()`, 47 pages) with conflicting values (green `#5dcaa5` vs core `#30d47e`, deprecated blue/pink) + the only light-mode palette. Reconcile it onto core and pick the canonical green → then the 89 static `brand.COLOR` pages can migrate to `useColors()`. |
| **Shared logic in core** | ✅ growing | `packages/core`: `standings`, `tokens`, `eligibility` (SvBF §D306), `team-stats` (`computeTeamStats`/`compareTeamStats`). Pattern: pure + shared logic goes here so web/native can't diverge. |
| **Standards ratchet** | ✅ both apps | web on `prebuild`, native on `pretest` (`scripts/check-standards.mjs` each). Debt-only-down. |
| Auth / session | ✅ both | |
| Onboarding | ✅ both | |

## Biggest gaps right now
1. ~~Auto-Story Engine → native~~ ✅ done (2026-08-18) — read+render ported.
2. ~~Home-feed ranking → native~~ ✅ done (2026-08-18).
3. ~~Web missing eligibility~~ ✅ + ~~in-team join~~ ✅ done (2026-08-19). Unified account model shipped (two-door onboarding both apps; code-vouched verification, licence→pending — `account_verification_hardening.sql` **APPLIED in prod**). See docs/ACCOUNT_MODEL.md.
4. **Native brought up (2026-08-19):** team stats (summary + deep + compare + image share), `clubs`, `klotshopar`, `hallar`, `divisioner` browse. **Remaining native-missing (lower priority):** `Tipsligan`/`prediktion` (bigger prediction game), `SM-slutspel` (seasonal, hardcoded bracket). **Blocked/parked:** `tavlingar` (bowlres partnership), `Atlas map` (parked).
5. **Foundational loose ends:** ✅ (a) ratchet extended to `apps/mobile`; ✅ (c) legacy `/club/[slug]` retired → redirect. **Remaining:** (b) theme — tokens + green already unified in core (the "can't diverge" goal is met); what's left is a LARGE, mostly-mechanical migration of the 89 static `brand.COLOR` pages to `useColors()` for full light-mode reactivity (dark-first works today) — best as its own focused/delegated sweep, not urgent. (d) verify the OG bildkort font (user to eyeball).
