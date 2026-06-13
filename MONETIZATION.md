# Monetization & access model

Decision doc. Locks how Bowlkollen makes money so we stop re-litigating it.
Center of gravity = **consumer freemium**, not admin SaaS (see team strategy).

## The iron rule

> **Never paywall anything that grows the network or enriches the data.
> Only paywall what makes an already-hooked user feel powerful.**

The app is a network-effects machine (DNA, following, team logistics, and
BK Rating — which *requires* many players' scores to compute "mot fältet").
A wall on access fights the one thing the product needs before it has earned
anything: density. Free must be genuinely complete and delightful — it is the
growth engine. PRO converts the obsessed.

## The free / PRO line

Not "read vs more". The line is **overview (free, generous) vs depth (paid)**,
which maps onto tabs: the *first/overview tab of every entity is free*; the
*deep tabs* are PRO. Social, logistics, and your own data are free regardless
of tab.

| FREE — alive & beautiful baseline | PRO — superpowers for the obsessed |
|---|---|
| Follow players/teams; reactions | Multi-season history & all-time records (deep tabs) |
| Your **own** full profile (DNA, BK Rating number, your history) | Full BK Rating **pillar breakdown of other players** + league-wide comparison |
| Any entity overview: snitt, BK Rating number, recent form, this season's match log | Prediction tools (Vad händer om, prognosfläkt), advanced curves, säsongsduell deep-dives |
| Standings, results, schedules | H2H scouting + oil-profile roster intelligence |
| Team logistics: availability, lineup, auto-feed | Share-card / Remotion export (vanity); advanced alerts |

BK Rating **number is always free and public** — it is the talking point and
the marketing. The *breakdown of others* is PRO.

## The claim funnel (cold-start — already built)

Architecture already in the code: `players` (all BITS-licensed players, live
from day one), `player_claims` (status `pending` → verified), `club_claims`
(captain/admin, role + status).

```
Ghost profile  →  Claimed profile  →  PRO
(everyone, free)   (free, verified)    (paid)
```

- Every licensed player is **live from launch** — the app passes the
  "is this dead?" test immediately. This is the single best cold-start move.
- **Claiming is FREE, always.** It is activation (a data row becomes an
  engaged node that follows, gets followed, drags their team in), never
  monetization. Verify via licence nr **or** captain/admin approval (the
  `pending` status is the hook for this).
- PRO is the upsell **after** claiming, never the price of claiming.
- **Never charge a person to see their own data.** Trust + PR landmine.

## Why the league dataset is monetizable (the kernel of truth)

The complete, beautiful, queryable league IS a real asset — but it's
monetized as **PRO depth/scouting** (compare against everyone, oil-profile
intelligence, H2H deep-dives), made powerful *because* every player is in it.
It is not monetized as an access wall. The unclaimed-everyone model
strengthens FREE and powers PRO scouting — it does not justify gating access.

## Pricing

- **~49 kr/month**, push **annual ~399 kr/year** (annual = lower churn + real
  cash flow; monthly is the on-ramp, annual the default).
- 150–200 kr is a **B2B club-admin** number (svenskalag) — far too high for a
  B2C bowler. Don't anchor there.
- Small passionate community has real "finally, someone built this — I'll pay
  to support it" willingness. Capture it with generous free + frictionless
  upgrade, not an aggressive wall.

## Timing — do NOT wall at launch

1. **Launch free.** Goal is "alive & loved", not revenue. A wall on a
   near-empty niche app reads as "why pay for this?".
2. **Build every PRO feature behind a `requiresPro` flag from day one** so
   flipping the wall later is one boolean, not a retrofit.
3. **Flip PRO on after density** (engaged daily users + rich BK Rating data).
   Grandfather early adopters generously — never claw back a free feature
   (Strava got hated for exactly that).

## Risks & guardrails (from the pre-populate model)

- **GDPR**: public competition results are likely a legitimate-interest basis,
  but the claim flow is your control/safety valve — honor objection & removal
  requests; let a claimed player manage visibility.
- **Minors**: junior licensed players need care. Limit social features
  (following, reactions) and visibility on junior profiles until claimed by an
  adult/guardian. **Decide policy before launch.**
- **Never paywall someone's own data.**
- **Don't drift into admin SaaS** (dues, member registers, website builder) —
  that's a different, worse, support-heavy business.

## Implementation note

- One `requiresPro: boolean` per gated feature/tab + a single
  `useEntitlement()` / `<ProGate>` wrapper.
- PRO = a boolean at launch; wire real billing (e.g. Stripe) only when the
  wall actually turns on.
- Tag features as we build them — the paywall becomes a switch, not a rebuild.
