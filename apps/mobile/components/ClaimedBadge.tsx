import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { COLOR, FONT, TYPE } from '@/theme';

// "På Bowlkollen" — a verified/claimed mark for players who use the app. A gold check
// (icon = meaning, not colour alone). `label` shows the wordmark beside it.
export function ClaimedBadge({ size = 18, label = false }: { size?: number; label?: boolean }) {
  const dot = (
    <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="checkmark" size={size * 0.68} color={COLOR.bg} />
    </View>
  );
  if (!label) return dot;
  return (
    <View style={styles.row}>
      {dot}
      <Text style={styles.text}>På Bowlkollen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { backgroundColor: COLOR.gold, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { color: COLOR.gold, fontSize: TYPE.caption, fontFamily: FONT.bold },
});
