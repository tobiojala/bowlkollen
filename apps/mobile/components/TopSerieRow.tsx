import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { formatMatchDate } from '@/lib/format';
import type { TopScore } from '@/lib/top-scores';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const ELITE = 900; // 4-game total worth a gold highlight

// A top-series highlight: the player (doorway), their total, and match context.
export function TopSerieRow({ score, onPress }: { score: TopScore; onPress?: () => void }) {
  const gold = score.total >= ELITE;
  const meta = [score.division, `mot ${score.opponent}`, formatMatchDate(score.date)]
    .filter(Boolean)
    .join('  ·  ');
  return (
    <PressableScale style={styles.row} onPress={onPress} disabled={!onPress} haptic>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>{score.playerName}</Text>
        <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
        {score.series.length > 0 && (
          <View style={styles.seriesRow}>
            {score.series.map((g, i) => (
              <Text key={i} style={styles.serie}>{g}</Text>
            ))}
          </View>
        )}
      </View>
      <Text style={[styles.total, gold && styles.totalGold]}>{score.total}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    paddingVertical: SPACE[4],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  text: { flex: 1, minWidth: 0, gap: 3 },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption },
  seriesRow: { flexDirection: 'row', gap: SPACE[3], marginTop: 2 },
  serie: { color: COLOR.ink3, fontSize: TYPE.caption, fontVariant: ['tabular-nums'] },
  total: { color: COLOR.ink, fontSize: TYPE.title + 6, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  totalGold: { color: COLOR.gold },
});
