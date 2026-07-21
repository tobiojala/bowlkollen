# Monetization & access model

Decision doc. Locks how Bowlkollen makes money so we stop re-litigating it.
Revised 2026-07-21 — see below for what changed and why.
Center of gravity = **consumer freemium**, not admin SaaS. Bigger B2B ideas
(centers, pro shops, equipment brands, federations) are real but deliberately
kept out of this plan — see `VISION_FUTURE.md`.

## The iron rule

> **Never paywall anything that grows the network or enriches the data.
> Only paywall what makes an already-hooked user feel powerful.**

The app is a network-effects machine (DNA, following, team logistics, and
BK Rating — which *requires* many players' scores to compute "mot fältet").
A wall on access fights the one thing the product needs before it has earned
anything: density. Free must be genuinely complete and delightful — it is the
growth engine. PRO converts the obsessed.

## What changed in this revision

The original version of this doc had one flat PRO tier and listed team
logistics (availability, lineup) as free. Since then we actually built the
team/captain system (claims, availability, lineup builder, invite-vouched
trust model) and separately identified a second real value prop: the
personal layer only Bowlkollen has (notes, equipment, auto-insights from a
player's own history) — the moat described in `PRODUCT_CONSTITUTION.md`'s
Identity section ("BITS knows my official results. Bowlkollen knows me.").

One flat tier can't price both of those honestly — a casual league player
and a team captain get different value and should be offered different
things. So: **three tiers, not one.** Team logistics stay **free at launch**
(unchanged from the iron rule above) but are now explicitly tagged so the
wall can flip on independently from Player PRO once there's real signal
captains would pay — this was always the plan's own advice ("build every PRO
feature behind a flag from day one"), just not yet applied to team tools.

## The tiers

| | Who | What |
|---|---|---|
| **FREE** | Everyone | Follow players/teams/divisions (never paywalled — network growth); your own full profile (DNA, BK Rating number, history); any entity overview (snitt, BK Rating number, recent form, this season's log); standings/results/schedules; team logistics — availability, lineup, claims (free *for now*, see below) |
| **PRO PLAYER** (~49 kr/mo) | The obsessed individual bowler | Multi-season history & all-time records; full BK Rating pillar breakdown of *other* players + league-wide comparison; prediction tools, advanced curves, säsongsduell deep-dives; H2H scouting + oil-profile roster intelligence; share-card export; **personal notes; auto-insights from your own match history ("you always struggle at this center," "this ball is your best on 42' patterns"); equipment tracking** |
| **PRO TEAM** (~79–149 kr/mo, size-dependent; `requiresPro: false` until flipped on) | The captain | Availability polling, lineup builder, shared team notes, match preparation, travel planning, team announcements — the system already built this session |

BK Rating **number is always free and public** — it is the talking point and
the marketing. The *breakdown of others* is Player PRO.

## The claim funnel (cold-start — already built)

```
Ghost profile  →  Claimed profile  →  PRO PLAYER / PRO TEAM
(everyone, free)   (free, verified)    (paid upsell)
```

- Every licensed player is **live from launch** — the app passes the
  "is this dead?" test immediately.
- **Claiming is FREE, always.** It is activation, never monetization.
  Verify via licence nr **or** captain/admin approval, now hardened against
  the license-number-impersonation issue (see `project_claim_identity_hardening.md`
  / the invite-vouching system) — verification method never changes pricing.
- PRO is the upsell **after** claiming, never the price of claiming.
- **Never charge a person to see their own data.** Trust + PR landmine.

## Why the league dataset is monetizable

The complete, beautiful, queryable league IS a real asset — monetized as
**Player PRO depth/scouting** (compare against everyone, oil-profile
intelligence, H2H deep-dives), made powerful *because* every player is in it.
Not monetized as an access wall.

## Pricing

- **Player PRO: ~49 kr/month**, push **annual ~399 kr/year**.
- **Team PRO: ~79–149 kr/month** depending on team size — cheap relative to
  what it replaces (a captain's spreadsheet + group-chat overhead); one
  player buying a coffee costs more.
- 150–200 kr is a **B2B club-admin** number (svenskalag-style) — too high for
  either consumer tier. Don't anchor there; that pricing belongs to the
  club/federation ideas parked in `VISION_FUTURE.md`, if ever pursued.

## Timing — do NOT wall at launch

1. **Launch free — both Player and Team.** Goal is "alive & loved," not
   revenue. A wall on a near-empty niche app reads as "why pay for this?".
2. **Build every PRO feature (player *and* team) behind a `requiresPro`
   flag from day one** so flipping either wall later is one boolean, not a
   retrofit. This applies to the team/captain system we just built, same as
   everything else.
3. **Flip Player PRO on after density** (engaged daily users + rich BK Rating
   data). **Flip Team PRO on separately**, once there's real signal — teams
   actually depending on the tool weekly — that captains would pay for it.
   These two switches don't have to flip at the same time.
4. Grandfather early adopters generously — never claw back a free feature.

## Risks & guardrails

- **GDPR**: public competition results are likely a legitimate-interest
  basis; the claim flow is the control/safety valve — honor objection &
  removal requests; let a claimed player manage visibility.
- **Minors**: junior licensed players need care. Limit social features and
  visibility on junior profiles until claimed by an adult/guardian.
- **Never paywall someone's own data.**
- **Don't drift into admin SaaS** (dues, member registers, website builder,
  selling to clubs/centers/federations directly) — that's a heavier,
  support-cycle business, deliberately kept out of this plan. See
  `VISION_FUTURE.md` if that path is ever pursued on purpose.

## Implementation note

- One `requiresPro: 'player' | 'team' | false` per gated feature/tab (two
  independent flags now, not one boolean) + a single `useEntitlement()` /
  `<ProGate tier="player" | "team">` wrapper.
- PRO = a boolean pair at launch; wire real billing (e.g. Stripe, two
  separate products/prices) only when a wall actually turns on.
- Tag features as we build them — the paywall becomes a switch, not a
  rebuild. The team/claims/lineup system built 2026-07-21 should get its
  `requiresPro: 'team'` tag now, set to inactive, exactly per this rule.
