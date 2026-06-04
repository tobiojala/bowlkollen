# Tailwind migration guide (Bowlkollen)

You do **not** need to rewrite the whole app at once. Tailwind v4 is already installed. This guide is the order to convert files, written for incremental “vibe coding” workflows.

## The one rule

> **New UI → Tailwind. Old inline `style={{}}` → convert when you touch that file.**

Never try to convert `app/page.tsx` in a single sitting (~1,700 lines). Do one section per PR.

## What is already set up

| Piece | Location |
|--------|----------|
| Tailwind v4 | `package.json` |
| Design tokens (colors, max width) | `src/app/globals.css` → `@theme` |
| Dark mode | `data-theme="dark"` on `<html>` + `dark:` classes |
| Layout spacing | `.main-content`, `.mobile-page-title` in `globals.css` |
| UI building blocks | `src/components/ui/*` |
| Class name helper | `src/lib/cn.ts` |

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

Keep **inline `style` only** for truly dynamic values (e.g. division color from data, HSL from team name).

## Migration order

### Done (Phase 0 + 1)

- [x] `cn`, UI kit, glass CSS helpers
- [x] `ThemeProvider`, `layout`, `NavTitle`, `Footer`
- [x] `Nav` / `BottomNav` — layout + glass via shared classes (some effects stay in CSS)

### Next (Phase 2 — shared components)

- [x] `components/home/MatchRow` — **use this as your template**
- [ ] `MiniStandings`, `HonorRoll`
- [ ] `FollowButton`, `NextMatchPreview`, `MatchDayStrip`
- [ ] `PlayerCard`, `TeamTableWidget`

### Then (Phase 3 — pages, small → large)

1. [x] `login`, `legal`
2. [x] `mer`
3. [ ] `league`, [x] `hallar`, `oljeprofiler`, [x] `klotshopar`
4. [ ] `teams/page`, `clubs/[bitsId]`
5. [ ] `matches/[id]`, `players/[id]`, `teams/[id]`
6. [ ] `app/page.tsx` — **one block at a time** (honor roll, match list, standings, …)

## Per-file workflow

1. Open the file.
2. Find a repeated chunk (e.g. a match row).
3. Extract to `components/...` if it helps.
4. Replace `style={{}}` with classes; delete `const C = ...` when unused.
5. Run `npm run dev` and click through the page.
6. Commit: `style: migrate login page to Tailwind`

## Do not migrate (yet)

- `remotion/*` — separate animation styling
- Highly dynamic tier colors — keep `style={{ color: divTierColor(d) }}` or move to a small map in `utils.ts`

## When you are stuck

1. Inspect an already-migrated file: `NavTitle.tsx`, `Footer.tsx`, `components/ui/Card.tsx`.
2. Check tokens in `globals.css` under `@theme`.
3. Use [Tailwind docs](https://tailwindcss.com/docs) — search “flex”, “padding”, “dark variant”.

## Deprecating `lib/colors.ts`

Keep it until no file imports `dark` / `light` for layout. Tier colors in `utils.ts` (`divTierColor`) can stay forever.
