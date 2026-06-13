# Redesign rollout plan

The design system is finished and proven on `/mockup`. This is the order of
operations for rolling it out to the rest of the app — **route by route, never
big-bang**. Old pages already inherit the new tokens (palette, font), so they
coexist with redesigned pages without looking broken. There is no deadline
pressure; ship one route at a time.

## What is already done

- Design tokens (near-black tonal palette, type scale, gold budget) — global
- Primitives: `src/components/ui/primitives.tsx`
- Patterns proven on `/mockup`: hero deck, action row, sheets, feed rows,
  stat cards, DNA, narrative sections
- BK Rating: spec + engine + tests (`BK_RATING_SPEC.md`, `src/lib/bk-rating.ts`)

## The five templates (25 routes collapse into these)

| Template | Routes | Status |
|---|---|---|
| Entity profile | /players/[id], /teams/[id], /club/*, /hallar/[id] | ✅ designed (= mockup) |
| Feed | / (home), /puls | patterns exist (FeedSection) |
| Match detail | /matches/[id] | needs design pass (reuse sheet patterns) |
| Table | /league, /schema | needs one design pass |
| Utility | /login, /profile, /mer, /admin, /legal, team-intern pages | **never redesign** — tokens only |

## Rollout order (one focused session each)

### Phase 1 — the surfaces users live on
1. **Home feed** (`/`) — biggest traffic. Reuse: HeroNumber (next match
   countdown as hero), FeedSection row pattern, MatchRow restyle.
   NextMatchCard already done.
2. **Player profile** (`/players/[id]`) — port the mockup to real data.
   The mockup components move almost as-is; swap mock data for the
   existing React Query hooks.
3. **Match detail** (`/matches/[id]`) — score hero, serie tabs as pills,
   tonal surfaces, kill the cyan glow. LiveLaneViewer keeps its layout.

### Phase 2 — the rest of the core loop
4. **Team profile** (`/teams/[id]`) — entity template again (faster the
   second time).
5. **Puls** (`/puls`) — becomes the insights/story feed (FeedSection rows
   + narrative engine).
6. **League table** (`/league`) — table template: one design pass.

### Phase 3 — long tail (cheap)
7. Lists: /tavlingar, /hallar, /klotshopar, /oljeprofiler — shared list
   template, one session for all.
8. Compare pages — reuse duell patterns from the mockup.
9. Utility pages — verify token inheritance, fix any hardcoded colors, stop.

### Explicitly out of scope
- PlayerCard holo card → lives on as a share artifact (Remotion), not an
  app surface
- Landing page — separate marketing track, recently reworked
- Light mode — dark-first until Phase 3 is done

## Rules during rollout (from AGENTS.md + design system)

- Elevation = tonal step (bg → surface → surface-2), never borders
- One hero number per screen; gold budget: 250+ scores, live dot, one
  achievement moment
- Nothing under 11px; scores tabular; lucide icons only
- Every new page: Server Component shell + `_components/` split
- 44px tap targets; `npm run test` green before done

## Definition of done per route

1. Uses primitives/tokens — no hardcoded colors outside tokens
2. No duplicated facts (one fact, one home)
3. Checked on a phone over LAN before merging
