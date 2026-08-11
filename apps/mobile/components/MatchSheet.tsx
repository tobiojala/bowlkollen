import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { GlassSheet } from '@/components/GlassSheet';
import { formatMatchDate } from '@/lib/format';
import type { PlayerMatch } from '@/lib/player-stats';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Per-match breakdown (ported from the web MatchSheet). Our player history has the
// per-game series + total, but not the team W/L result — so the hero is the
// player's total and the footer is the match's snitt vs the season.
export function MatchSheet({ match, seasonAvg, onClose }: { match: PlayerMatch | null; seasonAvg: number | null; onClose: () => void }) {
  const games = (match?.series ?? []).filter((g) => g > 0);
  const total = match?.total_result ?? games.reduce((a, b) => a + b, 0);
  const avg = games.length ? Math.round(total / games.length) : 0;
  const delta = seasonAvg != null ? avg - seasonAvg : 0;
  const up = delta >= 0;

  const scoreStyle = (g: number) =>
    g >= 250 ? { color: COLOR.gold, fontFamily: FONT.scoreHeavy }
      : g >= 200 ? { color: COLOR.ink, fontFamily: FONT.score }
        : { color: COLOR.ink3, fontFamily: FONT.scoreSemi };

  return (
    <GlassSheet visible={match != null} onClose={onClose} title={match ? `vs ${match.opponent_name ?? '—'}` : ''}>
      {match && (
        <View style={{ paddingBottom: SPACE[6] }}>
          <Text style={styles.subtitle} numberOfLines={1}>
            {[formatMatchDate(match.match_date), match.division_name, match.is_home_team == null ? null : match.is_home_team ? 'Hemma' : 'Borta']
              .filter(Boolean)
              .join('  ·  ')}
          </Text>

          <View style={styles.heroRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{match.is_home_team === false ? 'Borta' : 'Hemma'}</Text>
            </View>
            <View style={styles.totalWrap}>
              <Text style={[styles.total, { color: seasonAvg != null && avg >= seasonAvg ? COLOR.ink : COLOR.ink2 }]}>{total}</Text>
              <Text style={styles.totalLabel}>totalt</Text>
            </View>
          </View>

          <View style={styles.scores}>
            {games.map((g, i) => (
              <View key={i} style={styles.scoreCol}>
                <Text style={[styles.score, scoreStyle(g)]}>{g}</Text>
                <Text style={styles.scoreLabel}>Spel {i + 1}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footLabel}>Matchsnitt {avg}</Text>
            {seasonAvg != null && (
              <View style={styles.trend}>
                <Ionicons name={up ? 'trending-up' : 'trending-down'} size={16} color={up ? COLOR.green : COLOR.red} />
                <Text style={[styles.trendText, { color: up ? COLOR.green : COLOR.red }]}>
                  {up ? `+${delta}` : delta}p vs snitt
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginBottom: SPACE[6] },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE[6] },
  chip: { paddingHorizontal: SPACE[4], paddingVertical: SPACE[2], borderRadius: RADIUS.pill, backgroundColor: COLOR.surface },
  chipText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.bold },
  totalWrap: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE[2] },
  total: { fontSize: 34, fontFamily: FONT.scoreHeavy, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  totalLabel: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  scores: { flexDirection: 'row', gap: SPACE[3], marginBottom: SPACE[6] },
  scoreCol: { flex: 1, alignItems: 'center' },
  score: { fontSize: 32, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  scoreLabel: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: SPACE[1] },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACE[4], borderTopWidth: 1, borderTopColor: COLOR.hairline },
  footLabel: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  trend: { flexDirection: 'row', alignItems: 'center', gap: SPACE[1] },
  trendText: { fontSize: TYPE.caption, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
});
