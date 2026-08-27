// The league pyramid taxonomy — the ONE source of which division belongs to which
// tier, shared by web + native so the two can't drift. Each app keeps its own
// grouping wrapper (Map on web, array on native) built on this `divisionTier`.
// Categorical tier COLOURS stay per-app (web: division-standings TIER_COLOR;
// native: tiers TIER_ACCENT) — this is only the taxonomy + rank.

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
  // Case-insensitive: men's leagues are one word ("Sydallsvenskan", lowercase
  // 'a'), women's are spaced ("Norra Allsvenskan") — all one tier. Division match
  // is anchored at the start so regional leagues ("Värmlands P4 Div 4") that
  // merely contain "Div 4" don't get miscategorised as the national tier.
  const n = (name || '').toLowerCase();
  if (n.includes('elitserien')) return 'Elitserien';
  if (n.includes('allsvensk')) return 'Allsvenskan';
  for (let i = 5; i >= 1; i--) {
    if (name.startsWith(`Division ${i}`) || name.startsWith(`Div ${i}`)) return `Division ${i}` as Tier;
  }
  return 'Övrigt';
}

// Group divisions into the tier pyramid, ordered by TIER_ORDER, and sorted
// WITHIN each tier by name in Swedish locale (so Å/Ä/Ö land correctly at the
// end). Shared by web + native so the schema division list arranges identically
// and can't drift. Empty tiers are dropped.
export function groupDivisionsByTier<T extends { name: string }>(items: T[]): { tier: Tier; items: T[] }[] {
  const buckets = new Map<Tier, T[]>(TIER_ORDER.map((t) => [t, []]));
  for (const it of items) (buckets.get(divisionTier(it.name)) ?? buckets.get('Övrigt')!).push(it);
  return TIER_ORDER
    .map((tier) => ({ tier, items: (buckets.get(tier) ?? []).sort((a, b) => a.name.localeCompare(b.name, 'sv')) }))
    .filter((g) => g.items.length > 0);
}

// Higher = show first (feed ranking, card stacks). Elitserien always tops.
export const TIER_RANK: Record<string, number> = {
  Elitserien: 6,
  Allsvenskan: 5,
  Mellanallsvenskan: 4,
  'Division 1': 3,
  'Division 2': 2,
  'Division 3': 1,
  'Division 4': 1,
  'Division 5': 1,
  Övrigt: 0,
};
