# Tailwind migration guide (Bowlkollen)

You do **not** need to rewrite the whole app at once. Tailwind v4 is already installed. This guide is the order to convert files, written for incremental “vibe coding” workflows.

## The one rule

> **New UI → Tailwind. Old inline `style={{}}` → convert when you touch that file.**

Never try to convert a large page in a single sitting. Extract one section per commit.

## What is already set up

| Piece | Location |
|--------|----------|
| Tailwind v4 | `package.json` |
| Design tokens (colors, max width) | `src/app/globals.css` → `@theme` |
| Dark mode | `data-theme="dark"` on `<html>` + `dark:` classes |
| Layout spacing | `.main-content`, `.mobile-page-title` in `globals.css` |
| UI building blocks | `src/components/ui/*` |
| Class name helper | `src/lib/cn.ts` |
| Match / team / card / home helpers | `match-ui.ts`, `home-ui.ts`, `team-ui.ts`, `league-ui.ts`, `oljeprofiler-ui.ts`, `layout-ui.ts`, … |
| Profile widgets | `src/lib/widget-ui.ts` |
| Schedule page | `src/lib/schema-ui.ts`, `SchemaTavCard` |

## Copy-paste patterns

### Page background (no `useTheme` + `C.bg` needed)

```tsx
<main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
```

### Card

```tsx
import { Card } from '@/components/ui'

<Card className="p-4">...</Card>
```

### Section title (gold dot + label)

```tsx
import { SectionHeader } from '@/components/ui'

<SectionHeader label="LIGATABELL" sub="Elitserien" />
```

### Button

```tsx
import { Button } from '@/components/ui'

<Button variant="primary" onClick={...}>Spara</Button>
<Button variant="ghost">Avbryt</Button>
```

### Combine classes

```tsx
import { cn } from '@/lib/cn'

<div className={cn('flex gap-3', isActive && 'text-gold')}>
```

### Old inline → Tailwind cheat sheet

| Inline habit | Tailwind |
|--------------|----------|
| `padding: '12px 16px'` | `px-4 py-3` |
| `borderRadius: 14` | `rounded-[14px]` |
| `fontSize: 10, fontWeight: 800, letterSpacing: 1.5` | `text-[10px] font-extrabold tracking-widest` |
| `color: C.accent` | `text-gold` |
| `color: C.textMuted` | `text-dark-muted` |
| `background: C.card` | `bg-light-card dark:bg-dark-card` |
| `border: '1px solid ' + C.border` | `border border-light-border dark:border-dark-border` |
| `maxWidth: 600, margin: '0 auto'` | `mx-auto max-w-app` |

Keep **inline `style` only** for truly dynamic values (e.g. division color from data, HSL from team name, elite score glow).

---

## Migration checklist (tracked)

_Last updated: app migration complete — only `remotion/PlayerShareCard` keeps literal `style={{`. Regenerate counts with:_

```bash
rg -c 'style=\{\{' src/app --glob '**/page.tsx' | sort -t: -k2 -nr
rg -c 'style=\{\{' src/components --glob '*.tsx' | sort -t: -k2 -nr
rg -l "from '@/lib/colors'" src --glob '*.tsx'
```

### Summary

| Metric | Value |
|--------|------:|
| App routes (`page.tsx`) | 31 |
| Routes with Tailwind shell (`min-h-screen bg-light-bg`) | **27** (~87%) |
| Files importing `@/lib/colors` | **0** (`lib/colors.ts` removed) |
| `style={{}}` in all `src/**/*.tsx` | **32** (all in `remotion/PlayerShareCard`) |
| `style={{}}` outside remotion | **0** |
| `style={{}}` on app `page.tsx` files only | **0** (list pages use `*-ui.ts` helpers) |

### Phase 0 + 1 — shell (done)

- [x] `cn`, UI kit, glass CSS helpers
- [x] `ThemeProvider`, `layout`, `NavTitle`, `Footer`
- [x] `Nav` / `BottomNav` — layout + glass; search HSL via `team-ui.ts`

### Phase 2 — shared components

