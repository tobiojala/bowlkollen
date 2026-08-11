import { StyleSheet, Text, View } from 'react-native';

import {
  characterSentence, consistencyLabel, gamePositionAvgs, narrativeParagraph,
  rhythmLabel, stdDev, streaks, type PlayerMatch, type PlayerStats,
} from '@/lib/player-stats';
import { formatMatchDate } from '@/lib/format';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const ink = (a: number) => `rgba(244,245,247,${a})`;

// Season analysis, ported from the web AnalysisSection: a 2×2 Prestanda grid, a
// Spelanalys card (distribution + character + rhythm) and the season narrative.
export function PlayerAnalysis({ firstName, history, stats, lastSeasonAvg }: { firstName: string; history: PlayerMatch[]; stats: PlayerStats; lastSeasonAvg?: number | null }) {
  const { seasonAvg, hitRate, formDiff, games200: over200, bestSeries, gamesPlayed: n } = stats;
  if (seasonAvg == null || n === 0) return null;

  const sorted = [...history].sort((a, b) => a.match_date.localeCompare(b.match_date));
  const games = sorted.flatMap((h) => (h.series ?? []).filter((g) => g > 0));
  const sd = stdDev(games);
  const consistency = consistencyLabel(sd);
  const s200 = streaks(games, 200);
  const gameAvgs = gamePositionAvgs(sorted);
  const rhythm = rhythmLabel(gameAvgs);

  const seriesTots = sorted.map((h) => (h.series ?? []).filter((g) => g > 0).reduce((a, b) => a + b, 0));
  const bestIdx = seriesTots.indexOf(Math.max(...seriesTots));
  const bestMatch = sorted[bestIdx];
  const lastAvg = lastSeasonAvg ?? Math.max(0, seasonAvg - 5); // real prev-season avg, or a sensible fallback

  const character = characterSentence({ hitRate, formDiff: formDiff ?? 0, consistency, seasonAvg, bestSeries: bestSeries ?? 0 });
  const narrative = narrativeParagraph({
    firstName, seasonAvg, lastSeasonAvg: lastAvg, formDiff: formDiff ?? 0, hitRate, consistency,
    rhythmLabel: rhythm.label, bestSeries: bestSeries ?? 0, games200Plus: over200, totalGames: n,
  });

  const mn = Math.min(...games);
  const mx = Math.max(...games);
  const buckets = [
    { tone: ink(0.18), v: games.filter((g) => g < 180).length, l: 'u.180' },
    { tone: ink(0.34), v: games.filter((g) => g >= 180 && g < 200).length, l: '180–199' },
    { tone: ink(0.78), v: games.filter((g) => g >= 200 && g < 250).length, l: '200–249' },
    { tone: COLOR.gold, v: games.filter((g) => g >= 250).length, l: '250+' },
  ].filter((b) => b.v > 0);

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.header}>PRESTANDA</Text>

        <View style={styles.grid}>
          <Card label="TRÄFF">
            <Text style={styles.big}>{hitRate}%</Text>
            <View style={styles.dotWrap}>
              {games.slice(-20).map((g, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: g >= 200 ? ink(0.65) : ink(0.1) }]} />
              ))}
            </View>
            <Text style={styles.foot}>{over200} av {n} spel ≥200p</Text>
          </Card>

          <Card label="KARAKTÄR">
            <Text style={styles.word}>{consistency}</Text>
            <View style={styles.scatter}>
              <View style={styles.scatterLine} />
              {games.slice(-12).map((g, i) => (
                <View key={i} style={[styles.scatterDot, {
                  left: `${((g - mn) / (mx - mn || 1)) * 92}%`,
                  backgroundColor: g >= seasonAvg ? ink(0.55) : ink(0.16),
                }]} />
              ))}
            </View>
            <Text style={styles.foot}>±{sd}p std.avv.</Text>
          </Card>

          <Card label="BÄSTA SERIE">
            <Text style={[styles.big, { color: COLOR.gold }]}>{bestSeries ?? '–'}</Text>
            <View style={styles.serieRow}>
              {(bestMatch?.series ?? []).filter((g) => g > 0).map((g, i) => (
                <Text key={i} style={[styles.serieNum, { color: g >= 250 ? COLOR.gold : COLOR.ink2 }]}>{g}</Text>
              ))}
            </View>
            <Text style={styles.foot} numberOfLines={1}>vs {bestMatch?.opponent_name ?? '—'} · {bestMatch ? formatMatchDate(bestMatch.match_date) : ''}</Text>
          </Card>

          <Card label="200+-SVIT">
            <Text style={styles.big}>{s200.best}</Text>
            <View style={styles.barRow}>
              {Array.from({ length: Math.min(s200.best, 18) }).map((_, i) => (
                <View key={i} style={styles.streakBar} />
              ))}
            </View>
            <Text style={styles.foot}>spel i rad över 200 · nu {s200.current}</Text>
          </Card>
        </View>

        <View style={styles.analysisCard}>
          <View style={styles.distBar}>
            {buckets.map((b, i) => <View key={i} style={{ flex: b.v, backgroundColor: b.tone, minWidth: 4 }} />)}
          </View>
          <View style={styles.legend}>
            {buckets.map((b) => (
              <View key={b.l} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: b.tone }]} />
                <Text style={styles.legendLabel}>{b.l}</Text>
                <Text style={[styles.legendPct, { color: b.tone === COLOR.gold ? COLOR.gold : COLOR.ink2 }]}>{Math.round((b.v / n) * 100)}%</Text>
              </View>
            ))}
          </View>
          <Text style={styles.character}>{character}</Text>

          {gameAvgs.length >= 2 && (
            <>
              <View style={styles.hairline} />
              <View style={styles.rhythm}>
                <View style={styles.rhythmBars}>
                  {gameAvgs.map((avg, i) => {
                    const lo = Math.min(...gameAvgs);
                    const hi = Math.max(...gameAvgs);
                    const peak = avg === hi;
                    return (
                      <View key={i} style={styles.rhythmCol}>
                        <View style={{ width: 22, height: 10 + ((avg - lo) / (hi - lo || 1)) * 26, borderRadius: 4, backgroundColor: peak ? COLOR.ink : ink(0.14) }} />
                        <Text style={[styles.rhythmTick, { color: peak ? COLOR.ink2 : COLOR.ink3 }]}>S{i + 1}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.rhythmText}>
                  <Text style={styles.rhythmKicker}>RYTM</Text>
                  <Text style={styles.rhythmLabel}>{rhythm.label}</Text>
                  <Text style={styles.rhythmDetail}>{rhythm.detail}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>SÄSONGEN I KORTHET</Text>
        <View style={styles.narrative}>
          {narrative.map((s, i) => (
            <Text key={i} style={[styles.sentence, i === 0 ? styles.sentenceLead : i < 3 ? styles.sentenceBody : styles.sentenceFaint]}>{s}</Text>
          ))}
        </View>
      </View>
    </>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
  header: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[3] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] },
  card: { width: '48.5%', flexGrow: 1, backgroundColor: COLOR.surface, borderRadius: RADIUS.md, padding: SPACE[4] },
  cardLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, marginBottom: SPACE[2] },
  big: { color: COLOR.ink, fontSize: 34, fontFamily: FONT.scoreHeavy, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  word: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold },
  foot: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: SPACE[3] },
  dotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: SPACE[3] },
  dot: { width: 7, height: 7, borderRadius: 2 },
  scatter: { height: 26, marginTop: SPACE[3], justifyContent: 'center' },
  scatterLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: ink(0.08) },
  scatterDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, marginLeft: -3 },
  serieRow: { flexDirection: 'row', gap: SPACE[3], marginTop: SPACE[3] },
  serieNum: { fontSize: TYPE.caption, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  barRow: { flexDirection: 'row', gap: 3, marginTop: SPACE[3] },
  streakBar: { flex: 1, maxWidth: 8, height: 7, borderRadius: 2, backgroundColor: ink(0.4) },
  analysisCard: { backgroundColor: COLOR.surface, borderRadius: RADIUS.md, padding: SPACE[4], marginTop: SPACE[2] },
  distBar: { flexDirection: 'row', height: 8, borderRadius: 6, overflow: 'hidden', gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[4], marginTop: SPACE[3] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACE[1] },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendLabel: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  legendPct: { fontSize: TYPE.caption, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  character: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.medium, fontStyle: 'italic', lineHeight: 21, marginTop: SPACE[3] },
  hairline: { height: 1, backgroundColor: COLOR.hairline, marginVertical: SPACE[4] },
  rhythm: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4] },
  rhythmBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  rhythmCol: { alignItems: 'center', gap: SPACE[1] },
  rhythmTick: { fontSize: 13, fontFamily: FONT.semibold },
  rhythmText: { flex: 1 },
  rhythmKicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, marginBottom: 2 },
  rhythmLabel: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  rhythmDetail: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },
  narrative: { gap: SPACE[2] },
  sentence: { fontFamily: FONT.regular, lineHeight: 23 },
  sentenceLead: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.medium },
  sentenceBody: { color: COLOR.ink2, fontSize: TYPE.caption },
  sentenceFaint: { color: COLOR.ink3, fontSize: TYPE.caption },
});
