# BK Rating — specification

Bowlkollen's own performance metric: **one 0–100 number** for fans, **four
explainable pillars** for the curious. Engine: `src/lib/bk-rating.ts`,
tunables: `BK_RATING` in `src/lib/constants.ts`, tests: `src/__tests__/bk-rating.test.ts`.

## Why not raw snitt?

Raw average is blind to conditions: 215 on easy house oil and 195 on a brutal
sport pattern can be the same performance. BITS reports raw snitt and ranking
points — recombining those adds nothing. BK Rating's foundation is something
BITS structurally does not have:

## The core primitive: "Mot fältet"

For every game, compare the score to the **field average of the same hall,
same oil, same night**:

```
motFältet(game) = score − fieldAvg(hall, oil, date)
```

> Sara rullar 214 — fältet snittar 196 i Örebrohallen ikväll → **+18 mot fältet**

This is bowling's version of golf's *strokes gained*: you beat the
conditions, not just the pins. Self-evidently fair, one number, instantly
understandable, and it gets *more* accurate the more data flows through
Bowlkollen.

## The four pillars

Each pillar is computed per player, then expressed as a **percentile (0–100)
within the league**. The total is a weighted sum.

| Pillar | Weight | Definition |
|---|---|---|
| **Grund** | 50% | Season average of *mot fältet* (confidence-weighted) |
| **Form** | 25% | Recency-weighted *mot fältet* — half-life 8 games |
| **Tryck** | 15% | *Mot fältet* in deciding games only (S4 with the match level, playoff games). No deciders → falls back to Grund (no data ≠ weakness) |
| **Stabilitet** | 10% | Low spread of *mot fältet* residuals. Measured on residuals, not raw scores, so adapting to hard nights counts as consistency |

```
BK = round(50%·P(grund) + 25%·P(form) + 15%·P(tryck) + 10%·P(stabilitet))
```

Percentiles use midpoint tie handling (a lone player sits at 50, not 0/100).

## Data sources & confidence weights

The moat question: BITS owns sanctioned data, so Bowlkollen ingests **more**
— but weighted by trust, so the rating can't be inflated:

| Source | Weight | Affects |
|---|---|---|
| Sanctioned (BITS: league + sanctioned comps) | ×1.0 | all pillars |
| Verified non-sanctioned (hall-verified, or comp run via Bowlkollen live scoring) | ×0.5 | all pillars |
| Self-reported | ×0.2 | **Form only** — never Grund/Tryck/Stabilitet |

Anti-gaming consequences: a self-reported 280 can nudge your form arrow but
can never buy you a Grund percentile; verified club comps matter half as much
as league play; the worst a saboteur can do is dent their own Form.

Strategic note: "run your Tuesday club comp through Bowlkollen" is both the
data source *and* the growth loop — clubs get live scoring + result pages,
Bowlkollen gets exclusive data and the social graph.

## Worked example — Sara Holmberg (mockup data)

League: Elitserien Damer, 40 players. Sara's season:

1. **Mot fältet**: 60 games, weighted mean of residuals → **+12.0**
   → better than 36 of 40 players → P(grund) = **92**
2. **Form**: recent surge (13 games over snitt) pushes the recency-weighted
   value to +16 → P(form) = **88**
3. **Tryck**: 9 deciding games, +9 vs field in them → P(tryck) = **80**
4. **Stabilitet**: residual σ ≈ 19 → tighter than most → P(stabilitet) = **72**

```
BK = 0.50·92 + 0.25·88 + 0.15·80 + 0.10·72
   = 46 + 22 + 12 + 7.2
   = 87   →  Top 13% i Elitserien Damer
```

## UI rules

- The fan sees: **87**, "Top 13% i Elitserien Damer", movement arrow after
  every match, and "+12 mot fältet" as the one-line explanation.
- One tap opens the rating sheet: four pillar bars with weight tags, each
  with a generated narrative sentence (the same engine as the season
  narrative), plus the source-weighting footnote.
- Never show the formula in the UI. Show the *stories* the formula encodes.

## Multi-sport portability

Sport-agnostic: percentile framework, pillar structure, source weighting,
half-life decay. Per-sport adapter (see `src/lib/sport-config.ts`) defines:

- the **field baseline** ("mot fältet" = same-conditions average in bowling;
  venue/day baseline in darts; xG-context in team sports)
- what a **deciding moment** is (Tryck)
- the residual unit (pins, strokes, points)

## Open questions (decide before production)

1. Minimum games before a rating is shown (suggestion: 8 — show "BK –" with
   a progress ring before that)
2. Season rollover: full reset vs carrying 30% of last season as a prior
3. League percentile population: per division, per gender league, or national
4. Field-average edge cases: tiny fields (< 6 players same night) → blend
   with hall's seasonal baseline
