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
      locations={[0, 0.5, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
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

// Soft ambient glow behind a hero — the team/club colour lighting the header
// instead of a flat fill. Built from a few concentric low-opacity discs (largest
// faintest) so it fades outward like a radial glow, without the react-native-svg
// RadialGradient solid-fill bug or unreliable coloured shadows.
export function AmbientGlow({
  color,
  size = 260,
  top = -60,
}: {
  color: string;
  size?: number;
  top?: number;
}) {
  const layers = [
    { s: size, o: 0.05 },
    { s: size * 0.72, o: 0.06 },
    { s: size * 0.48, o: 0.08 },
    { s: size * 0.28, o: 0.1 },
  ];
  return (
    <View pointerEvents="none" style={[styles.glowWrap, { top, height: size }]}>
      {layers.map((l, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: l.s,
            height: l.s,
            borderRadius: l.s / 2,
            backgroundColor: color,
            opacity: l.o,
          }}
        />
      ))}
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
