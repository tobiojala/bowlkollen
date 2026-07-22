import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import {
  GlassContainer,
  GlassView,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLOR, RADIUS } from '@/theme';

const SPRING = { stiffness: 380, damping: 36, mass: 0.85 };
const PILL_H = 60;

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  schema: 'calendar',
  discover: 'search',
  profile: 'person',
};

const AnimatedGlass = Animated.createAnimatedComponent(GlassView);

// The web BottomNav as a floating pill. On iOS 26 it uses real Apple liquid glass
// (expo-glass-effect): the pill + the gold active-tab highlight live in a
// GlassContainer so the highlight liquid-morphs as it slides between tabs. On
// older iOS / Android it falls back to a frosted BlurView pill.
export function FloatingNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [rowW, setRowW] = useState(0);
  const liquid = isLiquidGlassAvailable();
  const tabW = rowW > 0 ? rowW / state.routes.length : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(state.index * tabW, SPRING) }],
  }));

  const icons = (
    <View style={styles.row} onLayout={(e) => setRowW(e.nativeEvent.layout.width)}>
      {state.routes.map((route, i) => {
        const active = state.index === i;
        const base = ICON[route.name] ?? 'ellipse';
        const name = active ? base : (`${base}-outline` as keyof typeof Ionicons.glyphMap);
        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!active && !event.defaultPrevented) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
              }
            }}
          >
            <Ionicons name={name} size={23} color={active ? COLOR.gold : COLOR.ink3} />
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
      <View style={styles.shadow}>
        {liquid ? (
          <View style={styles.pillSize}>
            <GlassContainer spacing={22} style={StyleSheet.absoluteFill}>
              <GlassView
                glassEffectStyle="regular"
                colorScheme="dark"
                isInteractive
                style={[StyleSheet.absoluteFill, styles.glassPill]}
              />
              {tabW > 0 && (
                <AnimatedGlass
                  glassEffectStyle="clear"
                  tintColor="rgba(245,194,0,0.55)"
                  style={[styles.glassIndicator, { width: tabW - 12 }, indicatorStyle]}
                />
              )}
            </GlassContainer>
            <View style={styles.rim} pointerEvents="none" />
            {icons}
          </View>
        ) : (
          <View style={[styles.pillSize, styles.blurPill]}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.tint} />
            <View style={styles.rim} pointerEvents="none" />
            {tabW > 0 && (
              <Animated.View style={[styles.indicator, { width: tabW }, indicatorStyle]} pointerEvents="none">
                <LinearGradient
                  colors={['rgba(255,215,40,0.20)', 'rgba(245,160,0,0.13)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.indicatorGrad}
                />
              </Animated.View>
            )}
            {icons}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'stretch' },
  shadow: {
    borderRadius: RADIUS.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 32,
    shadowOpacity: 0.5,
    elevation: 16,
  },
  pillSize: { height: PILL_H, borderRadius: RADIUS.pill },
  glassPill: { borderRadius: RADIUS.pill },
  glassIndicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    borderRadius: RADIUS.lg,
  },
  blurPill: {
    overflow: 'hidden',
    backgroundColor: 'rgba(14,17,22,0.32)',
  },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,17,22,0.14)' },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  row: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  indicator: { position: 'absolute', top: 6, bottom: 6, paddingHorizontal: 5 },
  indicatorGrad: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.40)',
  },
});
