import type { Ionicons } from '@expo/vector-icons';

// A sponsored post — a bowling centre, a pro shop, a competition we have a deal
// with. Shaped so real deals drop straight in (swap sample data for a query, add
// imageUrl for real creative). `accent` tints the hero when there's no image.
export type Promo = {
  id: string;
  kind: 'house' | 'sponsor'; // house = our own "advertise here" pitch
  sponsor: string;
  sponsorIcon: keyof typeof Ionicons.glyphMap;
  kicker: string; // ANNONSPLATS (house) / TÄVLING / ERBJUDANDE (real deals)
  title: string;
  body: string;
  cta: string;
  accent: string;
  imageUrl?: string;
};

// No fake third-party ads: the only promo we ship is our OWN house card inviting
// advertisers in (mirrors web's home-promos). It turns the empty ad slot into a
// sales funnel — centres, pro shops and brands see where their ad goes and how
// to buy it. Real sponsor deals become additional `kind: 'sponsor'` entries here.
export const SAMPLE_PROMOS: Promo[] = [
  {
    id: 'house-annonsera',
    kind: 'house',
    sponsor: 'Bowlkollen',
    sponsorIcon: 'megaphone',
    kicker: 'ANNONSPLATS',
    title: 'Nå Sveriges bowlare',
    body: 'Hallar, proshops och varumärken — er plats i flödet, framför spelare och lag i hela landet.',
    cta: 'Annonsera hos oss',
    accent: '#1c2127',
  },
];
