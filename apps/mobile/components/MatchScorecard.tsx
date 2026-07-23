import { StyleSheet, Text, View } from 'react-native';

import type { ResultRow } from '@/components/TeamResults';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const shortTeam = (n: string) => (n || '').replace(/^Team\s+/i, '').slice(0, 14);

// Serie-by-serie momentum: each game's kägelpoäng per team (computed from the
// players' series), who took the serie, and the totals. Accurate from the data
// we have — no fabricated 2v2 duel outcomes.
export function MatchScorecard({
  homeTeam,
  awayTeam,
  home,
  away,
  homeBanp,
  awayBanp,
  homePins,
  awayPins,
}: {
  homeTeam: string;
  awayTeam: string;
  home: ResultRow[];
  away: ResultRow[];
  homeBanp: number | null;
  awayBanp: number | null;
  homePins: number | null;
  awayPins: number | null;
}) {
  const n = Math.max(0, ...[...home, ...away].map((r) => r.series?.length ?? 0));
  const series = Array.from({ length: n }, (_, k) => ({
    home: home.reduce((t, r) => t + (r.series?.[k] ?? 0), 0),
    away: away.reduce((t, r) => t + (r.series?.[k] ?? 0), 0),
  }));
  const wonHome = series.filter((s) => s.home > s.away).length;
  const wonAway = series.filter((s) => s.away > s.home).length;

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.team, styles.teamL]} numberOfLines={1}>{shortTeam(homeTeam)}</Text>
        <View style={styles.result}>
          <Text style={styles.banp}>
            {homeBanp ?? '–'}<Text style={styles.banpSep}> – </Text>{awayBanp ?? '–'}
          </Text>
          <Text style={styles.banpLabel}>BANPOÄNG</Text>
        </View>
        <Text style={[styles.team, styles.teamR]} numberOfLines={1}>{shortTeam(awayTeam)}</Text>
      </View>

      <Text style={styles.wonLine}>
        Serier vunna  <Text style={styles.wonStrong}>{wonHome}</Text>–<Text style={styles.wonStrong}>{wonAway}</Text>
      </Text>

      {series.map((s, k) => {
        const homeWon = s.home > s.away;
        const awayWon = s.away > s.home;
        return (
          <View key={k} style={styles.row}>
            <Text style={styles.serieLabel}>Serie {k + 1}</Text>
            <Text style={[styles.pins, homeWon ? styles.pinsWin : styles.pinsLose]}>{s.home}</Text>
            <View style={styles.bar}>
              <View style={{ flex: Math.max(1, s.home), backgroundColor: homeWon ? COLOR.green : COLOR.ink4 }} />
              <View style={styles.barGap} />
              <View style={{ flex: Math.max(1, s.away), backgroundColor: awayWon ? COLOR.green : COLOR.ink4 }} />
            </View>
            <Text style={[styles.pins, styles.pinsR, awayWon ? styles.pinsWin : styles.pinsLose]}>{s.away}</Text>
          </View>
        );
      })}

      <View style={[styles.row, styles.totalRow]}>
        <Text style={[styles.serieLabel, styles.totalLabel]}>TOTALT</Text>
        <Text style={[styles.pins, styles.totalPins]}>{homePins ?? '–'}</Text>
        <Text style={styles.kaglor}>käglor</Text>
        <Text style={[styles.pins, styles.pinsR, styles.totalPins]}>{awayPins ?? '–'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACE[2] },
  team: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  teamL: { textAlign: 'left' },
  teamR: { textAlign: 'right' },
  result: { alignItems: 'center', paddingHorizontal: SPACE[3], gap: 2 },
  banp: { color: COLOR.ink, fontSize: TYPE.title + 6, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  banpSep: { color: COLOR.ink4 },
  banpLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  wonLine: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', marginBottom: SPACE[4] },
  wonStrong: { color: COLOR.ink, fontFamily: FONT.bold },

  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderTopWidth: 1, borderTopColor: COLOR.hairline },
  serieLabel: { width: 62, color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  pins: { width: 52, color: COLOR.ink, fontSize: TYPE.body + 1, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  pinsR: { textAlign: 'right' },
  pinsWin: { color: COLOR.green },
  pinsLose: { color: COLOR.ink3 },
  bar: { flex: 1, flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden' },
  barGap: { width: 2 },

  totalRow: { borderTopWidth: 2, borderTopColor: COLOR.hairline, marginTop: SPACE[1] },
  totalLabel: { color: COLOR.ink3, fontFamily: FONT.bold, letterSpacing: 1 },
  totalPins: { color: COLOR.ink, flex: 1 },
  kaglor: { color: COLOR.ink3, fontSize: TYPE.caption },
});
