import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBackground } from '@/lib/app-background';
import { COLOR, FONT, TYPE } from '@/theme';

// The "lockscreen": on app open, if the user has set a private background, show it full
// screen with the wordmark, then fade away. Once per app launch.
let shownThisLaunch = false;

export function LockScreen() {
  const insets = useSafeAreaInsets();
  const [uri, setUri] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shownThisLaunch) return;
    getBackground().then((u) => {
      if (!u) return;
      shownThisLaunch = true;
      setUri(u);
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    Animated.timing(op, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(op, { toValue: 0, duration: 480, useNativeDriver: true }).start(({ finished }) => finished && setMounted(false));
    }, 1500);
    return () => clearTimeout(t);
  }, [mounted, op]);

  const dismiss = () =>
    Animated.timing(op, { toValue: 0, duration: 300, useNativeDriver: true }).start(({ finished }) => finished && setMounted(false));

  if (!mounted || !uri) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.wrap, { opacity: op }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
        <ImageBackground source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover">
          <LinearGradient
            colors={['rgba(11,13,16,0.55)', 'rgba(11,13,16,0.15)', 'rgba(11,13,16,0.85)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.wordmark, { marginBottom: insets.bottom + 40 }]}>BOWLKOLLEN</Text>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: COLOR.bg, zIndex: 100, justifyContent: 'flex-end', alignItems: 'center' },
  wordmark: { color: COLOR.gold, fontSize: TYPE.body, fontFamily: FONT.bold, letterSpacing: 4 },
});
