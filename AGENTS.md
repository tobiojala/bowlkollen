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

## Legibility — built for older eyes (senior-first, WCAG AA minimum)
Many of our bowlers are seniors. If a 70-year-old can't read a label or spot an icon, the feature does not exist for them. This is a hard requirement, not a nice-to-have — hold every screen to it.

- **Text size floor.** Body text ≥ **16px**; any text a user must read ≥ **13px** (absolute floor). `TYPE.label`/`TYPE.micro` are for **non-essential decoration only** (a faint uppercase section tag) — never for a value, name, date, count, or anything that carries meaning.
- **Contrast.** Readable text uses **`ink` or `ink2` only** — both clear WCAG AA (4.5:1) on our dark bg. **`ink3` is the floor for genuinely secondary text and nothing fainter should carry words.** **`ink4` never carries readable content** — it is for hairlines, disabled states, and decorative chevrons only. Aim for AAA (7:1) on primary content where you can.
- **Icons must be legible too.** Interactive icons ≥ **22px**, drawn in `ink2` or stronger (never `ink3`/`ink4` for an icon a user needs to find/tap). Active/selected → `gold`. Don't ship an icon-only control that a weak-sighted user can't identify — pair it with a label or an `accessibilityLabel`.
- **Never encode meaning in colour alone.** A win/loss, up/down, live/finished must also differ by text or shape (e.g. form dots carry `V`/`F`/`O`, not just green/red) — many seniors have reduced colour discrimination.
- **Respect Dynamic Type.** Never set `allowFontScaling={false}`. Layouts must survive the OS text-size setting being turned up — use wrapping/`numberOfLines`, not fixed heights that clip enlarged text.
- **Touch targets ≥ 44×44pt** (already the interaction floor) — bigger is friendlier for less steady hands.

Fix these at the **token** level (`theme.ts` / `brand.ts`) so every screen improves at once, not per-screen.

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

## Security rules
The client is untrusted — a mobile app's bundle can be inspected, its requests replayed, its state faked. Every read, write, and privileged action must be authorized at the database or server boundary, never by what the UI shows or hides.

1. Never place service-role keys, provider secrets, or admin credentials in client code — client-visible code only ever gets the publishable/anon key.
2. Every new Supabase table gets RLS enabled with policies scoped to the actual owner/relationship (`auth.uid() = user_id`, not a blanket `auth.uid() is not null`) — see `team_claims`/`team_match_availability` for the pattern.
3. UI visibility is not authorization. A hidden button is a UX nicety; the RPC/policy behind it is the real gate — always re-check role/status server-side inside the function body (see `save_team_lineup`'s captain check for the pattern), never trust a client-passed flag like `isCaptain`/`isPro`.
4. Privileged actions (role changes, invite-code creation, claim approval, admin actions) execute through `SECURITY DEFINER` functions that independently verify the caller's identity and standing — never accept a client-supplied value as proof of permission.
5. Never grant identity or elevated role (e.g. captain) from a license/ID number alone — it's a findable, not-secret identifier. Pair it with vouching (an invite code from an already-verified party) or admin review. See `project_claim_identity_hardening` memory for the incident this rule comes from.
6. Don't create generic URL-proxy endpoints (`fetch(searchParams.get('url'))` with no allowlist) — that's SSRF. If a proxy is genuinely needed, allowlist the exact host(s) and reject everything else.
7. Native app sessions (when that exists) go in Expo `SecureStore`, never `AsyncStorage` — SecureStore uses Keychain/encrypted Android storage, AsyncStorage does not.
8. Personal/private content (notes, team communication, availability responses) is private by default — never assume that because official match data is public, everything attached to a player is too.

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

## Parity — web must match native (check before building)
Before building or moving a feature, consult **`PARITY.md`** (the web↔native
matrix) and update the affected cell in the same change. Standing rule: **web
must have FULL parity with native** — every native feature is doable on web too,
laid out for the wider screen. Web is never a subset. Theme colour is being
unified in `packages/core` so the two apps can't diverge (see PARITY.md
foundational row).

## Enforcement — these rules are machine-checked, not aspirational
`apps/web` runs a **standards ratchet** (`scripts/check-standards.mjs`) on every
`npm run build` (via `prebuild`). It fails the build if a change *adds* a
violation of: no `any`, no removed-blue palette, no `<img>`, no `<a href>` for
internal routes, or a file over 300 lines. Existing debt is grandfathered in
`scripts/standards-baseline.json` — **debt may only go down**. Run it yourself
with `npm run check:standards`. If you legitimately lowered debt, tighten the
baseline with `npm run check:standards -- --update-baseline` (never bump it up to
dodge a rule). This exists because standards drifted across fresh sessions — the
ratchet is what makes them stick.

## Quick checklist before finishing any task
- [ ] `npm run check:standards` green (the ratchet — see Enforcement above)
- [ ] No new `any` types — used `src/lib/types.ts`
- [ ] No magic numbers — used `src/lib/constants.ts`
- [ ] `useColors()` not manual theme switch
- [ ] Senior-legible: readable text ≥13px on `ink`/`ink2`/`ink3` (never `ink4`), icons ≥22px & not fainter than `ink2`, meaning never colour-only, no `allowFontScaling={false}`
- [ ] `next/image` not `<img>`
- [ ] `next/link` not `<a href>` for internal routes
- [ ] `useSession()` not `getSession()`
- [ ] New page: Server Component shell + `_components/` split
- [ ] New lib function: test added to `src/__tests__/`
- [ ] File under 300 lines
- [ ] `npm run build` passes
- [ ] `npm run test` green
