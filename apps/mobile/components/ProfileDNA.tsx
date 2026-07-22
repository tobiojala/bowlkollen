import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { COLOR, FONT } from '@/theme';

// Faithful native port of the web ProfileDNA radar: aurora glow behind, a
// soft-glowing gold shape whose spokes are matches (radius = that match's
// average, min-max normalized) and whose outline brightens toward the latest
// matches. Breathes gently.
const SW = 360;
const SH = 300;
const CX = 180;
const CY = 158;
const AVATAR_R = 34;
const SPOKE_START = AVATAR_R + 6;
const rMin = 50;
const rMax = 120;

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

  // gentle breathing
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
    <Animated.View style={[{ width: '86%', alignSelf: 'center' }, animStyle]}>
      <Svg width="100%" height={SH} viewBox={`0 0 ${SW} ${SH}`}>
        <Defs>
          <RadialGradient id="dna_fill" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(245,194,0,0.22)" />
            <Stop offset="100%" stopColor="rgba(245,194,0,0.03)" />
          </RadialGradient>
          <RadialGradient id="aurora" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(245,194,0,0.16)" />
            <Stop offset="70%" stopColor="rgba(245,194,0,0)" />
          </RadialGradient>
        </Defs>

        {/* aurora glow behind everything */}
        <Ellipse cx={CX} cy={CY} rx={168} ry={128} fill="url(#aurora)" />

        {/* ring guides */}
        {[rMin, rMin + (rMax - rMin) * 0.5, rMax].map((r) => (
          <Circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="rgba(244,245,247,0.06)" strokeWidth={1} />
        ))}

        {/* spoke lines (start outside the avatar) */}
        {spokes.map((p, i) => (
          <Line
            key={`l${i}`}
            x1={CX + SPOKE_START * Math.cos(p.angle)}
            y1={CY + SPOKE_START * Math.sin(p.angle)}
            x2={p.x}
            y2={p.y}
            stroke="rgba(244,245,247,0.05)"
            strokeWidth={1}
          />
        ))}

        {/* filled shape */}
        <Path d={pathD} fill="url(#dna_fill)" />

        {/* soft outer glow of the outline (approximates the blur filter) */}
        <Path d={pathD} fill="none" stroke="rgba(245,194,0,0.28)" strokeWidth={9} strokeLinejoin="round" />

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
              stroke={`rgba(245,194,0,${op.toFixed(2)})`}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          );
        })}

        {/* spoke dots with a soft halo */}
        {spokes.map((p, i) => (
          <G key={`d${i}`}>
            <Circle cx={p.x} cy={p.y} r={7} fill="rgba(245,194,0,0.16)" />
            <Circle cx={p.x} cy={p.y} r={3.4} fill={COLOR.gold} />
          </G>
        ))}

        {/* centre avatar with a soft glow ring */}
        <Circle cx={CX} cy={CY} r={AVATAR_R + 8} fill="rgba(245,194,0,0.07)" />
        <Circle cx={CX} cy={CY} r={AVATAR_R} fill={COLOR.surface2} stroke={ringColor} strokeWidth={2} />
        <SvgText
          x={CX}
          y={CY + 6}
          fill={ringColor}
          fontSize={17}
          fontFamily={FONT.display}
          textAnchor="middle"
        >
          {initials}
        </SvgText>
      </Svg>
    </Animated.View>
  );
}