| Component | `style={{}}` | Status |
|-----------|-------------:|--------|
| `home/MatchRow` | 0 | [x] | `home-ui.ts` day dot + tap highlight |
| `home/MiniStandings` | 0 | [x] | `home-ui.ts` zone helpers |
| `home/HonorRoll` | 0 | [x] |
| `home/HeroStrip` | 1 | [x] | `home-ui.ts`; division color dynamic |
| `home/MatchPulsen` | 7 | [x] | `home-ui.ts`; gauge SVG + tension colors dynamic |
| `home/TeamZoneCard` | 0 | [x] | `home-ui.ts` zone helpers; dynamic via `style={fn()}` |
| `home/*` skeleton, profile, streams | low | [x] |
| `FollowButton` | 0 | [x] | `homeNoTapHighlight` |
| `ui/FilterChip` | 0 | [x] | `homeNoTapHighlight` |
| `NextMatchPreview` | 0 | [x] |
| `TeamTableWidget` | 0 | [x] | zone color via `home-ui.ts` |
| `PlayerCard` | 23 | [x] | `player-card-ui.ts`; holo/tilt/tier gradients stay inline |
| `teams/*` (hero, match row, tabs, …) | low | [x] | hero/match row via `team-ui.ts`; tabs still 1-liners |
| `matches/*` (header, scorecard, …) | 0 | [x] | `match-ui.ts` division helpers |
| `compare/*` heroes + results | 0 | [x] | `compare-ui.ts`; HSL/gradients via style helpers |
| `players/PlayerHero` | 0 | [x] | `player-ui.ts` tier/avatar style helpers |
| `players/*` (tabs, overview, …) | low | [x] |
| `SeasonTimeline` | 0 | [x] | `teamAvatarStyle` for opponent badges |
| `TopPerformers` | 0 | [x] | `teamAvatarStyle` |
| `tavlingar/TavlingCard` | 0 | [x] | `tavlingar-ui.ts` |
| `sllm/SLLMHero` + player list | 0 | [x] | `sllm-ui.ts` |
| `club/*` | 0 | [x] | `club-ui.ts` avatar/badge helpers |
| `profile/*` claim cards | 0 | [x] | `teamAvatarStyle` |
| `widgets/Widgets.tsx` | 1 | [x] | `widget-ui.ts`; progress width dynamic |
| `widgets/WidgetGrid` | 0 | [x] | no `lib/colors` |
| `HeroCarousel` | 0 | [x] | `homeHeroSlideBgStyle`; progress in `globals.css` |
| `LiveLaneViewer` | 0 | [x] | used on live match pages |
| `team/TeamLaguttagningPageContent` | 8 | [x] | `team-laguttagning-ui.ts`; tier card gradients dynamic |
| `team/TeamTillganglighetPageContent` | 3 | [x] | `team-tillganglighet-ui.ts`; HSL avatars + poll bar widths |
| `RemotionPlayerEmbed` | 0 | [x] | Tailwind shell; `remotion/PlayerShareCard` stays inline |

### Phase 3 — app pages

| Page | `style={{}}` on page file | Shell | Notes |
|------|-------------------------:|:-----:|-------|
| `app/page.tsx` | 0 | [x] | |
| `login` | 0 | [x] | |
| `legal` | 0 | [x] | |
| `mer` | 0 | [x] | `homeStaggerDelayStyle` |
| `hallar` | 0 | [x] | |
| `league` | 0 | [x] | `league-ui.ts` zone row helpers |
| `oljeprofiler` | 0 | [x] | `oljeprofiler-ui.ts` |
| `klotshopar` | 1 | [x] | |
| `teams/page` | 0 | [x] | `divisionBadgeStyle` in `team-ui.ts` |
| `clubs/[bitsId]` | 0 | [x] | `divisionFillChipStyle` |
| `players/page` | 0 | [x] | `teamAvatarStyle` |
| `teams/[id]` | 0 | [x] | |
| **`matches/[id]`** | **0** | **[x]** | `components/matches/*` |
| **`players/[id]`** | **0** | **[x]** | `components/players/*`; `PlayerCard` drawer still legacy |
| `hallar/[id]` | 0 | [x] | `components/hallar/*`, `lib/hall-ui.ts` |
| `club/[club_slug]` | 0 | [x] | `components/club/*`, `lib/club-ui.ts` |
| `compare/[id1]/[id2]` | 0 | [x] | `PlayerCompareHero`, `PlayerCompareResults` |
| `compare/teams/[id1]` | 0 | [x] | `components/compare/*`, `lib/compare-ui.ts` |
| `compare/teams/[id1]/[id2]` | 0 | [x] | `TeamCompareResults`, extended hero |
| `profile` | 0 | [x] | `components/profile/*`; `WidgetGrid` + widgets migrated |
| `puls` | 0 | [x] | `PulsPageContent`, `lib/puls-ui.ts`; card gradients/stream colors dynamic |
| `schema` | 0 | [x] | `SchemaPageContent`, `SchemaTavCard`, `lib/schema-ui.ts` |
| `tavlingar` | 0 | [x] | `TavlingCard`, `tavlingar-ui.ts` |
| `sllm` | 0 | [x] | `components/sllm/*`, `sllm-ui.ts` |
| `reset-password` | 0 | [x] | matches `login` patterns |
| `admin` | 0 | [x] | `AdminPageContent` fully Tailwind; `lib/admin-ui.ts` |
| `team/[id]/intern` | 0 | [x] | `TeamInternPageContent` + `team-intern-ui.ts` |
| `team/.../laguttagning/[matchid]` | 0 | [x] | `TeamLaguttagningPageContent` (~8 inline tier/HSL) |
| `team/.../tillganglighet/[matchid]` | 0 | [x] | `TeamTillganglighetPageContent` (~3 inline HSL/width) |
| `[slug]/page` | 0 | n/a | redirect only |
| `[slug]/intern` | 0 | n/a | redirect → `/team/[id]/intern` |

