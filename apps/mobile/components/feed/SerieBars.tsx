import { StyleSheet, Text, View } from 'react-native';

import { COLOR, FONT, TYPE } from '@/theme';

const H = 58; // taller than before — more presence
const FLOOR = 0.24; // shortest bar still reads
const LABEL_MAX = 7; // hide per-bar labels beyond this many games

// The game-by-game graph for a series. Adapts to any count (4 team, 6/12 for
// competitions) — bars flex to fill the width, thinner as there are more — and
// stays alive via height scaled between the low and high game + colour by tier.
export function SerieBars({ series }: { series: number[] }) {
  if (series.length === 0) return null;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  const showLabels = series.length <= LABEL_MAX;
  const gap = series.length > 8 ? 4 : series.length > 5 ? 6 : 8;

  const color = (g: number) =>
    g === max ? COLOR.gold : g >= 230 ? COLOR.ink : g >= 200 ? COLOR.ink2 : g >= 170 ? COLOR.ink3 : COLOR.ink4;

  return (
    <View style={[styles.row, { gap }]}>
      {series.map((g, i) => (
        <View key={i} style={styles.col}>
          <View style={styles.track}>
            <View
              style={{
                width: '100%',
                height: Math.round((FLOOR + (1 - FLOOR) * ((g - min) / span)) * H),
                borderRadius: 3,
                backgroundColor: color(g),
              }}
            />
          </View>
          {showLabels && <Text style={styles.val} numberOfLines={1}>{g}</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  track: { width: '100%', height: H, justifyContent: 'flex-end' },
  val: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
});
