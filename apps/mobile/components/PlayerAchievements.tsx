import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Achievement } from '@/lib/player-stats';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Earned milestone badges — gold, on a tight budget (they're genuine milestones).
export function PlayerAchievements({ items }: { items: Achievement[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.label}>MILSTOLPAR</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={styles.inner}>
        {items.map((a) => (
          <View key={a.id} style={styles.badge}>
            <Ionicons name={a.icon as keyof typeof Ionicons.glyphMap} size={16} color={COLOR.gold} />
            <Text style={styles.badgeText}>{a.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  row: { marginHorizontal: -SPACE[6] },
  inner: { paddingHorizontal: SPACE[6], gap: SPACE[2] },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(245,194,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.28)',
  },
  badgeText: { color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.semibold },
});
