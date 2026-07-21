# Native App + Store Launch Plan

> Created 2026-07-21. The execution plan for taking Bowlkollen to App Store + Google Play.
> Companion to `PRODUCT_DIRECTION_RESET_2026.md` (which decided *native*) and
> `MONETIZATION.md` (launch **free**, PRO walls flip later). Read those first.

## The decision (locked)

Native app via **Expo + React Native**, keeping the Next.js "brain."
This is **not a rewrite** — it's putting a native front door on the intelligence
already built. Revolut and Phantom are React Native apps; this is the same path.

- **Sequencing choice:** build the **full core loop first** (Home → Lag → Match →
  Player → Profile), *then* submit. First submission is not a thin slice.
- **Launch pricing:** FREE, both Player and Team (per `MONETIZATION.md`). No
  billing code at launch — PRO features stay behind `requiresPro` flags.

## What's portable vs. what's rewritten

The months of real work (data, logic, product knowledge) carry over. Only the skin is new.

| Moves to native **unchanged** | Gets **rewritten** (UI only) |
|---|---|
| `src/lib/types.ts`, `constants.ts` | Every `.tsx` page/component (HTML/CSS → `View`/`Text`/`StyleSheet`) |
| `queries.ts` — React Query is identical in RN | `next/image` → `expo-image`; `next/link` → Expo Router `Link` |
| `supabase.ts` — supabase-js runs in RN | `framer-motion` → `react-native-reanimated` |
| Pure logic: `lineup.ts`, `division-standings.ts`, `team-narrative.ts`, `calendar.ts`, `csv.ts` | App Router routes → Expo Router (file-based — near 1:1 mental model) |
| `brand.ts` tokens — already plain JS, 100% portable | `useColors()`/theme re-plumbed onto RN |

## Repo structure (pnpm + Turborepo monorepo)

```
bowlkollen/
  apps/web      ← existing Next.js app — STAYS (SEO, public profiles, /admin, marketing)
  apps/mobile   ← new Expo app — the primary product, App Store + Play
  packages/core ← shared TS: types, supabase clients, queries, pure lib, brand tokens
```

The web app does not die — the direction doc keeps it for public/SEO/admin/marketing.
It just stops being the *primary* surface.

## New tools

**Accounts (start immediately — lead time gates everything):**
- Apple Developer Program — $99/yr, ~1–2 days to approve (individual is faster than org).
- Google Play Console — $25 one-time; new accounts face a testing-cohort requirement before production.
- EAS (Expo Application Services) — cloud build + submit. No Mac build farm needed.

**Dev stack (standard Expo):**
- Expo SDK + **Expo Router** (file-based, mirrors App Router)
- `expo-image`, `expo-secure-store` (auth session — already in AGENTS.md security rules), `expo-notifications` (push)
- `react-native-reanimated` + `react-native-gesture-handler` (native motion / the "feel")
- **Unchanged from current deps:** `@supabase/supabase-js`, `@tanstack/react-query`
- `@sentry/react-native` (web already runs Sentry)
- Styling: **StyleSheet + `brand.ts` tokens** (designed, not utility-classed — the Revolut feel). NativeWind is the alternative if Tailwind muscle memory is wanted.

**Later, not at launch:**
- **RevenueCat** — wraps StoreKit / Play Billing for PRO Player/Team when a wall flips. Zero billing code until then.
- **EAS Update** — OTA JS updates without a store review.

## Local dev toolchain (step 0)

- `pnpm`, `eas-cli` (global)
- Fastest dev loop: **Expo Go on a physical phone** — zero native setup.
- For simulators later: Xcode (iOS) + Android Studio (Android). Not required to start or to ship (EAS builds in the cloud).

## Phased roadmap

**Phase 0 — Foundation (blocked on: clean tree + accounts started)**
1. Land/commit the in-flight team-claims work; run the pending Supabase migrations.
2. Install pnpm + eas-cli; init Expo dev on a physical phone via Expo Go.
3. Convert repo to pnpm/Turbo monorepo: move Next app to `apps/web`, extract `packages/core`.
4. Scaffold `apps/mobile` (Expo Router); import from `packages/core`.
5. **Prove the pipeline early:** one screen → EAS build → runs on a real phone. (Not a submission — insurance.)

**Phase 1 — Core loop (native)**
Port in order, onto the working pipeline: design tokens + theme → auth (SecureStore) →
Home feed → `/lag` → match → player → profile.

**Phase 2 — Native-only justifications**
Push notifications, live match signal.

**Phase 3 — Submit**
Store listings, screenshots, privacy nutrition labels (data inventory already exists in the privacy policy), first EAS Submit to both stores.

**Phase 4 — Monetization (only when signal warrants)**
Wire RevenueCat, flip Player PRO / Team PRO walls independently per `MONETIZATION.md`.

## Store-account checklist (owner action — parallel track)

- [ ] Apple: enroll at developer.apple.com ($99/yr). Individual account = fastest. Needs Apple ID + payment.
- [ ] Google: register at play.google.com/console ($25 one-time). Set up the required test cohort.
- [ ] Decide the store display name + bundle IDs (e.g. `se.bowlkollen.app`) — reserved once, hard to change.
