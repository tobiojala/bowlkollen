import { usePathname, useRouter } from 'expo-router';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Home, Search, User } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavScroll } from '@/lib/nav-scroll';
import { COLOR, RADIUS } from '@/theme';

const SPRING = { stiffness: 380, damping: 36, mass: 0.85 };
const MINI = 56;
const PILL_H = 60;
const SIDE = 16;

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
const TABS: { icon: LucideIcon; href: string }[] = [
  { icon: Home, href: '/' },
  { icon: Calendar, href: '/schema' },
  { icon: Search, href: '/discover' },
  { icon: User, href: '/profile' },
];

// The web BottomNav, native: a floating pill that uses real iOS 26 liquid glass
// (expo-glass-effect, BlurView fallback), collapses to a mini circle on the right
// when you scroll down (Reddit-style) and expands near the top. Rendered as a
// sibling overlay (not the navigator tabBar) so the glass samples the content
// behind it, exactly like the ScrollBlur bands.
export function FloatingNav() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { expanded: ctxExpanded } = useNavScroll();
  const [localOpen, setLocalOpen] = useState(false);
  const liquid = isLiquidGlassAvailable();

  // A tap on the mini circle re-opens; the next scroll re-takes control.
  useEffect(() => setLocalOpen(false), [ctxExpanded]);
  const expanded = ctxExpanded || localOpen;

  const fullWidth = width - SIDE * 2;
  const tabW = (fullWidth - 16) / TABS.length;
  const current = Math.max(
    0,
    TABS.findIndex((t) => (t.href === '/' ? pathname === '/' : pathname.startsWith(t.href))),
  );
  const ActiveIcon = TABS[current].icon;

  const pw = useSharedValue(fullWidth);
  const ph = useSharedValue(PILL_H);
  const px = useSharedValue(0);
  const co = useSharedValue(1);
  const ind = useSharedValue(current);

  useEffect(() => {
    pw.value = withSpring(expanded ? fullWidth : MINI, SPRING);
    ph.value = withSpring(expanded ? PILL_H : MINI, SPRING);
    px.value = withSpring(expanded ? 0 : fullWidth - MINI, SPRING);
    co.value = withTiming(expanded ? 1 : 0, { duration: 130 });
  }, [expanded, fullWidth]);

  useEffect(() => {
    ind.value = withSpring(current, SPRING);
  }, [current]);

  const pillStyle = useAnimatedStyle(() => ({
    width: pw.value,
    height: ph.value,
    transform: [{ translateX: px.value }],
  }));
  const rowStyle = useAnimatedStyle(() => ({ opacity: co.value }));
  const miniStyle = useAnimatedStyle(() => ({ opacity: 1 - co.value }));
  const indStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: 8 + ind.value * tabW }],
  }));

  return (
    <View
      style={[styles.wrap, { bottom: insets.bottom + 12 }]}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.shadow, pillStyle]}>
        <View style={styles.clip}>
          {liquid ? (
            <GlassView
              glassEffectStyle="regular"
              colorScheme="dark"
              isInteractive
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <>
              <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.tint} />
            </>
          )}
          <View style={styles.rim} pointerEvents="none" />

          {/* expanded: sliding gold indicator + tab row */}
          <Animated.View
            style={[StyleSheet.absoluteFill, rowStyle]}
            pointerEvents={expanded ? 'auto' : 'none'}
          >
            <Animated.View style={[styles.indicator, { width: tabW }, indStyle]} pointerEvents="none">
              <LinearGradient
                colors={['rgba(255,215,40,0.18)', 'rgba(245,160,0,0.11)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.4, y: 1 }}
                style={styles.indicatorGrad}
              />
            </Animated.View>

            <View style={styles.row}>
              {TABS.map((tab, i) => {
                const active = i === current;
                const Icon = tab.icon;
                return (
                  <Pressable
                    key={tab.href}
                    style={styles.tab}
                    onPress={() => {
                      if (!active) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.navigate(tab.href as never);
                      }
                      setLocalOpen(false);
                    }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.3 : 1.7}
                      color={active ? COLOR.gold : COLOR.ink3}
                    />
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* collapsed: mini circle showing the active icon, tap to expand */}
          <Animated.View
            style={[styles.mini, miniStyle]}
            pointerEvents={expanded ? 'none' : 'auto'}
          >
            <Pressable style={styles.miniBtn} onPress={() => setLocalOpen(true)}>
              <ActiveIcon size={22} strokeWidth={2.3} color={COLOR.gold} />
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: SIDE, right: SIDE, alignItems: 'flex-start' },
  shadow: {
    borderRadius: RADIUS.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 32,
    shadowOpacity: 0.55,
    elevation: 16,
  },
  clip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,17,22,0.42)' },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  row: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  indicator: { position: 'absolute', top: 8, bottom: 8 },
  indicatorGrad: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.34)',
  },
  mini: { ...StyleSheet.absoluteFillObject },
  miniBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
