# Bowlkollen — Future Vision (not now)

> Split out of the old `VISION.md` (2026-07) because it was trying to solve two
> different problems on two different time horizons: what we're building
> **today** (bowling, only bowling — see `PRODUCT_CONSTITUTION.md`) and what
> the company **could** become years from now. Reading both as one document
> made an AI collaborator start reasoning about plugin architectures and sport
> adapters for a problem that doesn't exist yet. Keep them separate.
>
> **Nothing here should influence a feature or architecture decision today.**
> Revisit only after Bowlkollen is genuinely the best bowling app in Sweden —
> not before. If you're an AI reading this while implementing something,
> this file is not a reason to add abstraction "just in case."

---

## The bigger gap (multi-sport, longer term)

The original framing: **the sports companion for every league the big apps
ignore.** Sofascore covers the Champions League; we'd cover the team that
trains Tuesday nights and plays Saturday mornings — the amateur and semi-pro
tier across sports, not just bowling. Millions of local-league players across
Europe run on spreadsheets, Facebook groups, and federation websites built in
2009.

| What exists | What's missing |
|---|---|
| Sofascore — professional sports | Amateur & semi-pro leagues |
| Club websites — static, manual | Live, automatic, beautiful |
| Federation portals — data locked up | Open, accessible, fan-first |
| GameChanger — American youth sports | European amateur sports |

The comparison worth remembering: **GameChanger** started as a baseball
scorekeeping app for youth leagues in America. Apple bought it for $1 billion
— because they nailed one sport, in one country, for the people nobody else
cared about. The bet is that bowling-in-Sweden is that same starting wedge,
not the whole business.

**Possible phases, far out, not sequenced against anything real yet:**
- Sport as a config layer instead of hardcoded (floorball named as the next
  candidate — underserved, big in Sweden)
- A second country for bowling (Finland, Norway)
- Cross-sport expansion once the bowling playbook is proven

---

## Possible future monetization expansion (beyond the locked consumer plan)

`MONETIZATION.md` is the locked, current plan (FREE / PRO PLAYER / PRO TEAM,
consumer-freemium, Stripe). The ideas below are a **different kind of
business** — B2B partnerships and sales cycles, not a subscription toggle —
and were deliberately kept out of the near-term plan because they require a
different muscle (account management, contracts) than shipping product.
Revisit only once the consumer product has real density and this kind of
sales effort is worth the distraction.

- **Verified bowling centers** — beyond an address/phone listing: lane
  booking, live oil-pattern-of-the-day, league night calendar, pro shop tie-in,
  restaurant/offers, tournament hosting tools. A premium partnership, not an ad.
- **Equipment / ball brands** — a player's own equipment page (e.g. "Phaze
  II — used in 86 matches, avg 223, best center X") could carry
  brand-supplied official specs, release videos, recommended layouts,
  comparison data. Framed as useful information the player wants, not
  advertising — but still fundamentally a brand-pays-for-placement deal.
- **Pro shops** — verified listings, layout/drilling booking.
- **Clubs** (distinct from individual team captains) — engagement dashboards
  (who opened the app this week, who's inactive, who's improving, junior
  progress), sponsor exposure, club-wide announcements. A club-level buyer is
  different from a team captain — bigger checks, slower sales cycle, more
  support overhead.
- **Federations** — licensing the platform, white-label options, "official"
  partnership status. The biggest potential prize and the heaviest lift —
  this is the point where Bowlkollen stops being a product company and starts
  needing a BD/partnerships function.

**The strategic question to ask before pursuing any of these:** does this
still fit "we charge whoever receives continuous value" without becoming the
support-heavy admin-SaaS business the original monetization thinking
explicitly wanted to avoid? If a partnership starts requiring dedicated
account management just to keep it happy, that's a signal it's a different
business, not a feature of this one.

---

## Other parked feature ideas worth remembering

- **Season Atlas as "the signature feature"** — the original pitch: no sports
  app lets you navigate a full season as a spatial, discoverable surface
  (GitHub contribution graph energy, Spotify Wrapped energy). Currently
  parked (foundation built, no clear wireframe to iterate toward — see memory
  `project_atlas_map_view.md`). Worth knowing this was once considered *the*
  differentiator, even though the current thinking (per the Constitution) is
  that the real moat is official+personal data combined, not any single
  feature — Atlas is a strong expression of "Remember," not the whole story.
- **Real achievements as a share-card/marketing surface** — first 300, first
  800, a clean game, 900 series, 5 years as captain, 500 matches. Not fake
  gamification (points for using the app) — real, rare, emotional milestones,
  paired with a PRO-tier beautiful share card. Low effort, no conflict with
  the anti-gamification stance, not yet built.

---

## Still true regardless of phase

Carried forward from the original `VISION.md` because these aren't about
scope or timing — they're just things Bowlkollen should never become:

- Not a casino affiliate page.
- Not a generic sports news site with AdSense clutter.
- Not building features that impress investors but confuse users.
- No ads, ever, as the primary business model.
