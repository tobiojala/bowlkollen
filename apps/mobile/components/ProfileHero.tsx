import { HeroDeck } from '@/components/HeroDeck';
import { ProfileTrend } from '@/components/ProfileTrend';
import { matchTrendPoints, rollingRatingPoints, type PlayerMatch, type PlayerStats } from '@/lib/player-stats';

// The profile's hero deck: Säsongssnitt + BK-rating, each a big number with the
// drag-graph. Kept out of the route file to keep it under the size budget.
export function ProfileHero({
  stats,
  history,
  licenceAverage,
  topPct,
}: {
  stats: PlayerStats;
  history: PlayerMatch[];
  licenceAverage: number | null;
  topPct: number | null;
}) {
  const snittTrend = matchTrendPoints(history);
  const ratingTrend = rollingRatingPoints(history);
  const heroSnitt = licenceAverage ?? stats.seasonAvg ?? 0;

  return (
    <HeroDeck
      cards={[
        {
          key: 'snitt',
          label: 'Säsongssnitt',
          element: (
            <ProfileTrend
              points={snittTrend}
              label="SÄSONGSSNITT"
              restValue={heroSnitt}
              delta={stats.formDiff}
              deltaSuffix="form"
              caption={topPct != null ? `Topp ${topPct}% i ligan` : undefined}
              footerLeft={`${stats.matchesPlayed} matcher`}
              footerRight={stats.projectedAvg != null ? `Prognos ${stats.projectedAvg}` : undefined}
            />
          ),
        },
        {
          key: 'bk',
          label: 'BK-rating',
          element: (
            <ProfileTrend
              points={ratingTrend}
              label="BK-RATING"
              restValue={stats.rating}
              delta={ratingTrend.length >= 2 ? stats.rating - ratingTrend[0].avg : null}
              deltaSuffix="i år"
              caption={`${stats.tier.label}${topPct != null ? ` · Topp ${topPct}%` : ''}`}
              footerLeft="Betyg 0–100 mot fältet"
            />
          ),
        },
      ]}
    />
  );
}
