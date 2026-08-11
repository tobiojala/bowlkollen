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
const INSET = SPACE[4];
const TAIL = 5;
const GLIDE = 60;

type Props = {
  points: TrendPoint[];
  label?: string;         // uppercase kicker, e.g. "SÄSONGSSNITT"
  restValue?: number;     // the big number when idle (official metric); defaults to latest point
  delta?: number | null;  // season change shown as a green/red chip
  deltaSuffix?: string;   // e.g. "form", "i år"
  caption?: string;       // secondary line when idle
  footerLeft?: string;
  footerRight?: string;
};

// Season trend hero card. Big ink number (the metric) + green/red delta; the line
// rests dim and, on drag, a directional light-tail ignites behind the finger while
// the number/caption become that match. Accent green/red vs the season's first point.
export function ProfileTrend({ points, label, restValue, delta, deltaSuffix, caption, footerLeft, footerRight }: Props) {
  const { width } = useWindowDimensions();
  const W = width - SIDE * 2 - INSET * 2;
  const n = points.length;
  const hasGraph = n >= 2;

  const prev = useRef(n - 1);
  const [st, setSt] = useState({ active: Math.max(0, n - 1), dir: 1, dragging: false });
  const { active, dir, dragging } = st;

  const avgs = points.map((p) => p.avg);
  const lo = avgs.length ? Math.min(...avgs) - 4 : 0;
  const hi = avgs.length ? Math.max(...avgs) + 4 : 1;
  const span = hi - lo || 1;
  const innerW = W - PADX * 2;
  const xs = points.map((_, i) => PADX + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW));
  const ys = points.map((p) => PADY + (1 - (p.avg - lo) / span) * (GH - PADY * 2));
  const linePath = xs.map((x, i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');

  const up = hasGraph ? points[active].avg >= points[0].avg : true;
  const accent = up ? COLOR.green : COLOR.red;

  const tailStart = Math.max(0, Math.min(n - 1, active - dir * TAIL));
  const [a, b] = tailStart <= active ? [tailStart, active] : [active, tailStart];
  const tailPath = xs.slice(a, b + 1).map((x, i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${ys[a + i].toFixed(1)}`).join(' ');

  const tx = xs[active] ?? 0;
  const ty = ys[active] ?? 0;
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
    .onStart((e) => runOnJS(scrub)(Math.round(Math.max(0, Math.min(1, (e.x - PADX) / innerW)) * (n - 1)), lastDir.value))
    .onUpdate((e) => {
      const i = Math.round(Math.max(0, Math.min(1, (e.x - PADX) / innerW)) * (n - 1));
      if (Math.abs(e.velocityX) > 20) lastDir.value = e.velocityX > 0 ? 1 : -1;
      runOnJS(scrub)(i, lastDir.value);
    })
    .onFinalize(() => runOnJS(release)());

  // Readout — big number is the metric when idle, the scrubbed match when dragging.
  const bigValue = dragging && hasGraph ? points[active].avg : restValue ?? points[active]?.avg ?? 0;
  const subLine = dragging && hasGraph
    ? `${formatMatchDate(points[active].date)}${points[active].label ? ` · mot ${points[active].label}` : ''}`
    : caption;
  const showDelta = !dragging && delta != null && delta !== 0;

  return (
    <View>
      <View style={styles.readout}>
        {label ? <Text style={styles.kicker}>{label}</Text> : null}
        <View style={styles.valueRow}>
          <Text style={styles.value}>{bigValue}</Text>
          {showDelta ? (
            <Text style={[styles.delta, { color: delta! > 0 ? COLOR.green : COLOR.red }]}>
              {delta! > 0 ? `↑ +${delta}` : `↓ ${Math.abs(delta!)}`}
              {deltaSuffix ? ` ${deltaSuffix}` : ''}
            </Text>
          ) : null}
        </View>
        {subLine ? <Text style={styles.sub} numberOfLines={1}>{subLine}</Text> : null}
      </View>

      {hasGraph ? (
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

              <Path d={linePath} fill="none" stroke={COLOR.ink4} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

              {dragging && a !== b && (
                <>
                  <Path d={tailPath} fill="none" stroke={accent} strokeOpacity={0.18} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d={tailPath} fill="none" stroke="url(#tail)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}

              {dragging && <AnimatedLine animatedProps={vline} y1={PADY - 12} y2={GH} stroke={COLOR.ink3} strokeWidth={1} />}

              <AnimatedCircle animatedProps={dot} r={dragging ? 20 : 0} fill={accent} opacity={0.12} />
              <AnimatedCircle animatedProps={dot} r={5.5} fill={accent} />
              <AnimatedCircle animatedProps={dot} r={2.2} fill={COLOR.bg} />
            </Svg>
          </View>
        </GestureDetector>
      ) : (
        <View style={styles.empty}><Text style={styles.emptyText}>Kurva visas när du spelat fler matcher</Text></View>
      )}

      {(footerLeft || footerRight) && (
        <View style={styles.footer}>
          <Text style={styles.footText}>{footerLeft}</Text>
          {footerRight ? <Text style={styles.footText}>{footerRight}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { marginBottom: SPACE[3], paddingHorizontal: INSET },
  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACE[1] },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE[3] },
  value: { color: COLOR.ink, fontSize: TYPE.hero, fontFamily: FONT.scoreHeavy, letterSpacing: -3, fontVariant: ['tabular-nums'] },
  delta: { fontSize: TYPE.caption, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  sub: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold, marginTop: SPACE[1] },
  empty: { height: GH, alignItems: 'center', justifyContent: 'center', paddingHorizontal: INSET },
  emptyText: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACE[2], paddingHorizontal: INSET },
  footText: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, fontVariant: ['tabular-nums'] },
});