### Suggested order (remaining)

1. [x] `matches/[id]`, [x] `players/[id]`
2. [x] `compare/*` — all compare routes migrated
3. [x] `club/[club_slug]`
4. [x] `puls`, `schema`, `admin`, team intern / laguttagning / tillgänglighet
5. [ ] Chip list pages: `teams/page`, `league`, `oljeprofiler` (dynamic colors OK inline)
6. [x] `Widgets.tsx` + `WidgetGrid` on profile
7. [x] `SeasonTimeline`, `TopPerformers`
8. [x] `HeroCarousel`, `LiveLaneViewer`
9. [x] `TeamInternPageContent`
10. [x] `TeamLaguttagningPageContent` / `TeamTillganglighetPageContent`
11. [x] Delete unused `lib/colors.ts`
12. [x] Chip list pages (`teams/page`, `league`, `oljeprofiler`) — shells + Tailwind; division/zone colors inline only
13. [x] `PlayerCard` — drawer chrome + card layout in Tailwind; holo/3D/tier dynamic inline
14. [x] `[slug]/intern` — redirect only
15. [x] `RemotionPlayerEmbed` shell
16. [ ] `remotion/PlayerShareCard` (~32 inline) — video composition; keep inline for Remotion
17. [x] `TeamZoneCard`, `PlayerHero`, compare heroes/results, `StreamPills`, `MyNextMatchCard`
18. [x] Nav, home list rows, tavlingar/sllm, team/club/match chrome, profile claim avatars
19. [x] Player/team tabs, list pages, HeroCarousel, SeasonTimeline, skeletons, widgets progress
20. [ ] `MatchPulsen`, `puls`/`schema` page internals, team laguttagning/tillgänglighet tier cards, `PlayerCard`

### Do not migrate (yet)

- `remotion/*` — separate animation styling (~32 inline)
- **Live scoring** (`LiveLaneViewer`, match stream embeds) — leave as-is unless explicitly requested
- Highly dynamic tier colors — `style={{ color: … }}` or `match-ui` / `team-ui` helpers

---

## Per-file workflow

1. Open the file.
2. Find a repeated chunk (e.g. a match row).
3. Extract to `components/...` if it helps.
4. Replace `style={{}}` with classes; delete `const C = ...` when unused.
5. Run `npm run dev` and click through the page.
6. Commit: `style: migrate matches/[id] to Tailwind`

## `lib/colors.ts`

Removed — no remaining imports. Tier colors in `utils.ts` (`divTierColor`) and per-page HSL helpers remain for dynamic data.

## When you are stuck

1. Inspect: `components/matches/MatchHeader.tsx`, `components/teams/TeamHero.tsx`, `components/ui/Card.tsx`.
2. Check tokens in `globals.css` under `@theme`.
3. Use [Tailwind docs](https://tailwindcss.com/docs).
