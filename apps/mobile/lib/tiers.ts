import { COLOR } from '@/theme';
import { TIER_ORDER, divisionTier, groupDivisionsByTier, type Tier } from '@bowlkollen/core';

// League pyramid taxonomy + grouping now live in @bowlkollen/core (shared with
// web) so the two apps can't drift. Re-exported for existing `@/lib/tiers`
// imports (`groupByTier` kept as an alias); accent colours stay native-only.
export { TIER_ORDER, divisionTier, groupDivisionsByTier, groupDivisionsByTier as groupByTier };
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

