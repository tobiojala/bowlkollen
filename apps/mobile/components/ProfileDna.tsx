import { StyleSheet, View } from 'react-native';

import { ProfileTrend } from '@/components/ProfileTrend';
import { matchTrendPoints, type PlayerMatch } from '@/lib/player-stats';
import { SPACE } from '@/theme';

// ProfileDNA — snitt match för match. The raw per-match average (jagged, so it
// shows how streaky vs steady a season was), distinct from the smooth hero curves.
export function ProfileDna({ history }: { history: PlayerMatch[] }) {
  const points = matchTrendPoints(history);
  if (points.length < 2) return null;
  const avgs = points.map((p) => p.avg);

  return (
    <View style={styles.section}>
      <ProfileTrend
        points={points}
        label="PROFIL-DNA"
        caption="Snitt match för match"
        footerLeft={`Lägst ${Math.min(...avgs)}`}
        footerRight={`Högst ${Math.max(...avgs)}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
});
