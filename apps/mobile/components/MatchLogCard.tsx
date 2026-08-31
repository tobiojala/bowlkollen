import { StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { formatMatchDate } from '@/lib/format';
import type { PlayerMatch } from '@/lib/player-stats';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// One match in the log — series as mini bars (best game in gold), then total +
// snitt + högsta in a footer. Web parity (FeedSection Matchlogg, design B).
export function MatchLogCard({ match, onPress }: { match: PlayerMatch; onPress: () => void }) {
  const series = match.series ?? [];
  const hasSeries = series.length > 0;
  const total = match.total_result ?? series.reduce((a, b) => a + b, 0);
  const high = hasSeries ? Math.max(...series) : 0;
  const lo = hasSeries ? Math.min(...series) : 0;
  const span = Math.max(1, high - lo + 40);
  const avg = hasSeries ? Math.round(total / series.length) : null;
  const opp = match.opponent_name ?? 'Motståndare';

  return (
    <PressableScale style={styles.card} onPress={onPress}>
      <View style={styles.top}>
        <IdentityAvatar colors={teamColor(opp)} initials={teamInitials(opp)} size={38} />
        <Text style={styles.opp} numberOfLines={1}>{opp}</Text>
        <Text style={styles.when} numberOfLines={1}>
          {match.is_home_team ? 'hemma' : 'borta'} · {formatMatchDate(match.match_date)}
        </Text>
      </View>

      {hasSeries && (
        <View style={styles.series}>
          {series.map((g, i) => {
            const best = g === high;
            return (
              <View key={i} style={styles.cell}>
                <View style={[styles.bar, { height: 26 + ((g - lo + 20) / span) * 54 }, best && styles.barHi]} />
                <Text style={[styles.sv, best && styles.svHi]}>{g}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.foot}>
        <Text style={styles.total}>{total}</Text>
        <Text style={styles.sub}>
          {avg != null ? `⌀ ${avg} snitt · ` : ''}högsta <Text style={styles.hi}>{high || total}</Text>
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLOR.surface, borderRadius: 16, padding: SPACE[4], gap: SPACE[3] },
  top: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  opp: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold, letterSpacing: -0.2 },
  when: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, flexShrink: 0 },

  series: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  cell: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { width: '100%', borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: COLOR.surface2 },
  barHi: { backgroundColor: COLOR.gold },
  sv: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.scoreSemi, fontVariant: ['tabular-nums'] },
  svHi: { color: COLOR.gold },

  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    borderTopWidth: 1, borderTopColor: COLOR.hairline, paddingTop: SPACE[3] },
  total: { color: COLOR.ink, fontSize: 23, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption },
  hi: { color: COLOR.gold, fontFamily: FONT.scoreSemi },
});
