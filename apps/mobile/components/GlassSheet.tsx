import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const RISE_SPRING = { stiffness: 240, damping: 30, mass: 0.9 };
const HEIGHT_FRACTION = 0.84;

// A Revolut-style glass "curtain": the panel rises from the bottom over a blurred,
// dimmed backdrop — an extension of the floating nav's liquid glass. Pair it with
// a scaled-back page behind (see the team page) for the full zoom-out effect.
export function GlassSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const p = useSharedValue(0);
  const liquid = isLiquidGlassAvailable();
  const sheetH = height * HEIGHT_FRACTION;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      p.value = withSpring(1, RISE_SPRING);
    } else {
      p.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (fin) => {
        if (fin) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: p.value }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - p.value) * (sheetH + 40) }],
  }));

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Stäng tabell">
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.dim} />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[styles.panel, { height: sheetH, paddingBottom: insets.bottom + SPACE[4] }, panelStyle]}
      >
        {liquid ? (
          <GlassView glassEffectStyle="clear" colorScheme="dark" isInteractive style={StyleSheet.absoluteFill} />
        ) : (
          <>
            <BlurView intensity={64} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.panelTint} />
          </>
        )}
        <View style={styles.rim} pointerEvents="none" />

        <View style={styles.grabber} />
        {!!title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(16,19,24,0.42)',
  },
  panelTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,17,22,0.32)' },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLOR.ink4,
    alignSelf: 'center',
    marginTop: SPACE[3],
    marginBottom: SPACE[2],
  },
  title: {
    color: COLOR.ink,
    fontSize: TYPE.title,
    fontFamily: FONT.bold,
    letterSpacing: -0.3,
    paddingHorizontal: SPACE[6],
    marginBottom: SPACE[3],
  },
  body: { flex: 1, paddingHorizontal: SPACE[6] },
});
