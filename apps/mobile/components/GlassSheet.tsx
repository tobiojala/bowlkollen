import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
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
  const drag = useSharedValue(0); // downward drag-to-dismiss offset
  const liquid = isLiquidGlassAvailable();
  const sheetH = height * HEIGHT_FRACTION;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.value = 0;
      p.value = withSpring(1, RISE_SPRING);
    } else {
      p.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (fin) => {
        if (fin) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  // Drag the header down to dismiss; release short of the threshold springs back.
  const closeDy = sheetH * 0.22;
  const dragToClose = Gesture.Pan()
    .onUpdate((e) => { drag.value = Math.max(0, e.translationY); })
    .onEnd((e) => {
      if (e.translationY > closeDy || e.velocityY > 800) {
        // one continuous throw off-screen, carrying the finger's velocity, THEN unmount
        drag.value = withTiming(sheetH + 40, {
          duration: Math.max(160, Math.min(320, (sheetH - e.translationY) / Math.max(600, e.velocityY) * 1000)),
          easing: Easing.out(Easing.cubic),
        }, (fin) => { if (fin) runOnJS(onClose)(); });
      } else {
        drag.value = withSpring(0, { ...RISE_SPRING, velocity: e.velocityY });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: p.value * Math.max(0, 1 - drag.value / sheetH) }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - p.value) * (sheetH + 40) + drag.value }],
  }));

  if (!mounted) return null;

  // Rendered in a Modal so the curtain escapes any parent (e.g. a ScrollView) and
  // covers the whole screen. GestureHandlerRootView keeps gestures working inside it.
  return (
    <Modal transparent statusBarTranslucent visible animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Stäng">
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

          <GestureDetector gesture={dragToClose}>
            <View style={styles.header}>
              <View style={styles.grabber} />
              {!!title && <Text style={styles.title}>{title}</Text>}
            </View>
          </GestureDetector>
          <View style={styles.body}>{children}</View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
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
  header: { paddingBottom: SPACE[1] },
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
