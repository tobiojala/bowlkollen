# App ↔ Web Fidelity Audit (2026-07-22)

Honest assessment of where the native app matches your web build vs. where it drifted or was simplified. The web is the spec; this maps the gap.

## The honest summary

The app faithfully has the **structure, data, navigation, and design tokens** of the web. But **most screens are simplified/partial versions, not faithful reproductions** — I built for speed and left out richness. The three biggest categories of drift:

1. **App-wide chrome** — the web's scroll-blur bands (top + bottom) are missing entirely.
2. **Identity treatment** — web avatars use a conic-gradient "story ring" + radial glow; the app uses a solid ring + shadow glow. Appears on team + player.
3. **Rich sections & sheets** — the web's narrative/analysis/feed sections and bottom-sheets are largely not ported (esp. the player profile).

Fidelity labels below: **Close** (matches) · **Partial** (core there, richness missing) · **Skeleton** (simplified shell) · **Divergent** (intentionally different).

---

## App-wide

| Element | Web | App | Gap |
|---|---|---|---|
| **Scroll-blur chrome** | Top band (80px, blur, fades in on scroll) + bottom band (100px, always) frosting content under nav/tabs, `rgba(14,17,22,0.6)` gradient masks | none | **MISSING** — you flagged this |
| **Avatar identity** | conic-gradient ring + radial ambient glow, hashed team colour | solid-colour ring + shadow glow | drift (shared by team+player) |
| **Motion** | framer-motion `Reveal` staggers on every section | press-scale + feed/standings stagger only | partial |

---

## Screens

### Home — **Skeleton** (HIGH priority: entry screen)
- **Web:** greeting + date · 5 filter chips (Allt/Spelare/Lag/Matcher/Prediktion) · live ticker (LiveAlertBanner) · Matcher + Prediktion tabs · rich personalized **FeedSection** (player results + team events, grouped)
- **App:** greeting + date ✓ · Kommande/Resultat of *your* matches (MatchRow)
- **Gap:** filter chips, live ticker, tabs, and the whole rich feed (app feed is just your matches split by status)

### Team `/lag` — **Partial** (MEDIUM-HIGH)
- **Web:** LagHero (radial glow + conic-ring avatar + tier label + name + stat row + **TeamStoryBanner** + hall link + **LagActions** share/export/calendar) · **LagLineupPreview** · **CaptainToolbar** · **StandingsLadder** (team ± neighbours) · roster · matches
- **App:** identity hero (solid ring/shadow glow, division label, name, stat row ✓) · followers/follow · roster (snitt·matcher·chevron ✓) · Kommande/Resultat ✓
- **Gap:** story banner, lineup preview, captain toolbar, standings ladder, hall link, actions; avatar ring/glow fidelity; back should go to the division

### Player `/players` — **Partial** (richest web screen, biggest surface)
- **Web:** **IdentitySection** (snitt hero, BK-rating, achievements, form, prognos, curve/H2H/card actions) · **DNA radar** · **AnalysisSection** (season narrative) · **FeedSection** (projections, duell, what-if, challenges) · 6 bottom-sheets (Curve, WhatIf, BkRating, Duell, Match, DnaInfo)
- **App:** avatar/name/club/follow · percentile pill · 3 stats (snitt/nivå/följare) · **DNA radar ✓** (just fixed) · form in MATCHER header · history + series
- **Gap:** identity richness, the analysis narrative, the feed section, all six sheets

### Match `/matcher` — **Close-ish** (LOW-MEDIUM)
- **Web:** TeamScoreSection (per-team score breakdown)
- **App:** hero (teams/score/date/division/hall) + per-team player results (tappable → player) ✓
- **Gap:** verify against TeamScoreSection's exact breakdown (board/points detail)

### Division `/divisioner` — **Close** (LOW-MEDIUM)
- **Web:** full standings table (# · LAG · M · V · O · F · BP · P) · matches · DivisionActions (follow/calendar/CSV) · StandingsSheet
- **App:** standings table (# · LAG · M · V-O-F · P — compressed) ✓ · recent results ✓
- **Gap:** full separate columns, division actions (follow/calendar/export)

### Discover / "Hitta" — **Divergent (intentional)**
Web `/discover` = follow *suggestions*; app "Hitta" = *search*. This was your nav-model change (Føljer→removed, Discover=find). Not a fidelity bug — but worth confirming it's still what you want.

### Profil — **Partial**
Web `/profile` = account hub (claimed identity, team memberships, follow mgmt). App = identity card + following link + sign-out. *(Note: web `/profile` is itself flagged for a rebuild, so lower priority.)*

### Onboarding — **Close** · Login — **Divergent** (app OTP vs web Google/magic-link, deliberate)

---

## Recommended fix order (my suggestion — you decide)

1. **Scroll-blur chrome** — one component, whole-app impact, you already flagged it. Quick, high payoff.
2. **Avatar identity fidelity** — conic-gradient ring + radial glow; shared by team + player, so one fix lands twice.
3. **Home → full web** — chips + rich feed grouping; it's the entry screen.
4. **Team page missing sections** — story banner, standings ladder, hall, actions.
5. **Player profile depth** — identity richness, analysis, feed, sheets (biggest surface, do in chunks).
6. **Match / Division parity** — columns, breakdowns, actions.

Each item: I read the exact web component, rebuild faithfully, you verify against the web, we iterate until it matches — then move on.
