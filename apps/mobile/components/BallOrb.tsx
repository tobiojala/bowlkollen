import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View } from 'react-native';

// A bowling ball rendered from its identity: a glossy hashed-colour sphere with the
// three drilled holes, echoing the IdentityAvatar sheen language. When we have a
// licensed product photo (image_url) we show that instead — same footprint, so the
// shelf never reflows when real images arrive.
export function BallOrb({
  label,
  imageUrl,
  size = 72,
}: {
  label: string; // "brand name" — hashed for the colour so each ball is distinct
  imageUrl?: string | null;
  size?: number;
}) {
  const radius = size / 2;
  const hue = (label || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const base = `hsl(${hue}, 58%, 42%)`;
  const light = `hsl(${hue}, 70%, 60%)`;
  const dark = `hsl(${hue}, 55%, 22%)`;

  const hole = size * 0.11;
  const holeStyle = { width: hole, height: hole, borderRadius: hole / 2 };

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <>
          {/* Sphere body: diagonal light->base->dark reads as a lit ball (RN has no
              usable radial gradient), plus a soft top-left specular sheen. */}
          <LinearGradient
            colors={[light, base, dark]}
            locations={[0, 0.5, 1]}
            start={{ x: 0.25, y: 0.15 }}
            end={{ x: 0.85, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
            locations={[0, 0.55]}
            start={{ x: 0.28, y: 0.18 }}
            end={{ x: 0.62, y: 0.62 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
            pointerEvents="none"
          />
          {/* The three drilled holes, in the classic triangle. */}
          <View style={[styles.holes, { top: size * 0.24, gap: size * 0.07 }]}>
            <View style={styles.fingerRow}>
              <View style={[styles.hole, holeStyle]} />
              <View style={[styles.hole, holeStyle, { marginLeft: size * 0.14 }]} />
            </View>
            <View style={[styles.hole, holeStyle, { alignSelf: 'center' }]} />
          </View>
        </>
      )}
      <View style={[styles.rim, { borderRadius: radius }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#111' },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  holes: { position: 'absolute', alignSelf: 'center', alignItems: 'center' },
  fingerRow: { flexDirection: 'row' },
  hole: { backgroundColor: 'rgba(0,0,0,0.55)' },
});
