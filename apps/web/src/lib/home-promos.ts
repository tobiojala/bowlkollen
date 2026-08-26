// Home-feed promo inventory. No fake third-party ads: the only promo we ship is
// our OWN house card inviting advertisers in — it turns the empty ad slot into a
// sales funnel (every centre / pro-shop / brand owner sees where their ad goes
// and how to buy it). Real sponsor deals become additional entries here later,
// shown at a sensible frequency alongside (or instead of) the house card.

export type Promo = {
  id: string
  kind: 'house' | 'sponsor'
  kicker: string   // ANNONSPLATS (house) / TÄVLING / ERBJUDANDE (real deals)
  title: string
  body: string
  cta: string
  href: string     // internal route or mailto:
}

export const HOME_PROMOS: Promo[] = [
  {
    id: 'house-annonsera',
    kind: 'house',
    kicker: 'ANNONSPLATS',
    title: 'Nå Sveriges bowlare',
    body: 'Hallar, proshops och varumärken — er plats i flödet, framför spelare och lag i hela landet.',
    cta: 'Annonsera hos oss',
    href: '/annonsera',
  },
]
