import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { formatMatchDate } from '@/lib/format';
import type { TrendPoint } from '@/lib/player-stats';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const GH = 168;      // graph height
const PADX = 8;      // keep the end dots off the edges
const PADY = 22;     // headroom top/bottom
const SIDE = SPACE[6]; // matches the profile's horizontal inset

// The Revolut "glow-drag" trend: your season match-average line with a soft area
// glow. Drag to scrub — a gliding dot + indicator line track the finger, the big
// number and date update to that match, and the accent shifts green/red vs your
// season's first match (a gain or a slump). Latest match on release.
export function ProfileTrend({ points }: { points: TrendPoint[] }) {
  const { width } = useWindowDimensions();
  const W = width - SIDE * 2;
  const n = points.length;
  const [active, setActive] = useState(n - 1);

  const geo = useMemo(() => {
    const avgs = points.map((p) => p.avg);
    const lo = Math.min(...avgs) - 4;
    const hi = Math.max(...avgs) + 4;
    const span = hi - lo || 1;
    const innerW = W - PADX * 2;
    const xs = points.map((_, i) => PADX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW));
    const ys = points.map((p) => PADY + (1 - (p.avg - lo) / span) * (GH - PADY * 2));
    const line = xs.map((x, i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
    const area = `${line} L ${xs[n - 1].toFixed(1)} ${GH} L ${xs[0].toFixed(1)} ${GH} Z`;
    return { xs, ys, line, area };
  }, [points, W, n]);

  // Accent: gain vs the season's first match (Revolut-style green/red).
  const up = points[active].avg >= points[0].avg;
  const accent = up ? COLOR.green : COLOR.red;
  const trendUp = points[n - 1].avg >= points[0].avg;
  const lineColor = trendUp ? COLOR.green : COLOR.red;

  // Animated dot / indicator glide to the active point.
  const cx = useSharedValue(geo.xs[active]);
  const cy = useSharedValue(geo.ys[active]);
  useEffect(() => {
    cx.value = withTiming(geo.xs[active], { duration: 90 });
    cy.value = withTiming(geo.ys[active], { duration: 90 });
  }, [active, geo, cx, cy]);
  const dotProps = useAnimatedProps(() => ({ cx: cx.value, cy: cy.value }));
  const lineProps = useAnimatedProps(() => ({ x1: cx.value, x2: cx.value }));
  const glowProps = useAnimatedProps(() => ({ cx: cx.value, cy: cy.value }));

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10]) // horizontal scrub only — let the profile scroll vertically
    .onUpdate((e) => {
      const p = Math.max(0, Math.min(1, (e.x - PADX) / (W - PADX * 2)));
      runOnJS(setActive)(Math.round(p * (n - 1)));
    })
    .onEnd(() => runOnJS(setActive)(n - 1));

  const gradId = 'trendfill';

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
              <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity={0.22} />
                <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={geo.area} fill={`url(#${gradId})`} />
            <Path d={geo.line} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            <AnimatedLine animatedProps={lineProps} y1={PADY - 10} y2={GH} stroke={COLOR.ink4} strokeWidth={1} />
            {/* soft radial glow — layered low-opacity circles */}
            <AnimatedCircle animatedProps={glowProps} r={22} fill={accent} opacity={0.12} />
            <AnimatedCircle animatedProps={glowProps} r={12} fill={accent} opacity={0.18} />
            <AnimatedCircle animatedProps={dotProps} r={5.5} fill={accent} />
            <AnimatedCircle animatedProps={dotProps} r={2.4} fill={COLOR.bg} />
          </Svg>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { alignItems: 'center', marginBottom: SPACE[2] },
  value: { fontSize: TYPE.hero, fontFamily: FONT.scoreHeavy, letterSpacing: -3, fontVariant: ['tabular-nums'] },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold, marginTop: 2 },
});
