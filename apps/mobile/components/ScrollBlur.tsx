import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Port of the web AppShell scroll-blur chrome: a top band and a bottom band that
// frost + fade the content passing under the header / tab bar. Web values: 80px
// top / 100px bottom, blur(10px), mask linear-gradient(black 40% -> transparent),
// bg gradient rgba(bg,0.6) -> transparent.
// Clearance for the floating nav pill (12 margin + 60 height + a small gap) so
// the blur band sits just above the nav, not over it.
const FLOATING_NAV = 78;

export function ScrollBlur({ overTabBar = false }: { overTabBar?: boolean }) {
  const insets = useSafeAreaInsets();
  const bottomOffset = overTabBar ? insets.bottom + FLOATING_NAV : 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
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
