import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import type { TierInfo } from '@/lib/player-stats';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// BK-rating hero: the score, the tier, and how high it sits — tap for how it's
// worked out.
export function PlayerRating({
  rating,
  tier,
  topPct,
  onInfo,
}: {
  rating: number;
  tier: TierInfo;
  topPct: number | null;
  onInfo: () => void;
}) {
  return (
    <PressableScale style={styles.card} onPress={onInfo} accessibilityLabel="BK-rating, visa förklaring">
      <View style={styles.left}>
        <Text style={styles.rating}>{rating}</Text>
        <View style={[styles.tier, { borderColor: tier.accent }]}>
          <Text style={[styles.tierText, { color: tier.accent }]}>{tier.label}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.topline}>
          <Text style={styles.kicker}>BK-RATING</Text>
          <Ionicons name="information-circle-outline" size={18} color={COLOR.ink3} />
        </View>
        {topPct != null && <Text style={styles.top}>Topp {topPct}% i landet</Text>}
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(100, rating)}%`, backgroundColor: tier.accent }]} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[4],
    marginTop: SPACE[6],
    padding: SPACE[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLOR.surface,
  },
  left: { alignItems: 'center', gap: SPACE[2] },
  rating: { color: COLOR.ink, fontSize: 48, fontFamily: FONT.display, letterSpacing: -1 },
  tier: {
    paddingHorizontal: SPACE[3],
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  tierText: { fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  right: { flex: 1, gap: SPACE[2] },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  top: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  track: { height: 6, borderRadius: 3, backgroundColor: COLOR.surface2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
