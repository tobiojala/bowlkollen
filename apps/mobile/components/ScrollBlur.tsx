import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Port of the web AppShell scroll-blur chrome: a top band and a bottom band that
// frost + fade the content passing under them (Instagram-style — no solid bars,
// just blur at the very top and bottom edges). The mask makes the blur strongest
// at the screen edge and fade to nothing toward the middle.
// Clearance for the floating nav pill (12 margin + 60 height + a small gap) so
// the bottom band sits just above the nav, not over it.
const FLOATING_NAV = 78;

export function ScrollBlur({ overTabBar = false }: { overTabBar?: boolean }) {
  const insets = useSafeAreaInsets();
  const bottomOffset = overTabBar ? insets.bottom + FLOATING_NAV : 0;
  const topHeight = insets.top + 40;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* top band — strong at the very top, fades downward */}
      <MaskedView
        style={[styles.band, { top: 0, height: topHeight }]}
        maskElement={
          <LinearGradient
            colors={['#000', '#000', 'transparent']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(11,13,16,0.72)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>

      {/* bottom band — strong at the bottom, fades upward */}
      <MaskedView
        style={[styles.band, { bottom: bottomOffset, height: 84 }]}
        maskElement={
          <LinearGradient
            colors={['transparent', '#000', '#000']}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['transparent', 'rgba(11,13,16,0.6)']}
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0 },
});
