import { COLOR } from '@/theme';
import { TIER_ORDER, divisionTier, type Tier } from '@bowlkollen/core';

// League pyramid taxonomy now lives in @bowlkollen/core (shared with web) so the
// two apps can't drift on which division is which tier. Re-exported for existing
// `@/lib/tiers` imports; the native grouping shape + accent colours stay here.
export { TIER_ORDER, divisionTier };
export type { Tier };

// Categorical accent per tier (gold pinnacle → down the pyramid). Native-only;
// the flat Schema uses only the Elitserien gold, but other surfaces may use these.
export const TIER_ACCENT: Record<Tier, string> = {
  Elitserien: COLOR.gold,
  Allsvenskan: COLOR.green,
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
