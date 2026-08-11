import MaskedView from '@react-native-masked-view/masked-view';
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

  // Solid team-colour ring (no gradient banding) + a soft top-down specular sheen
  // that fades to transparent, so there is no visible transition line — the same
  // rim-light language as the floating nav.
  return (
    <View style={{ width: size, height: size, borderRadius: radius, padding: ringW, backgroundColor: colors.ring }}>
      <LinearGradient
        colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
        locations={[0, 0.4, 0.62]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        pointerEvents="none"
      />
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
    </View>
  );
}

// Soft ambient glow behind a hero — the team/club colour faintly lighting the
// header. Built purely from smooth gradients (no stacked circles, so no visible
// banding / "vector lines"): a vertical colour->transparent fill, masked by a
// horizontal centre fade, so it's brightest top-centre and dissolves to the
// sides and downward. No react-native-svg RadialGradient (renders solid) needed.
export function AmbientGlow({
  color,
  height = 230,
  top = -30,
  opacity = 0.16,
}: {
  color: string;
  height?: number;
  top?: number;
  opacity?: number;
}) {
  return (
    <View pointerEvents="none" style={[styles.glowWrap, { top, height }]}>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={['transparent', '#000', '#000', 'transparent']}
            locations={[0, 0.32, 0.68, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <LinearGradient
          colors={[color, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity }]}
        />
      </MaskedView>
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
  initials: { fontFamily: FONT.score, letterSpacing: 0.5 },
  glowWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
