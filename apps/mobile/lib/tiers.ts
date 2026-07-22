import { COLOR } from '@/theme';

// League pyramid, top to bottom. Used to sort + group the division browser so it
// reads as a hierarchy, not an alphabetical dump. Mirrors the web divisionTier.
export const TIER_ORDER = [
  'Elitserien',
  'Allsvenskan',
  'Division 1',
  'Division 2',
  'Division 3',
  'Division 4',
  'Division 5',
  'Övrigt',
] as const;

export type Tier = (typeof TIER_ORDER)[number];

export function divisionTier(name: string): Tier {
  const n = (name || '').toLowerCase();
  if (n.includes('elitserien')) return 'Elitserien';
  // Mellan/Nord/Syd-allsvenskan + "Norra Allsvenskan" all belong to Allsvenskan.
  if (n.includes('allsvensk')) return 'Allsvenskan';
  for (let i = 5; i >= 1; i--) {
    if (name.startsWith(`Division ${i}`) || name.startsWith(`Div ${i}`)) {
      return `Division ${i}` as Tier;
    }
  }
  return 'Övrigt';
}

// Categorical accent per tier (gold pinnacle → green → olive down the pyramid) —
// life + hierarchy without blue and without a rainbow. Lower tiers use ink.
export const TIER_ACCENT: Record<Tier, string> = {
  Elitserien: COLOR.gold,
  Allsvenskan: '#5dcaa5',
  'Division 1': '#7cc79b',
  'Division 2': '#9cbe86',
  'Division 3': '#b3ac74',
  'Division 4': COLOR.ink3,
  'Division 5': COLOR.ink3,
  Övrigt: COLOR.ink4,
};

export function groupByTier<T extends { name: string }>(
  items: T[],
): { tier: Tier; items: T[] }[] {
  const buckets = new Map<Tier, T[]>(TIER_ORDER.map((t) => [t, []]));
  for (const it of items) {
    (buckets.get(divisionTier(it.name)) ?? buckets.get('Övrigt')!).push(it);
  }
  return TIER_ORDER.map((tier) => ({
    tier,
    items: (buckets.get(tier) ?? []).sort((a, b) => a.name.localeCompare(b.name, 'sv')),
  })).filter((s) => s.items.length > 0);
}
