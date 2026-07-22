import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

import { COLOR, FONT } from '@/theme';

export type IdentityColors = { bg: string; ring: string; text: string };

// Shared identity treatment for teams + players — mirrors the web LagHero: a
// gradient "story ring" (web uses conic; RN has no conic, so a diagonal linear
// sweep of the same two tones reads the same) with a 2px bg gap, wrapping the
// initials (or a photo). Colour is the name-hashed team/club identity.
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
  const ringW = Math.max(2.5, size * 0.038);
  const radius = size / 2;

  return (
    <LinearGradient
      colors={[colors.ring, colors.text, colors.ring]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
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

// Soft radial ambient glow behind a hero — the team/club colour lighting the
// header instead of a flat fill. A tiny disc with a large soft iOS shadow gives
// a smooth radial bloom (avoids react-native-svg RadialGradient, which renders
// as a solid fill). iOS-only glow; harmless no-op on Android.
export function AmbientGlow({
  color,
  size = 90,
  bloom = 80,
  opacity = 0.5,
  top = -20,
}: {
  color: string;
  size?: number;
  bloom?: number;
  opacity?: number;
  top?: number;
}) {
  return (
    <View pointerEvents="none" style={[styles.glowWrap, { top }]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: bloom,
          shadowOpacity: opacity,
        }}
      />
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
