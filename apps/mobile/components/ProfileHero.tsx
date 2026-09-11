import type { HeroCard } from '@/components/HeroDeck';
import { BkRatingSoon } from '@/components/BkRatingSoon';
import { HeroDeck } from '@/components/HeroDeck';
import { ProfileTrend } from '@/components/ProfileTrend';
import { SparHeroCard } from '@/components/SparHeroCard';
import { usePlayerSpares } from '@/lib/use-player-spares';
import { cumulativeAvgPoints, type PlayerMatch, type PlayerStats } from '@/lib/player-stats';
import { COLOR } from '@/theme';

// The profile's hero deck: Säsongssnitt + BK-rating, each a big number with the
// drag-graph. Kept out of the route file to keep it under the size budget. On the
// owner's own profile a "Spärr" card is appended, feeding Mina spel (web parity).
export function ProfileHero({
  stats,
  history,
  licenceAverage,
  topPct,
  isOwn,
  onInfoRating,
  onOpenSpar,
}: {
  stats: PlayerStats;
  history: PlayerMatch[];
  licenceAverage: number | null;
  topPct: number | null;
  isOwn?: boolean;
  onInfoRating?: () => void;
  onOpenSpar?: () => void;
}) {
  const spare = usePlayerSpares();
  // Doorway into Mina spel — shows on your own profile whether or not you've
  // logged spares yet (an empty CTA until the pin-deck log captures leaves).
  const spareSummary = isOwn
    ? { has: spare.total > 0, pct: spare.stats.overall.pct, nemesis: spare.stats.nemesis ? { name: spare.stats.nemesis.name, pct: spare.stats.nemesis.pct } : null }
    : null;
  const snittTrend = cumulativeAvgPoints(history);
  // The curve is OUR running league-series average — never BITS' official snitt
  // (which is a broader, scalar number). Keep the curve honestly labeled as
  // "Seriesnitt" and surface the official BITS snitt separately as the caption,
  // so the two are never mistaken for the same figure.
  const seriesAvg = stats.seasonAvg ?? 0;
  const snittCaption = [
    licenceAverage != null ? `BITS-snitt ${licenceAverage}` : null,
    topPct != null ? `topp ${topPct}% i ligan` : null,
  ].filter(Boolean).join(' · ') || undefined;

  const cards: HeroCard[] = [
        {
          key: 'snitt',
          label: 'Seriesnitt',
          element: (
            <ProfileTrend
              points={snittTrend}
              label="SERIESNITT"
              restValue={seriesAvg}
              delta={stats.formDiff}
              deltaSuffix="form"
              caption={snittCaption}
              accent={COLOR.gold}
              baseline={stats.seasonAvg}
              baselineLabel="matchsnitt"
              projValue={stats.projectedAvg}
              lineWidth={5}
              tailLength={9}
              yPad={0.05}
              footerLeft={`${stats.matchesPlayed} matcher`}
              footerRight={stats.projectedAvg != null ? `Prognos ${stats.projectedAvg}` : undefined}
            />
          ),
        },
        {
          key: 'bk',
          label: 'BK-rating',
          // Launch state — the rating engine isn't live yet, so show "Kommer snart"
          // rather than an unfinished number (web parity).
          element: <BkRatingSoon onInfo={onInfoRating} />,
        },
  ];
  if (spareSummary) {
    cards.push({
      key: 'spar',
      label: 'Spärr',
      element: <SparHeroCard has={spareSummary.has} pct={spareSummary.pct} nemesis={spareSummary.nemesis} onOpen={() => onOpenSpar?.()} />,
    });
  }

  return <HeroDeck cards={cards} />;
}
