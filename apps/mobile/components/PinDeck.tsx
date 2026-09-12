import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { COLOR, FONT } from '@/theme';

// Reusable 10-pin deck (bowler's view, pin 1 nearest). Available pins are
// tappable; a standing pin is lit (ink), a knocked/available pin dim, a locked
// pin dimmest. Parity with the web PinDeck.
const POS: Record<number, [number, number]> = {
  7: [0, 0], 8: [1, 0], 9: [2, 0], 10: [3, 0],
  4: [0.5, 1], 5: [1.5, 1], 6: [2.5, 1], 2: [1, 2], 3: [2, 2], 1: [1.5, 3],
};
// OX/OY leave a full radius (+stroke) of headroom so no circle clips the edge.
const OX = 20, OY = 20, SX = 44, SY = 50, R = 16, W = 184, H = 210;

export function PinDeck({ available, standing, onToggle }: {
  available: Set<number>;
  standing: Set<number>;
  onToggle?: (pin: number) => void;
}) {
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {Object.entries(POS).map(([p, [gx, gy]]) => {
        const pin = Number(p), cx = OX + gx * SX, cy = OY + gy * SY;
        const inPlay = available.has(pin), on = standing.has(pin);
        const tappable = inPlay && !!onToggle;
        return (
          <G key={pin} onPress={tappable ? () => onToggle!(pin) : undefined}>
            <Circle cx={cx} cy={cy} r={R}
              fill={on ? COLOR.ink : inPlay ? '#171b21' : '#0e1116'}
              stroke={on ? 'transparent' : inPlay ? 'rgba(244,245,247,0.13)' : 'rgba(244,245,247,0.04)'}
              strokeWidth={1.5} />
            <SvgText x={cx} y={cy + 4} textAnchor="middle" fontFamily={FONT.score} fontSize={12} fontWeight="700"
              fill={on ? COLOR.bg : inPlay ? 'rgba(244,245,247,0.34)' : 'rgba(244,245,247,0.12)'}>{pin}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
