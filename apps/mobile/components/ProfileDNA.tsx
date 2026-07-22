import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { COLOR, FONT } from '@/theme';

// Native port of the web ProfileDNA radar. Each spoke is a match; radius is the
// match's average (min-max normalized). The outline brightens toward the latest
// matches (recency gradient) so a rising player shows a bright, swollen edge.
const SW = 360;
const SH = 300;
const CX = 180;
const CY = 160;
const AVATAR_R = 36;
const SPOKE_START = AVATAR_R + 6;
const rMin = 52;
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

  return (
    <View>
      <Svg width="100%" height={SH} viewBox={`0 0 ${SW} ${SH}`}>
        <Defs>
          <RadialGradient id="dna_g" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(245,194,0,0.15)" />
            <Stop offset="100%" stopColor="rgba(245,194,0,0.02)" />
          </RadialGradient>
        </Defs>

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

        {/* filled DNA polygon */}
        <Path d={pathD} fill="url(#dna_g)" />

        {/* recency-brightened outline */}
        {spokes.map((p, i) => {
          const q = spokes[(i + 1) % n];
          const isWrap = i === n - 1;
          const t = isWrap ? 0 : (i + 1) / (n - 1);
          const op = Math.min(1, 0.28 + 0.6 * t);
          return (
            <Line
              key={`s${i}`}
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              stroke={`rgba(245,194,0,${op.toFixed(2)})`}
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}

        {/* spoke dots */}
        {spokes.map((p, i) => (
          <Circle key={`d${i}`} cx={p.x} cy={p.y} r={3.5} fill={COLOR.gold} />
        ))}

        {/* center avatar */}
        <G>
          <Circle cx={CX} cy={CY} r={AVATAR_R} fill={COLOR.surface2} stroke={ringColor} strokeWidth={2} />
          <SvgText
            x={CX}
            y={CY + 6}
            fill={ringColor}
            fontSize={18}
            fontFamily={FONT.display}
            textAnchor="middle"
          >
            {initials}
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}
