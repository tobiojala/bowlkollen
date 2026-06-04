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
| Match / team helpers | `src/lib/match-ui.ts`, `src/lib/team-ui.ts` |

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

_Last updated: after `compare/teams/[id1]/[id2]` migration. Regenerate counts with:_

```bash
rg -c 'style=\{\{' src/app --glob '**/page.tsx' | sort -t: -k2 -nr
rg -c 'style=\{\{' src/components --glob '*.tsx' | sort -t: -k2 -nr
rg -l "from '@/lib/colors'" src --glob '*.tsx'
```

### Summary

| Metric | Value |
|--------|------:|
| App routes (`page.tsx`) | 31 |
| Routes with Tailwind shell (`min-h-screen bg-light-bg`) | **15** (~48%) |
| Files importing `@/lib/colors` | **16** |
| `style={{}}` in all `src/**/*.tsx` | **~1,370** (55 files; includes dynamic + remotion) |
| `style={{}}` on app `page.tsx` files only | **~980** (unmigrated routes) |

### Phase 0 + 1 — shell (done)

- [x] `cn`, UI kit, glass CSS helpers
- [x] `ThemeProvider`, `layout`, `NavTitle`, `Footer`
- [x] `Nav` / `BottomNav` — layout + glass (minimal inline)

### Phase 2 — shared components

| Component | `style={{}}` | Status |
|-----------|-------------:|--------|
| `home/MatchRow` | 2 | [x] template |
| `home/MiniStandings` | 3 | [x] |
| `home/HonorRoll` | 0 | [x] |
| `home/HeroStrip` | 9 | [x] dynamic |
| `home/MatchPulsen` | 11 | [x] SVG |
| `home/TeamZoneCard` | 8 | [x] dynamic bar |
| `home/*` skeleton, profile, streams | low | [x] |
| `FollowButton` | 1 | [x] |
| `NextMatchPreview` | 0 | [x] |
| `TeamTableWidget` | 2 | [x] |
| `PlayerCard` | 61 | [~] chrome done; card face animation inline |
| `teams/*` (hero, tabs, H2H, …) | low | [x] |
| `matches/*` (header, scorecard, …) | 1 | [x] elite score glow |
| `compare/*` (hero, search, skeleton) | low | [x] picker; full compare pages pending |
| `players/*` (hero, tabs, overview, matchlogg, compare) | low | [x] tier colors dynamic |
| `SeasonTimeline` | 24 | [ ] |
| `TopPerformers` | 9 | [ ] |
| `widgets/Widgets.tsx` | 114 | [ ] |
| `widgets/WidgetGrid` | 26 | [ ] |
| `HeroCarousel` | 33 | [ ] |
| `LiveLaneViewer` | 19 | [ ] |
| `RemotionPlayerEmbed` | 5 | [ ] |

### Phase 3 — app pages

| Page | `style={{}}` on page file | Shell | Notes |
|------|-------------------------:|:-----:|-------|
| `app/page.tsx` | 1 | [x] | Remove stale `lib/colors` import |
| `login` | 0 | [x] | |
| `legal` | 0 | [x] | |
| `mer` | 1 | [x] | |
| `hallar` | 0 | [x] | |
| `league` | 5 | [x] | |
| `oljeprofiler` | 5 | [x] | |
| `klotshopar` | 1 | [x] | |
| `teams/page` | 8 | [x] | |
| `clubs/[bitsId]` | 1 | [x] | |
| `players/page` | 2 | [x] | |
| `teams/[id]` | 0 | [x] | |
| **`matches/[id]`** | **0** | **[x]** | `components/matches/*` |
| **`players/[id]`** | **0** | **[x]** | `components/players/*`; `PlayerCard` drawer still legacy |
| `hallar/[id]` | 27 | [ ] | |
| `club/[club_slug]` | 23 | [ ] | |
| `compare/[id1]/[id2]` | 53 | [ ] | |
| `compare/teams/[id1]` | 0 | [x] | `components/compare/*`, `lib/compare-ui.ts` |
| `compare/teams/[id1]/[id2]` | 83 | [ ] | |
| `profile` | 66 | [ ] | uses `Widgets` |
| `puls` | 65 | [ ] | |
| `schema` | 79 | [ ] | |
| `tavlingar` | 44 | [ ] | |
| `sllm` | 44 | [ ] | |
| `reset-password` | 15 | [ ] | |
| `admin` | 74 | [ ] | |
| `team/[id]/intern` | 69 | [ ] | |
| `team/.../laguttagning/[matchid]` | 99 | [ ] | |
| `team/.../tillganglighet/[matchid]` | 58 | [ ] | |
| `[slug]/page` | 0 | n/a | redirect only |
| `[slug]/intern` | — | [ ] | not audited |

### Suggested order (remaining)

1. [x] `matches/[id]`, [x] `players/[id]`
2. [~] `compare/*` — team compare done; `compare/[id1]/[id2]` (players) remains
3. [ ] `hallar/[id]`, `club/[club_slug]`
4. [ ] `profile`, `puls`, `schema`, `tavlingar`, `sllm`
5. [ ] `admin`, team intern / laguttagning / tillgänglighet
6. [ ] `Widgets.tsx` + embeds on migrated pages

### Do not migrate (yet)

- `remotion/*` — separate animation styling (~32 inline)
- Highly dynamic tier colors — `style={{ color: … }}` or `match-ui` / `team-ui` helpers

---

## Per-file workflow

1. Open the file.
2. Find a repeated chunk (e.g. a match row).
3. Extract to `components/...` if it helps.
4. Replace `style={{}}` with classes; delete `const C = ...` when unused.
5. Run `npm run dev` and click through the page.
6. Commit: `style: migrate matches/[id] to Tailwind`

## Deprecating `lib/colors.ts`

Keep it until no file imports `dark` / `light` for layout. Tier colors in `utils.ts` (`divTierColor`) can stay forever.

## When you are stuck

1. Inspect: `components/matches/MatchHeader.tsx`, `components/teams/TeamHero.tsx`, `components/ui/Card.tsx`.
2. Check tokens in `globals.css` under `@theme`.
3. Use [Tailwind docs](https://tailwindcss.com/docs).
