import { StyleSheet, Text, View } from 'react-native';

import { COLOR, FONT, TYPE } from '@/theme';

const H = 80;         // taller — more presence
const FLOOR = 0.10;   // a very low game still shows a small stub
const LOW = 110;      // absolute floor of the height scale…
const HIGH = 300;     // …and its ceiling — so a 150 reads shorter than a 250 in ANY series
const LABEL_MAX = 8;  // hide per-bar labels beyond this many games

// The game-by-game graph for a series. Heights are ABSOLUTE (scaled 110→300, not
// per-series min→max) so a weak game genuinely reads short and a big one reads tall,
// comparable across posts. Thin bars, ink tiers by score (no gold — kept clean).
export function SerieBars({ series }: { series: number[] }) {
  if (series.length === 0) return null;
  const n = series.length;
  const showLabels = n <= LABEL_MAX;
  const gap = n > 8 ? 5 : 8;
  // Bars widen when there are few games, thin out for many — 4 (league) isn't
  // sparse, 12 (competition) still fits the card.
  const barW = n <= 4 ? 26 : n <= 6 ? 18 : n <= 8 ? 13 : 10;

  const height = (g: number) => {
    const frac = Math.max(0, Math.min(1, (g - LOW) / (HIGH - LOW)));
    return Math.round((FLOOR + (1 - FLOOR) * frac) * H);
  };
  const color = (g: number) =>
    g >= 250 ? COLOR.ink : g >= 210 ? COLOR.ink2 : g >= 170 ? COLOR.ink3 : COLOR.ink4;

  return (
    <View style={[styles.row, { gap }]}>
      {series.map((g, i) => (
        <View key={i} style={styles.col}>
          <View style={styles.track}>
            <View style={{ width: barW, height: height(g), borderRadius: 3, backgroundColor: color(g) }} />
          </View>
          {showLabels && <Text style={styles.val} numberOfLines={1}>{g}</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  col: { flex: 1, maxWidth: 44, alignItems: 'center', gap: 7 },
  track: { height: H, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  val: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
});
