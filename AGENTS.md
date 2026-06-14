<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 — key differences from training data

- **App Router only** — use `app/` conventions (Server Components, layouts, `loading.tsx`, etc.)
- **Slow navigations**: `<Suspense>` alone is not enough — also export `unstable_instant` from the route. Read `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.mdx` before touching navigation performance.
- **Unknown API?** Check `node_modules/next/dist/docs/` before guessing — this version has breaking changes from older Next.js.
<!-- END:nextjs-agent-rules -->

---

# Engineering standards — follow these on every change

## Types — no `any`, ever
- All domain types live in `src/lib/types.ts`. Import from there.
- New DB shape? Add it to `types.ts` first, then use it.
- If TypeScript infers `any` from a Supabase call, cast with `as YourType` or `as unknown as YourType`. Never leave `any` in new code.

## Constants — no magic numbers
- Score thresholds, season dates, query limits, stale times → `src/lib/constants.ts`.
- Division names and colors → `src/lib/divisions.ts`.
- If you're typing a raw number that has a domain meaning, it belongs in constants.

## Theme — one line, always
```ts
const { C, isDark } = useColors()   // from @/components/ThemeProvider
```
Never write `const C = theme === 'dark' ? dark : light` or import from `@/lib/colors`.

### Color system — gold down, no blue
The palette is near-black tonal with **one** brand accent. Colour carries meaning; it is never decoration.
- **Ink** (`INK`/`INK2`/`INK3`/`INK4`, i.e. `C.text` → `C.textMuted`) — the default for everything: scores, names, labels, counts, countdowns, "kommande", history, comparison. Most of the UI is ink.
- **Gold** `#f5c200` (`C.accent`) — the single brand accent, kept on a tight budget. Only: the active state, a live/now focal point, or a genuine milestone (PB, 300, championship). If two golds are fighting for attention, one of them is wrong.
- **Green/teal** `#5dcaa5` (`C.green`) — **positive only**: upward deltas, growth/improvement, gains in a table (points ahead, +pins, rising form, a win as a positive outcome).
- **Red** `#e05555` (`C.red`) — negative: downward deltas, losses, relegation, danger.
- **Blue — removed.** Do not use `C.blue`/`C.blueMuted` or `#7ab4e8`/`#5a82b4` in new code. Replace info/upcoming/comparison blue with ink; replace "good outcome" blue with green. (`C.blue` stays defined only so the un-migrated long tail compiles.)
- **Division colours** (`divisions.ts`) are a separate categorical identity system, not part of this semantic palette.

## New pages — Server Component + HydrationBoundary
Every new dynamic route (`/things/[id]`) must follow this pattern:

```
app/things/[id]/
├── page.tsx              ← async Server Component, prefetches data
└── _components/
    └── ThingsClient.tsx  ← 'use client', receives id as prop
```

`page.tsx` uses `createPublicSupabase()` for public data (no cookies → supports ISR).
Client component uses React Query hooks — data arrives pre-hydrated.

## Supabase — right client for the right context
| Context | Client | Why |
|---|---|---|
| Server Component (public data) | `createPublicSupabase()` | Cookie-free, ISR-compatible |
| Server Component (auth-aware) | `createServerSupabase()` | Reads session from cookies |
| Client Component | `createClient()` | Browser client |

Never call `createClient()` in an async Server Component — it accesses browser APIs (`window`, `localStorage`) server-side.

## Images — always `next/image`
```tsx
import Image from 'next/image'
<Image src={url} alt={name} width={68} height={68} />   // known size
<Image src={url} alt={name} fill style={{ objectFit: 'cover' }} />  // fill parent
```
Never `<img>`. Parent must have `position: relative` when using `fill`.

## Internal links — always `next/link`
```tsx
import Link from 'next/link'
<Link href="/teams/123">...</Link>
```
Never `<a href="...">` for routes within the app.

## Session — always `useSession()` hook
```ts
const { data: session } = useSession()   // from @/lib/queries
```
Never call `supabase.auth.getSession()` directly in a component.

## File size — 300 lines max
If a page or component is approaching 300 lines, extract into `_components/` before adding more. One responsibility per file.

## Tests — new utility = new test
Pure functions in `src/lib/` get a test in `src/__tests__/`. Run `npm run test` before marking done.
E2E flows go in `e2e/`. Run `npm run test:e2e` against a running server.

## Stale times — use constants
```ts
import { STALE } from '@/lib/constants'
staleTime: STALE.LIVE      // 20s  — match scores
staleTime: STALE.SHORT     // 30s  — home feed
staleTime: STALE.DEFAULT   // 60s  — most lists
staleTime: STALE.MEDIUM    // 5m   — standings, session
staleTime: STALE.LONG      // 10m  — slow-moving data
```

## Quick checklist before finishing any task
- [ ] No new `any` types — used `src/lib/types.ts`
- [ ] No magic numbers — used `src/lib/constants.ts`
- [ ] `useColors()` not manual theme switch
- [ ] `next/image` not `<img>`
- [ ] `next/link` not `<a href>` for internal routes
- [ ] `useSession()` not `getSession()`
- [ ] New page: Server Component shell + `_components/` split
- [ ] New lib function: test added to `src/__tests__/`
- [ ] File under 300 lines
- [ ] `npm run build` passes
- [ ] `npm run test` green
