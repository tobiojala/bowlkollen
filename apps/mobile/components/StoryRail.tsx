import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import type { Story } from '@/components/StoryChips';
import type { StoryEntity } from '@/lib/story-rail';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const SIZE = 76;
const RING = 3;
const SHEEN = ['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0)'] as const;

// Instagram story rail: shared view chips, then a lit/quiet circle per followed
// player and team. The active category / entity gets a gold ring; an entity's
// ring is also gold while it has unseen activity. Unseen circles sort first.
export function StoryRail({
  categories, entities, activeCategory, activeEntityKey, isUnseen, onCategory, onEntity,
}: {
  categories: Story[];
  entities: StoryEntity[];
  activeCategory: string | null;
  activeEntityKey: string | null;
  isUnseen: (key: string, latestTs: string) => boolean;
  onCategory: (key: string) => void;
  onEntity: (e: StoryEntity) => void;
}) {
  const ordered = [...entities].sort((a, b) => {
    const ua = isUnseen(a.key, a.latestTs), ub = isUnseen(b.key, b.latestTs);
    return ua === ub ? 0 : ua ? -1 : 1;
  });

  const ring = (goldRing: boolean, inner: React.ReactNode, label: string, on: boolean, onPress: () => void, key: string) => (
    <PressableScale key={key} style={styles.item} onPress={onPress} accessibilityLabel={label}>
      <View style={[styles.ring, { backgroundColor: goldRing ? COLOR.gold : COLOR.ink4 }]}>
        <LinearGradient colors={SHEEN} locations={[0, 0.4, 0.62]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.sheen} pointerEvents="none" />
        {inner}
      </View>
      <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>{label}</Text>
    </PressableScale>
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={styles.inner}>
      {categories.map((c) => {
        const on = activeCategory === c.key;
        return ring(on, (
          <View style={styles.disc}><Ionicons name={c.icon} size={30} color={on ? COLOR.gold : COLOR.ink2} /></View>
        ), c.label, on, () => onCategory(c.key), c.key);
      })}

      {ordered.length > 0 && <View style={styles.divider} />}

      {ordered.map((e) => {
        const on = activeEntityKey === e.key;
        const unseen = isUnseen(e.key, e.latestTs);
        const col = teamColor(e.name);
        return ring(unseen, (
          <View style={[styles.avatar, { backgroundColor: col.bg, opacity: unseen ? 1 : 0.85 }]}>
            <Text style={[styles.initials, { color: col.text }]}>{teamInitials(e.name)}</Text>
          </View>
        ), e.name, on, () => onEntity(e), e.key);
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {},
  inner: { paddingHorizontal: SPACE[4], gap: SPACE[4], alignItems: 'flex-start' },
  item: { alignItems: 'center', width: SIZE, gap: 7 },
  ring: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, padding: RING },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: SIZE / 2 },
  disc: { flex: 1, borderRadius: SIZE / 2 - RING, backgroundColor: COLOR.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLOR.bg },
  avatar: { flex: 1, borderRadius: SIZE / 2 - RING, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLOR.bg },
  initials: { fontFamily: FONT.score, fontSize: SIZE * 0.34, letterSpacing: 0.5 },
  divider: { alignSelf: 'stretch', width: StyleSheet.hairlineWidth, backgroundColor: COLOR.ink4, marginHorizontal: 2 },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.semibold, maxWidth: SIZE },
  labelOn: { color: COLOR.ink, fontFamily: FONT.bold },
});
