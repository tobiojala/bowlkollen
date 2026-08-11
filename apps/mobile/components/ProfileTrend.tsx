import { useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { formatMatchDate } from '@/lib/format';
import type { TrendPoint } from '@/lib/player-stats';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const GH = 190;       // taller graph — more room
const PADX = 10;
const PADY = 26;
const SIDE = SPACE[6];
const CARD = SPACE[4];
const TAIL = 5;       // how many matches the light-tail spans behind the finger

// The season match-average trend. The line sits dim by rest; on drag a directional
// "light tail" ignites behind your finger (drag right → glow trails left, and vice
// versa), a bright head dot leads, and the readout counts to that match. Accent is
// green/red vs the season's first match. Snaps to latest on release.
export function ProfileTrend({ points }: { points: TrendPoint[] }) {
  const { width } = useWindowDimensions();
  const W = width - SIDE * 2 - CARD * 2;
  const n = points.length;

  const prev = useRef(n - 1);
  const [st, setSt] = useState({ active: n - 1, dir: 1, dragging: false });
  const { active, dir, dragging } = st;

  const avgs = points.map((p) => p.avg);
  const lo = Math.min(...avgs) - 4;
  const hi = Math.max(...avgs) + 4;
  const span = hi - lo || 1;
  const innerW = W - PADX * 2;
  const xs = points.map((_, i) => PADX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW));
  const ys = points.map((p) => PADY + (1 - (p.avg - lo) / span) * (GH - PADY * 2));
  const linePath = xs.map((x, i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');

  const up = points[active].avg >= points[0].avg;
  const accent = up ? COLOR.green : COLOR.red;

  // Light-tail sub-path: TAIL matches behind the finger, in the direction it came from.
  const tailStart = Math.max(0, Math.min(n - 1, active - dir * TAIL));
  const [a, b] = tailStart <= active ? [tailStart, active] : [active, tailStart];
  const tailPath = xs.slice(a, b + 1).map((x, i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${ys[a + i].toFixed(1)}`).join(' ');

  const scrub = (i: number) => {
    setSt((s) => {
      const d = i > prev.current ? 1 : i < prev.current ? -1 : s.dir;
      prev.current = i;
      return { active: i, dir: d, dragging: true };
    });
  };
  const release = () => {
    prev.current = n - 1;
    setSt((s) => ({ ...s, active: n - 1, dragging: false }));
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart((e) => runOnJS(scrub)(Math.round(Math.max(0, Math.min(1, (e.x - PADX) / innerW)) * (n - 1))))
    .onUpdate((e) => runOnJS(scrub)(Math.round(Math.max(0, Math.min(1, (e.x - PADX) / innerW)) * (n - 1))))
    .onFinalize(release);

  return (
    <View style={styles.card}>
      <View style={styles.readout}>
        <Text style={[styles.value, { color: accent }]}>{points[active].avg}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {formatMatchDate(points[active].date)}
          {points[active].label ? ` · mot ${points[active].label}` : ''}
        </Text>
      </View>

      <GestureDetector gesture={pan}>
        <View style={{ width: W, height: GH, alignSelf: 'center' }}>
          <Svg width={W} height={GH}>
            <Defs>
              <LinearGradient
                id="tail"
                gradientUnits="userSpaceOnUse"
                x1={xs[tailStart]} y1={ys[tailStart]} x2={xs[active]} y2={ys[active]}
              >
                <Stop offset="0" stopColor={accent} stopOpacity={0} />
                <Stop offset="1" stopColor={accent} stopOpacity={1} />
              </LinearGradient>
            </Defs>

            {/* dim resting line */}
            <Path d={linePath} fill="none" stroke={COLOR.ink4} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {dragging && a !== b && (
              <>
                {/* soft glow of the tail, then the bright tail */}
                <Path d={tailPath} fill="none" stroke={accent} strokeOpacity={0.18} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                <Path d={tailPath} fill="none" stroke="url(#tail)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}

            {/* head dot */}
            <Circle cx={xs[active]} cy={ys[active]} r={dragging ? 20 : 0} fill={accent} opacity={0.12} />
            <Circle cx={xs[active]} cy={ys[active]} r={5.5} fill={accent} />
            <Circle cx={xs[active]} cy={ys[active]} r={2.2} fill={COLOR.bg} />
          </Svg>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, padding: CARD, paddingBottom: SPACE[3],
  },
  readout: { alignItems: 'center', marginBottom: SPACE[3] },
  value: { fontSize: TYPE.hero, fontFamily: FONT.scoreHeavy, letterSpacing: -3, fontVariant: ['tabular-nums'] },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold, marginTop: 2 },
});
