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
| Compare (teams) | ✅ `/compare/teams/…` | ❌ | **Web ahead** — native has no team compare. |

## World 2 — My Team

| Feature | Web | Native | Notes / gap |
|---|:--:|:--:|---|
| Team profile | ✅ `/lag/[id]` | ✅ `/lag/[id]` | Both (BITS canonical). |
| Roster / laget | ✅ (in `/lag/[id]`) | ✅ `/lag/[id]/laget` | Both. |
| Team schedule | ✅ (`/lag/[id]`, `/schema`) | ✅ `/lag/[id]/schema` | Both. |
| Lineup builder (laguttagning) | ✅ `/lag/[id]/laguttagning/[mid]` | ✅ `/lag/[id]/laguttagning/[mid]` | Both. Suggestion tool + hierarchy + konstellationer now on **both** (native-first `konstellationer.ts`; web caught up this session). |
| Availability (tillgänglighet) | ✅ `/lag/[id]/tillganglighet/[mid]` | ✅ (`team-admin.ts`) | Both. |
| Anslagstavla (nyheter) | ✅ `/lag/[id]/nyheter` | ✅ `/lag/[id]/nyheter` (`team-posts.ts`) | Both. |
| In-team invite redeem (gå med) | 🟡 (signup gate `/invite/[code]`) | ✅ `/lag/[id]/ga-med` (`invites.ts`) | **Native ahead** — web has invite-gating at signup, but no in-team "join this team via code". Gap: web. |
| Admin (claims/players/bits) | ✅ `/admin/*` | ➖ | Web-only console by design. |

## World 3 — My People (follow / feed)

| Feature | Web | Native | Notes / gap |
|---|:--:|:--:|---|
| Home feed | ✅ `/` (ranking engine) | 🟡 `(tabs)/index` (`feed.ts`) | **Web ahead**: `scoreEntry` ranking (recency + event boosts + tier + affinity) vs native date-only `buildFeed`. Native = adopt ranking. |
| Feed cards (social posts + react) | ✅ (`feed_reactions`) | ✅ (`feed-reactions.ts`) | Both like/save/share. |
| **Auto-Story Engine** | ✅ (BITS, fixed 2026-08-18) | ❌ | **Web-only.** The narrative "Remember" pillar. Native has no story events. Big gap. |
| Follow (players/teams) | ✅ `/following` | ✅ `/following` (`follows.ts`) | Both (IG-style counts). |
| Discover / Hitta | ✅ `/discover` | ✅ `(tabs)/discover` | Both. |

## World 4 — Competitions

| Feature | Web | Native | Notes / gap |
|---|:--:|:--:|---|
| Match page | ✅ `/matcher/[id]` | ✅ `/matcher/[id]` | Both. Scorecard/serie sheet — _verify native has it_. |
| Schema (season) | ✅ `/schema` | ✅ `(tabs)/schema` | Both. |
| Schema Atlas / map | ✅ `/schema/atlas`, `/atlas/karta` | ❌ | **Web ahead** — no native atlas/map. |
| Division browse + detail | ✅ `/divisioner`, `/divisioner/[id]` | 🟡 `/division/[id]` | **Web ahead** — native has detail but no browse-all index. |
| Tävlingar (bowlres center comps) | ✅ `/tavlingar` | ❌ | **Web-only.** |
| Tipsligan (predictions) | ✅ `/prediktion`, `/puls` | ❌ | **Web-only.** |
| SM-slutspel | ✅ `/sm-slutspel` | ❌ | **Web-only.** |
| Eligibility (spelklarhet) | 🟡 _?_ | ✅ (`eligibility.ts`) | **Native ahead** (hard-block parked). Gap: web eligibility surface. |
| Calendar (.ics / subscribe) | 🟡 `.ics` export in `/schema` | ✅ `/kalender` (`calendar-subs.ts`) | Different shapes; roughly covered both ways. |

## World 5 — Bowling (the wider sport)

| Feature | Web | Native | Notes / gap |
|---|:--:|:--:|---|
| Clubs | ✅ `/clubs/[bitsId]`, `/club/[slug]` | ❌ | **Web-only.** |
| Halls / venues | ✅ `/hallar`, `/hallar/[id]` | ❌ | **Web-only.** |
| Klotshopar | ✅ `/klotshopar` | ❌ | **Web-only.** |

---

## Foundational / cross-cutting

| Item | Status | Notes |
|---|:--:|---|
| **Theme tokens** | 🟡 in progress | **Shared set DONE (2026-08-18):** `packages/core/src/tokens.ts` = canonical `COLOR`/`TYPE`/`SPACE`/`RADIUS`; web `brand.ts` + native `theme.ts` both re-export it (FONT stays per-app, MOTION web-only). Web + native colour can no longer diverge. **Remaining:** web still has a *second*, older colour system — `@/lib/theme` (`useColors()`, 47 pages) with conflicting values (green `#5dcaa5` vs core `#30d47e`, deprecated blue/pink) + the only light-mode palette. Reconcile it onto core and pick the canonical green → then the 89 static `brand.COLOR` pages can migrate to `useColors()`. |
| **Standards ratchet** | ✅ web | `apps/web/scripts/check-standards.mjs` on `prebuild`. Extend to `apps/mobile` next. |
| Auth / session | ✅ both | |
| Onboarding | ✅ both | |

## Biggest gaps right now
1. **Auto-Story Engine → native** (World 3) — the Remember pillar exists only on web.
2. **Home-feed ranking → native** (World 3) — native still date-only.
3. **Web missing: in-team invite redeem + eligibility** (Worlds 2/4) — the two places native leads, which the parity rule says web must cover.
4. **Foundational: shared theme tokens in core** — unblocks non-divergent design for both apps.
