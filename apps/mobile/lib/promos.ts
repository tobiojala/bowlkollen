import type { Ionicons } from '@expo/vector-icons';

// A sponsored post — a bowling centre, a pro shop, a competition we have a deal
// with. Shaped so real deals drop straight in (swap sample data for a query, add
// imageUrl for real creative). `accent` tints the hero when there's no image.
export type Promo = {
  id: string;
  sponsor: string;
  sponsorIcon: keyof typeof Ionicons.glyphMap;
  kicker: string; // e.g. TÄVLING, ERBJUDANDE
  title: string;
  body: string;
  cta: string;
  accent: string;
  imageUrl?: string;
};

// Placeholder deals so we can feel how sponsored posts sit in the feed. Replace
// with a real source when partnerships exist.
export const SAMPLE_PROMOS: Promo[] = [
  {
    id: 'promo-vintercupen',
    sponsor: 'Strike Arena',
    sponsorIcon: 'flame',
    kicker: 'TÄVLING',
    title: 'Vintercupen 2026',
    body: 'Öppen för alla klasser · 20 000 kr i prispott. Anmälan öppen nu.',
    cta: 'Anmäl dig',
    accent: '#5dcaa5',
  },
  {
    id: 'promo-proshop',
    sponsor: 'Kloten Pro Shop',
    sponsorIcon: 'pricetag',
    kicker: 'ERBJUDANDE',
    title: '20% på nya klot',
    body: 'Boka borrning online och få rabatt på säsongens nyheter.',
    cta: 'Till erbjudandet',
    accent: '#e0b84d',
  },
];
