import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { formatMatchDate } from '@/lib/format';
import type { TrendPoint } from '@/lib/player-stats';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const GH = 190;
const PADX = 26; // ≥ the head glow radius so it never clips at the first/last match
const PADY = 30;
const SIDE = SPACE[6];
const INSET = SPACE[4]; // horizontal inset — keeps the width we settled on
const TAIL = 5;         // matches the light-tail spans behind the finger
const GLIDE = 60;       // ms — softens the per-match jump without going floaty

// The season match-average trend. Line rests dim; on drag a directional light-tail
// ignites behind the finger (drag right → glow trails left, drag left → trails
// right), a vertical indicator + bright head dot track the finger, and the readout
// shows that match. Accent green/red vs the season's first match. Latest on release.
export function ProfileTrend({ points }: { points: TrendPoint[] }) {
  const { width } = useWindowDimensions();
  const W = width - SIDE * 2 - INSET * 2;
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

  // Smooth glide of the indicator + head dot over the per-match jumps.
  const tx = xs[active];
  const ty = ys[active];
  const gx = useSharedValue(tx);
  const gy = useSharedValue(ty);
  const lastDir = useSharedValue(1);
  useEffect(() => {
    gx.value = withTiming(tx, { duration: GLIDE });
    gy.value = withTiming(ty, { duration: GLIDE });
  }, [tx, ty, gx, gy]);
  const dot = useAnimatedProps(() => ({ cx: gx.value, cy: gy.value }));
  const vline = useAnimatedProps(() => ({ x1: gx.value, x2: gx.value }));

  const scrub = (i: number, d: number) => {
    prev.current = i;
    setSt({ active: i, dir: d, dragging: true });
  };
  const release = () => {
    prev.current = n - 1;
    setSt((s) => ({ ...s, active: n - 1, dragging: false }));
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart((e) => {
      const i = Math.round(Math.max(0, Math.min(1, (e.x - PADX) / innerW)) * (n - 1));
      runOnJS(scrub)(i, lastDir.value);
    })
    .onUpdate((e) => {
      const i = Math.round(Math.max(0, Math.min(1, (e.x - PADX) / innerW)) * (n - 1));
      if (Math.abs(e.velocityX) > 20) lastDir.value = e.velocityX > 0 ? 1 : -1; // tail follows finger motion
      runOnJS(scrub)(i, lastDir.value);
    })
    .onFinalize(() => runOnJS(release)());

  return (
    <View>
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
              <LinearGradient id="tail" gradientUnits="userSpaceOnUse"
                x1={xs[tailStart]} y1={ys[tailStart]} x2={xs[active]} y2={ys[active]}>
                <Stop offset="0" stopColor={accent} stopOpacity={0} />
                <Stop offset="1" stopColor={accent} stopOpacity={1} />
              </LinearGradient>
            </Defs>

            {/* dim resting line */}
            <Path d={linePath} fill="none" stroke={COLOR.ink4} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {dragging && a !== b && (
              <>
                <Path d={tailPath} fill="none" stroke={accent} strokeOpacity={0.18} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                <Path d={tailPath} fill="none" stroke="url(#tail)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}

            {/* vertical drag indicator */}
            {dragging && <AnimatedLine animatedProps={vline} y1={PADY - 12} y2={GH} stroke={COLOR.ink3} strokeWidth={1} />}

            {/* head dot */}
            <AnimatedCircle animatedProps={dot} r={dragging ? 20 : 0} fill={accent} opacity={0.12} />
            <AnimatedCircle animatedProps={dot} r={5.5} fill={accent} />
            <AnimatedCircle animatedProps={dot} r={2.2} fill={COLOR.bg} />
          </Svg>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { alignItems: 'center', marginBottom: SPACE[3] },
  value: { fontSize: TYPE.hero, fontFamily: FONT.scoreHeavy, letterSpacing: -3, fontVariant: ['tabular-nums'] },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold, marginTop: 2 },
});
