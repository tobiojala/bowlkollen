# Bowlkollen — Brand Foundation

## What we are

Bowlkollen is the community hub for Swedish competitive bowling. It's the place where bowlers track their own game, fans follow their heroes, and captains manage their crew — and those are the same people, in the same community, just in different moments.

**The mental model:** Me → My People → The Sport

---

## Users

There is one user. Not three segments.

A Swedish bowling community member is all of this at once:
- A **bowler** who wants to see their own scores, form, and history
- A **fan** who wants to see what happened in a match last night, and follow a specific player
- A **captain** who needs to pick a team, track attendance, and see how the squad is performing

Build for the full person, not a narrow role.

---

## Vision

The app Swedish competitive bowling deserves. Fast, beautiful, honest about the sport — and missing nothing a serious bowler needs to know.

Not a general sports platform. Not a social network. Not a stats nerd dashboard. The *community hub*.

---

## Personality

**Confident, not showy.** The sport is the star. The app gets out of the way.

**Premium, not corporate.** Feels handmade and intentional, not a template. Closer to a sports magazine than a utility.

**Precise, not cluttered.** Every pixel earns its place. If removing it would confuse nobody, remove it.

---

## Voice

Swedish. First person. Direct.

- ✅ "Hemmaseger" not "Home team won"
- ✅ "Kommande match" not "Upcoming"
- ✅ "Din säsong" not "Your Season Stats"
- ✅ Short. Never more words than necessary.

---

## Visual rules

### Elevation is tonal, never a border
Three surface levels: `bg (#0b0d10)` → `surface (#14171c)` → `surface-2 (#1c2127)`.
Cards sit on surfaces. Surfaces sit on background. No hairline borders on cards.

### Gold is a budget
`#f5c200` is the *only* brand accent. It marks: the active thing, a live/now moment, or a genuine milestone (PB, 300, championship). If two gold things are on screen, one of them is wrong.

### Green means positive movement
`#30d47e` — wins, gains, improvement, rising form. Never for decoration.

### Red means danger or loss
`#e05555` — losses, relegation, negative delta. Never for decoration.

### Blue is gone
Not in new code. Info and comparison use ink. Positive outcomes use green.

### Ink is the default
`#f4f5f7` and its opacity siblings (`ink2` → `ink3` → `ink4`) carry most of the UI. Scores, names, labels, dates, venues — all ink. Color is earned, not assumed.

---

## Typography

| Token | Size | Use |
|---|---|---|
| `hero` | 52px | Fullscreen score, season stat |
| `title` | 24px | Page / section title |
| `body` | 15px | Main content |
| `caption` | 13px | Supporting detail |
| `label` | 11px | Uppercase metadata, badges |
| `micro` | 9px | Absolute floor — counters, timestamps |

- **Display font** (Barlow Condensed 700/900): scores, hero stats, condensed headlines
- **Body font** (DM Sans 400/500/600/700): everything else
- Nothing below 11px ships.

---

## Spacing — 8pt grid

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`

---

## What Bowlkollen is NOT

- Not a general bowling app (not tracking casual games)
- Not a betting platform
- Not trying to compete with Sportify or Flashscore
- Not another dark-mode sports template
- Not built for administrators first (the bowler is the primary user)
- Not a news site (the live scores and community are the news)

---

## Token source

`src/lib/brand.ts` — single source of truth for all design tokens (colors, typography, spacing, radius, motion). CSS variables mirror these in `src/app/globals.css @theme`.
