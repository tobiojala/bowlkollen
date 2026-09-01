import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

export type ProfileAction = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void };

const SIZE = 54;
const RING = 2;
const SHEEN = ['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0)'] as const;

// Action row under the hero deck, in the home-feed circle language (StoryRail):
// 76px ring + matte sheen + inner disc. Neutral ring — these are actions, not
// toggles, so nothing reads as "always active". Only supported actions are
// passed in — no dead buttons.
export function ProfileActions({ actions }: { actions: ProfileAction[] }) {
  if (actions.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={styles.inner}>
      {actions.map((a) => (
        <PressableScale key={a.label} style={styles.item} onPress={a.onPress} accessibilityLabel={a.label}>
          <View style={styles.ring}>
            <LinearGradient colors={SHEEN} locations={[0, 0.4, 0.62]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.sheen} pointerEvents="none" />
            <View style={styles.disc}><Ionicons name={a.icon} size={22} color={COLOR.ink2} /></View>
          </View>
          <Text style={styles.label} numberOfLines={1}>{a.label}</Text>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { marginTop: SPACE[6], overflow: 'visible' },
  inner: { gap: SPACE[3], paddingHorizontal: 2 },
  item: { alignItems: 'center', width: SIZE, gap: 7 },
  ring: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, padding: RING, backgroundColor: COLOR.ink4 },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: SIZE / 2 },
  disc: { flex: 1, borderRadius: SIZE / 2 - RING, backgroundColor: COLOR.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLOR.bg },
  label: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
});
