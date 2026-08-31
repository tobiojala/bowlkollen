import { StyleSheet, Text, View } from 'react-native';

import { SERIE_BAR, serieBarHeight, serieBarLevel, type SerieBarLevel } from '@bowlkollen/core';
import { COLOR, FONT, TYPE } from '@/theme';

const LABEL_MAX = 12; // hide per-bar labels beyond this many games

// Canonical serie graph — ONE bar language for every card that graphs a series
// (home feed, matchlogg, story). Absolute heights + colour tiers come from
// @bowlkollen/core so web + native can't drift; gold is reserved for a genuine
// high game (>= 250) to keep the gold budget tight.
export function SerieBars({ series, showLabels = true }: { series: number[]; showLabels?: boolean }) {
  if (series.length === 0) return null;
  const n = series.length;
  const labels = showLabels && n <= LABEL_MAX;
  const gap = n > 8 ? 5 : 8;

  const barColor = (lvl: SerieBarLevel) =>
    lvl === 'gold' ? COLOR.gold : lvl === 'strong' ? COLOR.ink2 : lvl === 'mid' ? COLOR.ink3 : COLOR.ink4;

  return (
    <View style={[styles.row, { gap }]}>
      {series.map((g, i) => {
        const lvl = serieBarLevel(g);
        const gold = lvl === 'gold';
        return (
          <View key={i} style={styles.col}>
            <View style={styles.track}>
              <View style={[styles.bar, { height: serieBarHeight(g), backgroundColor: barColor(lvl) }, gold && styles.glow]} />
            </View>
            {labels && <Text style={[styles.val, gold && styles.valGold]} numberOfLines={1}>{g}</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'stretch', gap: 7 },
  track: { height: SERIE_BAR.H, justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  glow: { shadowColor: COLOR.gold, shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  val: { textAlign: 'center', color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  valGold: { color: COLOR.gold },
});
