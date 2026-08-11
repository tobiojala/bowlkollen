import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Achievement } from '@/lib/player-stats';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Quiet tonal chip row under the identity: skill level + earned milestones. Gold is
// reserved for a genuine 300; everything else is ink on surface.
export function ProfileChips({ skillLevel, achievements }: { skillLevel: number | null; achievements: Achievement[] }) {
  if (skillLevel == null && achievements.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={styles.inner}>
      {skillLevel != null && (
        <View style={styles.chip}>
          <Ionicons name="speedometer-outline" size={16} color={COLOR.ink2} />
          <Text style={styles.chipText}>Spelstyrka {skillLevel}</Text>
        </View>
      )}
      {achievements.map((a) => (
        <View key={a.id} style={styles.chip}>
          <Ionicons name={a.icon as keyof typeof Ionicons.glyphMap} size={16} color={a.id === '300' ? COLOR.gold : COLOR.ink2} />
          <Text style={styles.chipText}>{a.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { marginTop: SPACE[4], marginHorizontal: -SPACE[6] },
  inner: { paddingHorizontal: SPACE[6], gap: SPACE[2] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[2],
    borderRadius: RADIUS.pill,
    backgroundColor: COLOR.surface,
  },
  chipText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
});
