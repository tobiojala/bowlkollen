import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { formatMatchDate } from '@/lib/format';
import type { TrendPoint } from '@/lib/player-stats';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const GH = 204;
const PAD_L = 30; // value-label gutter
const PAD_R = 34; // projection + head-glow room
const PAD_T = 24;
const PAD_B = 22; // date axis
const SIDE = SPACE[6];
const INSET = SPACE[4];
const TAIL = 5;
const GLIDE = 60;
const AXIS = 13; // grid/date label size — at the senior-legibility floor

type Props = {
  points: TrendPoint[];
  label?: string;
  restValue?: number;
  delta?: number | null;
  deltaSuffix?: string;
  caption?: string;
  footerLeft?: string;
  footerRight?: string;
  accent?: string;      // fixed metric colour (e.g. gold for snitt); omit → trend green/red
  baseline?: number | null; // dashed reference line (e.g. season average)
  baselineLabel?: string;    // what the baseline is called (source-clear), default "snitt"
  projValue?: number | null; // dashed prognos continuation past the last match
  lineWidth?: number;   // sparkline thickness
  tailLength?: number;  // matches the drag light-tail spans behind the finger
  yPad?: number;        // vertical headroom fraction — smaller = more zoomed in
};

export function ProfileTrend({
  points, label, restValue, delta, deltaSuffix, caption, footerLeft, footerRight, accent, baseline, projValue,
  lineWidth = 2.6, tailLength = TAIL, yPad = 0.18, baselineLabel = 'snitt',
}: Props) {
  const { width } = useWindowDimensions();
  const W = width - SIDE * 2 - INSET * 2;
  const n = points.length;
  const hasGraph = n >= 2;

  const prev = useRef(n - 1);
  const [st, setSt] = useState({ active: Math.max(0, n - 1), dir: 1, dragging: false });
  const { active, dir, dragging } = st;

  const avgs = points.map((p) => p.avg);
  const hasProj = projValue != null && hasGraph;
  const usableW = W - PAD_L - PAD_R;
  const dataW = hasProj ? usableW * 0.85 : usableW;

  const vals = [...avgs, ...(hasProj ? [projValue as number] : []), ...(baseline != null ? [baseline] : [])];
  const vmin = vals.length ? Math.min(...vals) : 0;
  const vmax = vals.length ? Math.max(...vals) : 1;
  const vpad = Math.max((vmax - vmin) * yPad, 2);
  const lo = vmin - vpad;
  const hi = vmax + vpad;
  const span = hi - lo || 1;
  const cy = (v: number) => PAD_T + (GH - PAD_T - PAD_B) * (1 - (v - lo) / span);
  const xs = points.map((_, i) => PAD_L + (n <= 1 ? dataW / 2 : (i / (n - 1)) * dataW));
  const ys = points.map((p) => cy(p.avg));
  const linePath = xs.map((x, i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const areaBottom = GH - PAD_B;

  // Grid: a few "nice" reference values across the data range.
  const range = Math.max(1, vmax - vmin);
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find((s) => s >= range / 4) ?? 100;
  const gridVals: number[] = [];
  for (let v = Math.ceil(vmin / step) * step; v <= vmax && gridVals.length < 6; v += step) gridVals.push(v);

  const upTrend = hasGraph ? points[active].avg >= points[0].avg : true;
  const color = accent ?? (upTrend ? COLOR.green : COLOR.red);

  const tailStart = Math.max(0, Math.min(n - 1, active - dir * tailLength));
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
    .onStart((e) => runOnJS(scrub)(Math.round(Math.max(0, Math.min(1, (e.x - PAD_L) / dataW)) * (n - 1)), lastDir.value))
    .onUpdate((e) => {
      const i = Math.round(Math.max(0, Math.min(1, (e.x - PAD_L) / dataW)) * (n - 1));
      if (Math.abs(e.velocityX) > 20) lastDir.value = e.velocityX > 0 ? 1 : -1;
      runOnJS(scrub)(i, lastDir.value);
    })
    .onFinalize(() => runOnJS(release)());

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
              {delta! > 0 ? `↑ +${delta}` : `↓ ${Math.abs(delta!)}`}{deltaSuffix ? ` ${deltaSuffix}` : ''}
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
                  <Stop offset="0" stopColor={color} stopOpacity={0} />
                  <Stop offset="1" stopColor={color} stopOpacity={1} />
                </LinearGradient>
              </Defs>

              {/* gridlines + value labels */}
              {gridVals.map((v) => (
                <Line key={`g${v}`} x1={PAD_L} y1={cy(v)} x2={W - PAD_R} y2={cy(v)} stroke={COLOR.ink} strokeOpacity={0.05} strokeWidth={1} />
              ))}
              {gridVals.map((v) => (
                <SvgText key={`t${v}`} x={PAD_L - 6} y={cy(v) + 4} fill={COLOR.ink2} fontSize={AXIS} fontFamily={FONT.semibold} textAnchor="end">{v}</SvgText>
              ))}

              {/* season-average reference */}
              {baseline != null && (
                <>
                  <Line x1={PAD_L} y1={cy(baseline)} x2={xs[n - 1]} y2={cy(baseline)} stroke={COLOR.ink3} strokeWidth={1} strokeDasharray="4,3" />
                  {/* label top-left so it clears the sparkline and the prognos on the right */}
                  <SvgText x={PAD_L} y={PAD_T - 8} fill={COLOR.ink3} fontSize={AXIS} fontFamily={FONT.bold}>{baselineLabel} {baseline}</SvgText>
                </>
              )}

              {/* one-colour sparkline, no fill */}
              <Path d={linePath} fill="none" stroke={COLOR.ink2} strokeWidth={lineWidth} strokeLinecap="round" strokeLinejoin="round" />

              {/* prognos continuation */}
              {hasProj && (
                <>
                  <Line x1={xs[n - 1]} y1={PAD_T} x2={xs[n - 1]} y2={areaBottom} stroke={COLOR.ink} strokeOpacity={0.06} strokeWidth={1} />
                  <Path d={`M ${xs[n - 1].toFixed(1)} ${ys[n - 1].toFixed(1)} L ${(W - PAD_R).toFixed(1)} ${cy(projValue as number).toFixed(1)}`}
                    fill="none" stroke={COLOR.ink3} strokeWidth={1.6} strokeDasharray="4,3" strokeLinecap="round" />
                  <Circle cx={W - PAD_R} cy={cy(projValue as number)} r={3} fill={color} opacity={0.7} />
                  <SvgText x={W - PAD_R} y={cy(projValue as number) - 6} fill={COLOR.ink3} fontSize={AXIS} fontFamily={FONT.bold} textAnchor="end">{projValue}</SvgText>
                </>
              )}

              {/* drag light-tail */}
              {dragging && a !== b && (
                <>
                  <Path d={tailPath} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={lineWidth + 6} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d={tailPath} fill="none" stroke="url(#tail)" strokeWidth={lineWidth + 1} strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}

              {dragging && <AnimatedLine animatedProps={vline} y1={PAD_T - 10} y2={areaBottom} stroke={COLOR.ink3} strokeWidth={1} />}

              {/* head dot */}
              <AnimatedCircle animatedProps={dot} r={dragging ? 22 : 0} fill={color} opacity={0.12} />
              <AnimatedCircle animatedProps={dot} r={5} fill={color} stroke={color} strokeOpacity={0.22} strokeWidth={6} />
              <AnimatedCircle animatedProps={dot} r={5} fill={color} />
              <AnimatedCircle animatedProps={dot} r={2} fill={COLOR.bg} />

              {/* time axis */}
              <SvgText x={PAD_L} y={GH - 6} fill={COLOR.ink3} fontSize={AXIS} fontFamily={FONT.medium}>{formatMatchDate(points[0].date)}</SvgText>
              <SvgText x={PAD_L + dataW} y={GH - 6} fill={COLOR.ink3} fontSize={AXIS} fontFamily={FONT.medium} textAnchor="end">{formatMatchDate(points[n - 1].date)}</SvgText>
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
