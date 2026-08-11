import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { GlassSheet } from '@/components/GlassSheet';
import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const H = 120;
const PAD_L = 30;
const PAD_R = 40;
const PAD_T = 14;
const PAD_B = 22;

const mean = (a: number[]) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);

// Säsongsduell — this season's per-match snitt overlaid on last season's. Ported
// from the web DuellSheet; lines are ink (solid = i år, dashed = förra) so gold
// stays off, and the improvement delta carries the green/red.
export function Duell({ thisAvgs, lastAvgs, firstDate, lastDate }: {
  thisAvgs: number[]; lastAvgs: number[]; firstDate?: string; lastDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [w, setW] = useState(0);
  if (thisAvgs.length < 2 || lastAvgs.length < 2) return null;

  const thisAvg = mean(thisAvgs);
  const lastAvg = mean(lastAvgs);
  const diff = thisAvg - lastAvg;
  const up = diff >= 0;
  const dColor = up ? COLOR.green : COLOR.red;

  const all = [...thisAvgs, ...lastAvgs];
  const mn = Math.floor(Math.min(...all) / 10) * 10 - 5;
  const mx = Math.ceil(Math.max(...all) / 10) * 10 + 5;
  const iW = w - PAD_L - PAD_R;
  const cy = (v: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - (v - mn) / (mx - mn || 1));
  const path = (avgs: number[]) =>
    avgs.map((v, i) => `${i ? 'L' : 'M'} ${(PAD_L + (i / (avgs.length - 1)) * iW).toFixed(1)} ${cy(v).toFixed(1)}`).join(' ');
  const endX = (avgs: number[]) => PAD_L + iW;

  return (
    <>
      <PressableScale style={styles.card} onPress={() => setOpen(true)} accessibilityLabel="Säsongsduell">
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>SÄSONGSDUELL</Text>
          <Text style={styles.cardSub}>Den här säsongen mot förra</Text>
        </View>
        <Text style={[styles.cardDelta, { color: dColor }]}>{up ? `+${diff}` : diff}</Text>
        <Ionicons name="chevron-forward" size={22} color={COLOR.ink3} />
      </PressableScale>

      <GlassSheet visible={open} onClose={() => setOpen(false)} title="Säsongsduell">
        <Text style={styles.subtitle}>Den här säsongen mot förra</Text>
        <View style={styles.hero}>
          <Text style={[styles.heroNum, { color: dColor }]}>{up ? `+${diff}` : diff}</Text>
          <Text style={styles.heroText}>{up ? 'poäng bättre snitt än förra säsongen' : 'poäng lägre snitt än förra säsongen'}</Text>
        </View>

        <View style={{ height: H }} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
          {w > 0 && (
            <Svg width={w} height={H}>
              <Path d={path(lastAvgs)} fill="none" stroke={COLOR.ink3} strokeWidth={1.5} strokeDasharray="5,3" strokeLinecap="round" />
              <Path d={path(thisAvgs)} fill="none" stroke={COLOR.ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx={endX(lastAvgs)} cy={cy(lastAvgs[lastAvgs.length - 1])} r={3} fill={COLOR.ink3} />
              <Circle cx={endX(thisAvgs)} cy={cy(thisAvgs[thisAvgs.length - 1])} r={5} fill={COLOR.ink} stroke={COLOR.ink} strokeOpacity={0.22} strokeWidth={5} />
              <SvgText x={endX(thisAvgs) + 5} y={cy(thisAvgs[thisAvgs.length - 1]) + 4} fill={COLOR.ink2} fontSize={12} fontFamily={FONT.bold}>i år</SvgText>
              <SvgText x={endX(lastAvgs) + 5} y={cy(lastAvgs[lastAvgs.length - 1]) + 4} fill={COLOR.ink3} fontSize={12} fontFamily={FONT.medium}>förra</SvgText>
              {firstDate && <SvgText x={PAD_L} y={H - 4} fill={COLOR.ink3} fontSize={12} fontFamily={FONT.medium}>{firstDate}</SvgText>}
              {lastDate && <SvgText x={PAD_L + iW} y={H - 4} fill={COLOR.ink3} fontSize={12} fontFamily={FONT.medium} textAnchor="end">{lastDate}</SvgText>}
            </Svg>
          )}
        </View>

        <View style={styles.summary}>
          <View style={styles.col}>
            <Text style={styles.colNum}>{thisAvg}</Text>
            <Text style={styles.colLabel}>Denna säsong</Text>
          </View>
          <View style={styles.colMid}>
            <Ionicons name={up ? 'trending-up' : 'trending-down'} size={16} color={dColor} />
            <Text style={[styles.colDelta, { color: dColor }]}>{up ? `+${diff}` : diff}</Text>
          </View>
          <View style={styles.col}>
            <Text style={[styles.colNum, { color: COLOR.ink3 }]}>{lastAvg}</Text>
            <Text style={styles.colLabel}>Förra säsongen</Text>
          </View>
        </View>
      </GlassSheet>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[6],
    backgroundColor: COLOR.surface, borderRadius: RADIUS.md, paddingVertical: SPACE[4], paddingHorizontal: SPACE[4],
  },
  cardLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  cardSub: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },
  cardDelta: { fontSize: TYPE.title, fontFamily: FONT.scoreHeavy, fontVariant: ['tabular-nums'] },
  subtitle: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginBottom: SPACE[4] },
  hero: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE[3], marginBottom: SPACE[4] },
  heroNum: { fontSize: 40, fontFamily: FONT.scoreHeavy, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  heroText: { flex: 1, color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  summary: { flexDirection: 'row', marginTop: SPACE[4], paddingTop: SPACE[4], borderTopWidth: 1, borderTopColor: COLOR.hairline },
  col: { flex: 1, alignItems: 'center' },
  colMid: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE[1] },
  colNum: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.scoreHeavy, fontVariant: ['tabular-nums'] },
  colLabel: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: SPACE[1] },
  colDelta: { fontSize: TYPE.body, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
});
