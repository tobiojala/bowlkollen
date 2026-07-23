import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const SIZE = 76;
const RING = 3;

export type Story = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap };

// Instagram-style story circles as the feed's category rail — the same ring
// language as the team/player avatars, but in Bowlkollen gold (not the hashed
// avatar colours). The active category gets the lit gold ring; others sit muted.
export function StoryChips({
  stories,
  selected,
  onSelect,
}: {
  stories: Story[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.inner}
    >
      {stories.map((s) => {
        const on = s.key === selected;
        return (
          <PressableScale key={s.key} style={styles.item} onPress={() => onSelect(s.key)} accessibilityLabel={s.label}>
            <View style={[styles.ring, { backgroundColor: on ? COLOR.gold : COLOR.ink4 }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
                locations={[0, 0.4, 0.62]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.sheen}
                pointerEvents="none"
              />
              <View style={styles.inner2}>
                <Ionicons name={s.icon} size={30} color={on ? COLOR.gold : COLOR.ink2} />
              </View>
            </View>
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>{s.label}</Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {},
  inner: { paddingHorizontal: SPACE[4], gap: SPACE[4] },
  item: { alignItems: 'center', width: SIZE, gap: 7 },
  ring: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, padding: RING },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: SIZE / 2 },
  inner2: {
    flex: 1,
    borderRadius: SIZE / 2 - RING,
    backgroundColor: COLOR.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLOR.bg,
  },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.semibold },
  labelOn: { color: COLOR.ink, fontFamily: FONT.bold },
});
