import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { formatMatchDate } from '@/lib/format';
import { teamColor, teamInitials } from '@/lib/team-identity';
import type { TopScore } from '@/lib/top-scores';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const ELITE = 900;
const BAR_H = 48;
const GAME_GOLD = 250;

// Top-series post: player avatar + name header, the total as the hero, game bars.
export function TopSerieCard({ score, onPress }: { score: TopScore; onPress?: () => void }) {
  const gold = score.total >= ELITE;
  const max = Math.max(...score.series, 1);
  const colors = teamColor(score.playerName);

  return (
    <FeedCard onPress={onPress}>
      <View style={styles.header}>
        <IdentityAvatar colors={colors} initials={teamInitials(score.playerName)} size={44} />
        <View style={styles.who}>
          <Text style={styles.name} numberOfLines={1}>{score.playerName}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {[score.division, `mot ${score.opponent}`].filter(Boolean).join('  ·  ')}
          </Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="flame" size={13} color={COLOR.gold} />
          <Text style={styles.badgeText}>TOPPSERIE</Text>
        </View>
      </View>

      <View style={styles.heroRow}>
        <Text style={[styles.total, gold && styles.totalGold]}>{score.total}</Text>
        <Text style={styles.heroLabel}>{formatMatchDate(score.date)}</Text>
      </View>

      {score.series.length > 0 && (
        <View style={styles.bars}>
          {score.series.map((g, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={{
                    width: '100%',
                    height: Math.max(5, (g / max) * BAR_H),
                    borderRadius: 4,
                    backgroundColor: g >= GAME_GOLD ? COLOR.gold : COLOR.surface2,
                  }}
                />
              </View>
              <Text style={styles.barVal}>{g}</Text>
            </View>
          ))}
        </View>
      )}
    </FeedCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  who: { flex: 1, minWidth: 0, gap: 2 },
  name: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, letterSpacing: -0.4 },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeText: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },

  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE[4] },
  total: { color: COLOR.ink, fontSize: 68, fontFamily: FONT.display, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  totalGold: { color: COLOR.gold },
  heroLabel: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },

  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACE[4] },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: '100%', height: BAR_H, justifyContent: 'flex-end' },
  barVal: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
});
