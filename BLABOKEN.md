# Blåboken — Swedish bowling rules (encoded reference)

Facts extracted from **Blå Boken**, Svenska Bowlingförbundet's official rulebook
(source: swebowl.se). This captures the rules the app depends on so we don't
need the PDF in the repo. Each item cites its chapter/§. Where a value is set
per-tournament or lives in a chapter we haven't ingested, that's noted.

Chapters read: **C** (Regler för bowlingspel), **D** (Seriebestämmelser),
**E** (Mästerskapsbestämmelser), **K** (Administrativa regler).

---

## Game scoring — Kap C
- A **serie** (game) is **10 frames** (rutor). Two deliveries per frame (three
  in the 10th on a strike/spare). (§ C 1)
- **Strike** = all ten pins on the first ball; scores 10 + next two balls.
  **Spärr** (spare) = 10 + next one ball. **Twelve strikes in a row = 300**,
  the maximum game. (§ C 1)
- **Spelsätt** (§ C 2): *Europeiskt* (EU — one lane per serie) and *Amerikanskt*
  (AM — two lanes / a **banpar**, switching each frame), plus Bakers and Scotch
  Double. Seriespel uses 2-manna AM (8-man series) or EU (4-man series) on
  banpar with a flyttningsschema.

→ encoded: `SCORE.PERFECT = 300`, `SCORE.MIN = 0`, `FRAMES_PER_GAME = 10`.

## League / series structure — Kap D (Seriebestämmelser)
- **National series (Nationella serien):**
  - **Herrar:** Elitserien → Allsvenskan → Division 1 → 2 → 3 → 4. (§ D 102 p1.1)
  - **Damer:** Elitserien → Allsvenskan → Division 1 → 2. (§ D 102 p1.1)
  - Below: **Distriktsserierna** (run by each SDF). (§ D 102)
- **Elitserie arena requirement:** home hall with ≥ 8 lanes and online scoring /
  web broadcast. (§ D 102 p1.2)
- **Promotion/relegation (upp-/nedflyttning):** adjacent tiers exchange teams
  with kval (play-offs); exact counts were revised 2025-09-11 and differ by
  tier/region. (§ D 105–106) — *don't hard-code counts; they change per säsong.*

## Team match format & match points — Kap D
- **8-man national series:** each match = **4 serier per player**, American
  spelsätt, played for banpoäng. **4-man series:** 4 serier per player, European
  spelsätt. (§ D 201 p1.1–1.2)
- **Scoring a match (8-man):** each won delmatch (2-man pairing on a banpar) =
  **1 banpoäng**; **+1 banpoäng** to the team with the highest combined pins
  (kägelpoäng) of its eight players in that serie → **max 5 banpoäng/serie,
  max 20/match**. A tie in a delmatch or equal pins = 0 to each. (§ D 202 p1.3–1.4)
- **Match result:** the team with the most banpoäng gets **2 matchpoäng**; equal
  banpoäng = match drawn, **1 matchpoäng each**. Each team also carries a
  *differens* (own banpoäng − opponent's). (§ D 202 p1.5)
- **Serietabell ordering:** (a) matchpoäng, (b) ban-/kägelpoäng differens,
  (c) inbördes möten, (d) banpoäng last meeting, (e) kägelpoäng last meeting,
  (f) lottning. (§ D 109)

→ encoded: `MATCH_FORMAT` in `constants.ts`. The app's existing match scorecard
(4 banpar × 2 positions = 8 players, per-serie totals) already matches this.

## Age classes (åldersklasser) — Kap K § 8 (Klassindelning)
Age is by **calendar year**, not birth date — "till och med det kalenderår under
vilket spelaren fyller X år":
- **Ungdom** — through the calendar year the player turns **16**.
- **Junior** — through the calendar year they turn **21**.
- **Oldgirls/Oldboys** — from the calendar year they turn **55**.
- **Veteran** — from the calendar year they turn **65**.

(Mästerskaps-klasser in Kap E group seniors further: −16, 17–21, 22–30, 31–40,
41–50, 51–64, +65, plus Elit. § E 2.)

→ **Junior-guardrail note:** the federation's youth cohort is **ungdom = turns 16
or younger this year**. That's the natural cut for "no self-serve social until a
guardian/captain claims the profile," and it sits above Sweden's GDPR digital-
consent age of **13** (Dataskyddslagen 2 kap. 4 §). Because the rulebook keys off
**birth year**, a `birth_year` column is enough — full birth date isn't required.
→ encoded: `AGE_CLASS` in `constants.ts` (cutoffs only; gate not built — no age
data in the schema yet).

## Skill classes & handicap — Kap K § 8–9
- **Spelstyrkeklasser (para):** A/B/C/D by snitt (Herrar A ≥171, B 151–170,
  C 121–150, D ≤120; Damer A ≥161, B 136–160, C 111–135, D ≤110; Ränna A ≥150,
  B ≤149). (§ K 8 p2)
- **Snitt (average):** the player's **25 best results over a rolling 5 years**;
  results older than 5 years are excluded. New license entry value (ingångsvärde)
  defaults to **250** until 4 real results exist. (§ K 9 p2–3)
- **Handicap (hcp):** **normally 0.** There is **no single national formula** —
  each *arrangör* picks the percentage/model, scratch line (nollgräns) and cap
  per tournament. A player's hcp can never exceed 100 % of the gap between their
  spelstyrka and the relevant percentile's spelstyrka, rounded down. (§ K 9 p3.2)
  → *Do not hard-code a handicap formula* (the old BACKLOG `(200−avg)×0.8` is a
  guess, not official). If we add handicap, model it as organizer-configurable.

---

### Still not ingested
- Exact promotion/relegation counts per tier/season (Kap D § 105–106, revised
  yearly) — keep these data-driven, not constants.
- Ranking-point formula (Kap K § 10) and BK Rating inputs beyond snitt.
