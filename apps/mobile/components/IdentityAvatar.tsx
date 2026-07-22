import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

import { COLOR, FONT } from '@/theme';

export type IdentityColors = {
  bg: string;
  ring: string;
  text: string;
  hi?: string;
  lo?: string;
};

// Shared identity treatment for teams + players — mirrors the web LagHero: a
// gradient "story ring" (web uses conic; RN has no conic, so a diagonal linear
// sweep hi -> ring -> lo reads the same) with a 2px bg gap, wrapping the initials
// (or a photo). Colour is the name-hashed team/club identity.
export function IdentityAvatar({
  colors,
  initials,
  imageUrl,
  size = 76,
}: {
  colors: IdentityColors;
  initials: string;
  imageUrl?: string | null;
  size?: number;
}) {
  const ringW = Math.max(3, size * 0.05);
  const radius = size / 2;
  const hi = colors.hi ?? colors.text;
  const lo = colors.lo ?? colors.bg;

  return (
    <LinearGradient
      colors={[hi, colors.ring, lo]}
      locations={[0, 0.55, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ width: size, height: size, borderRadius: radius, padding: ringW }}
    >
      <View
        style={[
          styles.inner,
          { borderRadius: radius - ringW, backgroundColor: colors.bg },
        ]}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Text style={[styles.initials, { color: colors.text, fontSize: size * 0.34 }]}>
            {initials}
          </Text>
        )}
      </View>
    </LinearGradient>
  );
}

// Soft ambient glow behind a hero — the team/club colour faintly lighting the
// header instead of a flat fill. Many equal, very-low-opacity concentric discs:
// they overlap most in the centre and least at the edges, so the alpha builds up
// into a smooth radial falloff (no hard blob, no react-native-svg RadialGradient
// solid-fill bug, no unreliable coloured shadows).
const GLOW_LAYERS = 7;
const GLOW_OPACITY = 0.022;

export function AmbientGlow({
  color,
  size = 300,
  top = -80,
}: {
  color: string;
  size?: number;
  top?: number;
}) {
  return (
    <View pointerEvents="none" style={[styles.glowWrap, { top, height: size }]}>
      {Array.from({ length: GLOW_LAYERS }, (_, i) => {
        const s = size * (1 - (i / GLOW_LAYERS) * 0.86);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: s,
              height: s,
              borderRadius: s / 2,
              backgroundColor: color,
              opacity: GLOW_OPACITY,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLOR.bg,
  },
  initials: { fontFamily: FONT.display, letterSpacing: 0.5 },
  glowWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
