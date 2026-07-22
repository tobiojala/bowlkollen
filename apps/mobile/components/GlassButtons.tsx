import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, RADIUS, TYPE } from '@/theme';

function Glass() {
  return isLiquidGlassAvailable() ? (
    <GlassView glassEffectStyle="clear" colorScheme="dark" isInteractive style={StyleSheet.absoluteFill} />
  ) : (
    <>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tint} />
    </>
  );
}

// Reddit/Revolut-style floating glass back button for deep pages.
export function GlassCircle({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <PressableScale onPress={onPress} hitSlop={8} accessibilityLabel={accessibilityLabel}>
      <View style={styles.shadow}>
        <View style={[styles.clip, styles.circle]}>
          <Glass />
          <View style={styles.rim} pointerEvents="none" />
          <Ionicons name={icon} size={23} color={COLOR.ink} />
        </View>
      </View>
    </PressableScale>
  );
}

// Floating glass action pill (icon + label) — e.g. the division "Tabell".
export function GlassPill({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} hitSlop={8}>
      <View style={styles.shadow}>
        <View style={[styles.clip, styles.pill]}>
          <Glass />
          <View style={styles.rim} pointerEvents="none" />
          <Ionicons name={icon} size={16} color={COLOR.ink} />
          <Text style={styles.pillText}>{label}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: RADIUS.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  clip: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14,17,22,0.28)',
  },
  circle: { width: 42, height: 42 },
  pill: { flexDirection: 'row', gap: 6, height: 42, paddingHorizontal: 16 },
  pillText: { color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.bold },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,17,22,0.32)' },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
});
