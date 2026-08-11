import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { COLOR } from '@/theme';

const THUMB = 24;

// Lightweight gesture slider (no native dep) — track + draggable thumb. Tap or drag
// to set. Gold thumb is the sanctioned single interactive accent.
export function Slider({ min, max, step, value, onChange, accent = COLOR.gold }: {
  min: number; max: number; step: number; value: number; onChange: (v: number) => void; accent?: string;
}) {
  const [w, setW] = useState(0);
  const pct = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;

  const set = (x: number) => {
    if (w <= 0) return;
    const raw = min + (x / w) * (max - min);
    onChange(Math.max(min, Math.min(max, Math.round(raw / step) * step)));
  };
  const pan = Gesture.Pan()
    .onBegin((e) => runOnJS(set)(e.x))
    .onUpdate((e) => runOnJS(set)(e.x));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.hit} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: pct * w, backgroundColor: accent }]} />
        </View>
        <View style={[styles.thumb, { left: pct * w - THUMB / 2, backgroundColor: accent }]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hit: { height: 44, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: COLOR.surface2, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  thumb: { position: 'absolute', width: THUMB, height: THUMB, borderRadius: THUMB / 2, top: (44 - THUMB) / 2 },
});
