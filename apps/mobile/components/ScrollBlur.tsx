import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Instagram-style top chrome: a single blur band at the very top that frosts +
// fades the content scrolling under it (the mask makes the blur strongest at the
// edge and fade to nothing downward). The bottom blur comes from the floating
// nav's own glass, not a separate band.
export function ScrollBlur({ overTabBar = false }: { overTabBar?: boolean }) {
  const insets = useSafeAreaInsets();
  const topHeight = insets.top + 40;
  void overTabBar;

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
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0 },
});
