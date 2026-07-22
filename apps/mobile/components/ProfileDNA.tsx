import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { COLOR, FONT } from '@/theme';

// Native port of the web ProfileDNA radar. Each spoke is a match; radius is the
// match's average (min-max normalized). Outline brightens toward the latest
// matches. Uses solid colours + opacity props (react-native-svg renders those
// reliably; gradients were falling back to solid fills).
const GOLD = '#f5c200';
const SW = 360;
const SH = 300;
const CX = 180;
const CY = 158;
const AVATAR_R = 34;
const SPOKE_START = AVATAR_R + 6;
const rMin = 50;
const rMax = 122;

export function ProfileDNA({
  matchAvgs,
  initials,
  ringColor,
}: {
  matchAvgs: number[];
  initials: string;
  ringColor: string;
}) {
  const n = matchAvgs.length;
  const mn = Math.min(...matchAvgs);
  const mx = Math.max(...matchAvgs);

  const spokes = matchAvgs.map((avg, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const r = rMin + ((avg - mn) / (mx === mn ? 1 : mx - mn)) * (rMax - rMin);
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle), angle };
  });

  const pathD =
    spokes.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

  const breathe = useSharedValue(1);
  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1.02, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [breathe]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  return (
    <Animated.View style={[{ width: '90%', alignSelf: 'center' }, animStyle]}>
      <Svg width="100%" height={SH} viewBox={`0 0 ${SW} ${SH}`}>
        {/* soft centre glow — layered low-opacity circles (fake radial) */}
        <Circle cx={CX} cy={CY} r={118} fill={GOLD} opacity={0.025} />
        <Circle cx={CX} cy={CY} r={78} fill={GOLD} opacity={0.035} />

        {/* ring guides */}
        {[rMin, rMin + (rMax - rMin) * 0.5, rMax].map((r) => (
          <Circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke={COLOR.ink} strokeOpacity={0.06} strokeWidth={1} />
        ))}

        {/* spoke lines (start outside the avatar) */}
        {spokes.map((p, i) => (
          <Line
            key={`l${i}`}
            x1={CX + SPOKE_START * Math.cos(p.angle)}
            y1={CY + SPOKE_START * Math.sin(p.angle)}
            x2={p.x}
            y2={p.y}
            stroke={COLOR.ink}
            strokeOpacity={0.05}
            strokeWidth={1}
          />
        ))}

        {/* faint fill */}
        <Path d={pathD} fill={GOLD} fillOpacity={0.07} />

        {/* soft outer glow of the outline */}
        <Path d={pathD} fill="none" stroke={GOLD} strokeOpacity={0.22} strokeWidth={8} strokeLinejoin="round" />

        {/* crisp recency-brightened outline */}
        {spokes.map((p, i) => {
          const q = spokes[(i + 1) % n];
          const isWrap = i === n - 1;
          const t = isWrap ? 0 : (i + 1) / (n - 1);
          const op = Math.min(1, 0.3 + 0.62 * t);
          return (
            <Line
              key={`s${i}`}
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              stroke={GOLD}
              strokeOpacity={op}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          );
        })}

        {/* spoke dots with a soft halo */}
        {spokes.map((p, i) => (
          <G key={`d${i}`}>
            <Circle cx={p.x} cy={p.y} r={7} fill={GOLD} opacity={0.16} />
            <Circle cx={p.x} cy={p.y} r={3.4} fill={GOLD} />
          </G>
        ))}

        {/* centre avatar with a soft glow ring */}
        <Circle cx={CX} cy={CY} r={AVATAR_R + 8} fill={GOLD} opacity={0.06} />
        <Circle cx={CX} cy={CY} r={AVATAR_R} fill={COLOR.surface2} stroke={ringColor} strokeWidth={2} />
        <SvgText x={CX} y={CY + 6} fill={ringColor} fontSize={17} fontFamily={FONT.display} textAnchor="middle">
          {initials}
        </SvgText>
      </Svg>
    </Animated.View>
  );
}
