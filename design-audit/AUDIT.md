# Bowlkollen — Player Profile Mockup: Design Audit

## What is this?

**Bowlkollen** is a Swedish bowling app that tracks league matches, standings, and player stats for the Swedish national bowling league system (Elitserien, Allsvenskan, etc.). Think of it as a bowling-specific sports tracker.

This is a **design mockup** of the player profile page — not production code yet. The goal is to make it feel more like a genuine sports identity card than a generic stats dashboard. Dark theme only. Mobile-first (390px viewport).

**Live URL (local):** `http://MacBook-Air-som-tillhor-Carina.local:3001/mockup`

---

## Tech context

- Next.js 16 App Router, React, TypeScript
- Styling: **inline CSS** (the rest of the app is being migrated to Tailwind, but this mockup used inline styles throughout)
- Dark background: `#10161e`
- Brand gold: `#f5c200`
- Green: `#5dcaa5`, Blue: `#7ab4e8`, Red: `#e05555`
- All icons: lucide-react (no emojis in UI)
- Animations: CSS keyframes + SMIL animateTransform on SVG

---

## Features built (all 10 steps)

### 1. DNA Hero (full-width, avatar inside)
The player's "Bowling DNA" is a radial polygon where each spoke = one match, radius = that match's average. It sits full-width at the top. The avatar ("SH") lives inside the center circle. Three highlighted dots with callout lines show personal record (278), team rank (1:a i lag), and active streak.

**Screenshot:** `01-hero-top.png`

### 2. Distribution bar + character sentence
A full-width bar split by score buckets (u.180 / 180–199 / 200–249 / 250+). Below it: one auto-generated sentence from the data. Currently outputs: *"Pålitlig 200+-spjutspets på en historisk svit — 13 spel i rad över snitt."*

### 3. Rhythm metric
Shows the player's average score per game position (S1→S4) as a mini bar chart. Automatically labels the play style: "Stark avslutare" (strong finisher) because S4 avg is +14p above S1.

**Screenshot:** `02-stats-rhythm-challenge.png`

### 4. Challenge breakout banner
When a challenge hits ≥80% completion, it breaks out of the card carousel and surfaces as a banner in the main flow. Currently: "Serierekord" at 96% (need 1 050 in a series, at 1 013).

### 5. BK Rating as percentile
"BK Rating" is Bowlkollen's own performance metric. Shows as a gradient bar (Lägst→Högst) with the player's position marked, plus "Top 13% i Elitserien Damer" text.

**Screenshot:** `02-stats-rhythm-challenge.png`

### 6. Live mode
Toggle in the banner bar switches the page to "live match" state:
- DNA pulses with a glowing animation (faster than the normal breathing)
- A live score row appears: "SPELAR NU · SPEL 3 AV 4 · Örebro BK 5–2 Malmö BK · Sara: 201 · 234 · 189 pågår"

### 7. Season narrative paragraph
Four auto-generated sentences summarising the season. First sentence is brightest (78% white), the rest fade to ~52% to create reading hierarchy. Left gold border ties it to the brand.

**Screenshot:** `03-narrative-cards.png`

### 8. Social layer basics
- Follower count below name: "142 följare · 38 följer"
- Follow button (+ Följ → Följer ✓) that increments the follower count live
- Reaction chips (🔥 flame, ❤️ heart) on the top 4 matches by total series score. Tapping toggles a highlighted state and increments the count

**Screenshot:** `04-matchlog-reactions.png`

### 9. Match log with filters
Four filter tabs above the match log: **Alla / Bästa / Hemma / Borta**. "Bästa" shows top 5 by total series. "Hemma/Borta" filters by home vs away. Active tab is gold.

### 10. DNA as seasonal artifact
Two season pills below the DNA: "2025/26" (always on, gold) and "2024/25" (toggle, blue). When 2024/25 is toggled on, the previous season's DNA polygon renders as a dashed blue ghost behind the current gold one — showing how the player's fingerprint has grown.

**Screenshot:** `05-dna-overlay.png`

---

## Known design issues (flagged by developer)

The developer has flagged these areas as needing improvement before this goes to production:

1. **Spacing/padding inconsistencies** — some sections feel too tight, others too loose. Needs a consistent vertical rhythm.
2. **Empty space** — there are areas where the layout has awkward gaps, particularly around the season selector pills and the transition between sections.
3. *(Add others as you spot them)*

---

## Questions for design review

Please audit the screenshots and code structure with these questions in mind:

1. **Visual hierarchy** — Is it clear what the most important information is at a glance? Does the eye land in the right place?

2. **Spacing rhythm** — Is there a consistent vertical spacing system? Where are the most jarring gaps or tight spots?

3. **DNA hero** — Does the full-width DNA feel like a hero or just a large widget? Does it justify the space it takes (roughly 40% of the visible screen)?

4. **Information density** — The profile section before the tabs has: DNA → season selector → live row → name → BK rating → buttons → distribution bar + sentence + 4 stats + rhythm + character sentence. Is that too much before the fold? What would you cut or reorganise?

5. **The season narrative** — Does the fading sentence hierarchy work or does it make the last sentences feel unimportant?

6. **Social elements** — The follower count and reactions feel subtle. Should they be more prominent, or is subtle correct for a bowling app?

7. **Cards vs inline** — The feature cards (Säsongskurva, Vad händer om, Utmaningar, Säsongsduell) are horizontally scrollable. Should any of these be promoted to always-visible sections instead?

8. **Colour palette** — The page uses gold (#f5c200) heavily. Are there areas where the gold feels overused or where other accent colours could create better contrast?

9. **Mobile tap targets** — Are the interactive elements (reaction chips, filter tabs, season pills) large enough to tap comfortably on mobile?

10. **What's missing?** — What obvious feature or design pattern would you expect on a sports player profile that isn't here?

---

## File structure (relevant files)

```
src/app/mockup/
  page.tsx          — main page (state, layout, expanded sheets)
  data.ts           — all mock data (matches, challenges, reactions, etc.)
  helpers.ts        — pure functions (narrative, rhythm, character sentence, etc.)

src/components/mockup/
  ProfileDNA.tsx    — the DNA SVG component (full-width, overlay support)
  Curves.tsx        — MiniCurve + FullCurve chart components
  StatCards.tsx     — the 4 swipeable feature cards
  Sheet.tsx         — bottom sheet overlay + Card primitives
  MatchSparkline.tsx — 4-game mini trend indicator
```

---

## Screenshots index

| File | What it shows |
|------|--------------|
| `01-hero-top.png` | DNA hero, season selector, live row, name, BK rating bar |
| `02-stats-rhythm-challenge.png` | Distribution bar, character sentence, 4 stats, rhythm arc, challenge breakout |
| `03-narrative-cards.png` | Season narrative paragraph, swipeable feature cards |
| `04-matchlog-reactions.png` | Match log with filter tabs, reaction chips |
| `05-dna-overlay.png` | DNA with 2024/25 ghost overlay toggled on |
