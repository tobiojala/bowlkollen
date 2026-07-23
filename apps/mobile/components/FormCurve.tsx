import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { COLOR } from '@/theme';

const PAD_X = 4;
const PAD_TOP = 14;
const PAD_BOTTOM = 14;

// Season form curve: per-match averages over time, min–max scaled, with the
// season average as a dashed baseline. SVG line + a soft solid area fill (no
// gradients — react-native-svg RadialGradient renders solid, so we avoid them).
export function FormCurve({
  values,
  avg,
  height = 120,
}: {
  values: number[];
  avg?: number | null;
  height?: number;
}) {
  const [width, setWidth] = useState(0);

  const n = values.length;
  const min = n ? Math.min(...values) : 0;
  const maxRaw = n ? Math.max(...values) : 1;
  const max = maxRaw === min ? min + 1 : maxRaw;

  const innerW = Math.max(0, width - PAD_X * 2);
  const innerH = height - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_X + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
  const y = (v: number) => PAD_TOP + (1 - (v - min) / (max - min)) * innerH;

  const points = values.map((v, i) => `${x(i)},${y(v)}`);
  const line = points.length ? `M${points.join(' L')}` : '';
  const area = points.length
    ? `${line} L${x(n - 1)},${height - PAD_BOTTOM} L${x(0)},${height - PAD_BOTTOM} Z`
    : '';
  const baseY = avg != null ? y(Math.min(max, Math.max(min, avg))) : null;

  return (
    <View style={[styles.wrap, { height }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && n > 1 && (
        <Svg width={width} height={height}>
          {baseY != null && (
            <Line x1={PAD_X} y1={baseY} x2={width - PAD_X} y2={baseY} stroke={COLOR.ink4} strokeWidth={1} strokeDasharray="3 4" />
          )}
          <Path d={area} fill={COLOR.gold} fillOpacity={0.1} />
          <Path d={line} stroke={COLOR.gold} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={x(n - 1)} cy={y(values[n - 1])} r={4} fill={COLOR.gold} />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
});
