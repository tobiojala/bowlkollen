---
name: project-homepage-redesign
description: Homepage redesign direction — Phantom Wallet style, sport-agnostic config layer, AppGreeting hero section
metadata:
  type: project
---

Redesigning the homepage toward a Phantom Wallet / Revolut-inspired design language.

**Why:** App felt like a developer dashboard — too many boxes, no consistent hierarchy, no emotional engagement. Vision is to build the habit loop: users open it like Instagram on match day.

**Core principle:** First viewport = ONE metric. The greeting fills the screen, shows the single most important number (live count / countdown / team position), then reveals more on scroll. No more scrolling past 10 sections to find what matters.

**Key files built:**
- `src/lib/sport-config.ts` — `SportConfig` type + `BOWLING_CONFIG` + `APP_SPORT` export. Sport is a config layer, not hardcoded. Phase 2: swap config for floorball etc.
- `src/components/home/AppGreeting.tsx` — full-viewport greeting section. Day + time-aware greeting, hero metric (priority: live > countdown > position > idle), three quick-action pills. Fully sport-agnostic — no bowling references inside the component.
- `src/components/home/LiveHero.tsx` — horizontal swipe carousel for live/upcoming matches. Uses CSS scroll-snap + `useRouter` (not Link, to avoid nested `<a>`).
- `src/components/home/HonorFeed.tsx` — big swipeable score achievement cards with count-up animation.
- `src/app/home/demoData.ts` — DEMO=true, `MOCK_TABLES` now has form arrays (W/D/L), `MOCK_MY_PLAYER` has `personalBest`/`streakAbove`/`streakGames`.

**Design language decisions:**
- Gold (`#f5c200`) used sparingly — only live state, active nav, elite scores
- `textMuted` added to `src/lib/theme.ts` as alias for `muted` (legacy bridge)
- Section labels: 10px, 800 weight, 2-2.5 letter-spacing in caps
- Cards: 20px border-radius, no border-boxing everything — whitespace does the separating

**What comes next (agreed but not built):**
- Kill the nav clutter — bottom nav already good (4-5 tabs, morphing pill), but top nav needs cleanup
- Card audit — go through every section removing boxes where whitespace can do the same job
- Page transitions when navigating between routes
- Swipe gesture for Serie tabs on match page

**How to apply:** When building any new page or component, start from AppGreeting's philosophy: one thing per screen, hero metric front and center, actions secondary.
