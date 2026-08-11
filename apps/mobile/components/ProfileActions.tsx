import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export type ProfileAction = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void };

// Labeled action row under the hero deck (icon + word, senior-legible). Only the
// actions we actually support are passed in — no dead buttons.
export function ProfileActions({ actions }: { actions: ProfileAction[] }) {
  if (actions.length === 0) return null;
  return (
    <View style={styles.row}>
      {actions.map((a) => (
        <PressableScale key={a.label} style={styles.btn} onPress={a.onPress} accessibilityLabel={a.label}>
          <Ionicons name={a.icon} size={22} color={COLOR.ink} />
          <Text style={styles.label}>{a.label}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACE[2], marginTop: SPACE[6] },
  btn: {
    flex: 1,
    minHeight: 56,
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[3],
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[1],
  },
  label: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
});
