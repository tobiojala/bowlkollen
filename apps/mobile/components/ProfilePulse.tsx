import { StyleSheet, View } from 'react-native';

import { ProfileTrend } from '@/components/ProfileTrend';
import { matchTrendPoints, type PlayerMatch } from '@/lib/player-stats';
import { SPACE } from '@/theme';

// PROFIL-PULS — snitt match för match. The raw per-match average (jagged like an
// EKG trace, so it shows how streaky vs steady a season was), distinct from the
// smooth hero curves.
export function ProfilePulse({ history, seasonAvg, onInfo }: { history: PlayerMatch[]; seasonAvg: number | null; onInfo?: () => void }) {
  const points = matchTrendPoints(history);
  if (points.length < 2) return null;
  const avgs = points.map((p) => p.avg);

  return (
    <View style={styles.section}>
      <ProfileTrend
        points={points}
        label="PROFIL-PULS"
        caption="Snitt match för match"
        baseline={seasonAvg}
        baselineLabel="matchsnitt"
        onInfo={onInfo}
        footerLeft={`Lägst ${Math.min(...avgs)}`}
        footerRight={`Högst ${Math.max(...avgs)}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
});
