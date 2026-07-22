import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLOR, RADIUS } from '@/theme';

const SPRING = { stiffness: 380, damping: 36, mass: 0.85 };

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  schema: 'calendar',
  discover: 'search',
  profile: 'person',
};

// Faithful port of the web BottomNav: a floating, frosted-glass pill with a gold
// sliding indicator behind the active tab. (Scroll-collapse morph is a later add.)
export function FloatingNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [rowW, setRowW] = useState(0);
  const tabW = rowW > 0 ? rowW / state.routes.length : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(state.index * tabW, SPRING) }],
  }));

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
      <View style={styles.pill}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />
        <View style={styles.rim} pointerEvents="none" />

        <View style={styles.row} onLayout={(e) => setRowW(e.nativeEvent.layout.width)}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'stretch' },
  pill: {
    height: 60,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(14,17,22,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 32,
    shadowOpacity: 0.5,
    elevation: 16,
  },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,17,22,0.35)' },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  row: { flex: 1, flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  indicator: { position: 'absolute', top: 6, bottom: 6, paddingHorizontal: 5 },
  indicatorGrad: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.40)',
  },
});
