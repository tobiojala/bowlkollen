import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { formatMatchDate } from '@/lib/format';
import type { TopScore } from '@/lib/top-scores';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const ELITE = 900;
const BAR_H = 40;
const GAME_GOLD = 250;

// A top series as a feed card: the player, their total (gold if elite), and the
// game-by-game bars. Opens the player.
export function TopSerieCard({ score, onPress }: { score: TopScore; onPress?: () => void }) {
  const gold = score.total >= ELITE;
  const max = Math.max(...score.series, 1);

  return (
    <PressableScale style={styles.card} onPress={onPress} disabled={!onPress} haptic>
      <View style={styles.top}>
        <View style={styles.badge}>
          <Ionicons name="flame" size={13} color={COLOR.gold} />
          <Text style={styles.badgeText}>TOPPSERIE</Text>
        </View>
        <Text style={styles.division} numberOfLines={1}>{score.division}</Text>
      </View>

      <View style={styles.main}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{score.playerName}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            mot {score.opponent}  ·  {formatMatchDate(score.date)}
          </Text>
        </View>
        <Text style={[styles.total, gold && styles.totalGold]}>{score.total}</Text>
      </View>

      {score.series.length > 0 && (
        <View style={styles.bars}>
          {score.series.map((g, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={{
                    width: '100%',
                    height: Math.max(4, (g / max) * BAR_H),
                    borderRadius: 3,
                    backgroundColor: g >= GAME_GOLD ? COLOR.gold : COLOR.ink4,
                  }}
                />
              </View>
              <Text style={styles.barVal}>{g}</Text>
            </View>
          ))}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.lg,
    padding: SPACE[4],
    marginBottom: SPACE[3],
    gap: SPACE[3],
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3] },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeText: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  division: { flex: 1, textAlign: 'right', color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },

  main: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  info: { flex: 1, minWidth: 0, gap: 3 },
  name: { color: COLOR.ink, fontSize: TYPE.body + 3, fontFamily: FONT.bold, letterSpacing: -0.3 },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption },
  total: { color: COLOR.ink, fontSize: TYPE.hero - 6, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  totalGold: { color: COLOR.gold },

  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACE[3] },
  barCol: { flex: 1, alignItems: 'center', gap: 5 },
  barTrack: { width: '100%', height: BAR_H, justifyContent: 'flex-end' },
  barVal: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
});
