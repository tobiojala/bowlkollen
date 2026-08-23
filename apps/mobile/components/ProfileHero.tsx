import { HeroDeck } from '@/components/HeroDeck';
import { ProfileTrend } from '@/components/ProfileTrend';
import { cumulativeAvgPoints, rollingRatingPoints, type PlayerMatch, type PlayerStats } from '@/lib/player-stats';
import { COLOR } from '@/theme';

// The profile's hero deck: Säsongssnitt + BK-rating, each a big number with the
// drag-graph. Kept out of the route file to keep it under the size budget.
export function ProfileHero({
  stats,
  history,
  licenceAverage,
  topPct,
  onInfoRating,
}: {
  stats: PlayerStats;
  history: PlayerMatch[];
  licenceAverage: number | null;
  topPct: number | null;
  onInfoRating?: () => void;
}) {
  const snittTrend = cumulativeAvgPoints(history);
  const ratingTrend = rollingRatingPoints(history);
  // The curve is OUR running league-series average — never BITS' official snitt
  // (which is a broader, scalar number). Keep the curve honestly labeled as
  // "Seriesnitt" and surface the official BITS snitt separately as the caption,
  // so the two are never mistaken for the same figure.
  const seriesAvg = stats.seasonAvg ?? 0;
  const snittCaption = [
    licenceAverage != null ? `BITS-snitt ${licenceAverage}` : null,
    topPct != null ? `topp ${topPct}% i ligan` : null,
  ].filter(Boolean).join(' · ') || undefined;

  return (
    <HeroDeck
      cards={[
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
          element: (
            <ProfileTrend
              points={ratingTrend}
              label="BK-RATING"
              restValue={stats.rating}
              delta={ratingTrend.length >= 2 ? stats.rating - ratingTrend[0].avg : null}
              deltaSuffix="i år"
              caption={`${stats.tier.label}${topPct != null ? ` · Topp ${topPct}%` : ''}`}
              lineWidth={5}
              tailLength={9}
              yPad={0.05}
              onInfo={onInfoRating}
              footerLeft="Betyg 0–100 mot fältet"
            />
          ),
        },
      ]}
    />
  );
}
