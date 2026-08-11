import { StyleSheet, Text, View } from 'react-native';

import { FormCurve } from '@/components/FormCurve';
import type { PlayerStats } from '@/lib/player-stats';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Season analysis: a plain-language narrative, the headline numbers, and the
// form curve — all derived from the match history.
export function PlayerSeason({ firstName, stats }: { firstName: string; stats: PlayerStats }) {
  const { seasonAvg, matchesPlayed, bestSeries, bestGame, games200, matchAvgs, formDiff, projectedAvg } = stats;
  if (matchesPlayed === 0) return null;

  const trend =
    formDiff == null || formDiff === 0
      ? null
      : formDiff > 0
        ? { word: 'stigande', color: COLOR.green }
        : { word: 'fallande', color: COLOR.red };

  const proj =
    projectedAvg == null || seasonAvg == null || projectedAvg === seasonAvg
      ? null
      : { color: projectedAvg > seasonAvg ? COLOR.green : COLOR.red, arrow: projectedAvg > seasonAvg ? '↑' : '↓' };

  return (
    <View style={styles.section}>
      <Text style={styles.label}>SÄSONG</Text>

      {seasonAvg != null && (
        <Text style={styles.narrative}>
          {firstName} snittar <Text style={styles.strong}>{seasonAvg}</Text> över {matchesPlayed}{' '}
          {matchesPlayed === 1 ? 'match' : 'matcher'}
          {bestGame ? `, högsta spel ${bestGame}` : ''}.
          {trend && (
            <Text>
              {' '}Formen är <Text style={{ color: trend.color, fontFamily: FONT.semibold }}>{trend.word}</Text>.
            </Text>
          )}
        </Text>
      )}

      {projectedAvg != null && (
        <View style={styles.prognos}>
          <Text style={styles.prognosLabel}>PROGNOS</Text>
          <Text style={styles.prognosValue}>
            ~{projectedAvg}
            {proj && <Text style={{ color: proj.color }}> {proj.arrow}</Text>}
          </Text>
          <Text style={styles.prognosHint}>snitt om formen håller</Text>
        </View>
      )}

      <View style={styles.grid}>
        <Mini label="MATCHER" value={String(matchesPlayed)} />
        <Mini label="BÄSTA SERIE" value={bestSeries != null ? String(bestSeries) : '–'} />
        <Mini label="HÖGSTA SPEL" value={bestGame != null ? String(bestGame) : '–'} />
        <Mini label="200+" value={String(games200)} />
      </View>

      {matchAvgs.length > 2 && (
        <>
          <Text style={styles.curveLabel}>FORMKURVA</Text>
          <FormCurve values={matchAvgs} avg={seasonAvg} />
        </>
      )}
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  narrative: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.regular, lineHeight: 23 },
  strong: { color: COLOR.ink, fontFamily: FONT.bold },
  prognos: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE[2], marginTop: SPACE[4] },
  prognosLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  prognosValue: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.score },
  prognosHint: { color: COLOR.ink3, fontSize: TYPE.caption },
  grid: { flexDirection: 'row', gap: SPACE[2], marginTop: SPACE[4] },
  mini: {
    flex: 1,
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[3],
    alignItems: 'center',
    gap: 2,
  },
  miniValue: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.score },
  miniLabel: { color: COLOR.ink3, fontSize: TYPE.micro, fontFamily: FONT.bold, letterSpacing: 0.5 },
  curveLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginTop: SPACE[6],
    marginBottom: SPACE[2],
  },
});
