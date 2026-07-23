import { ScrollView, StyleSheet, Text } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const label = (s: number) => `${s}/${String((s + 1) % 100).padStart(2, '0')}`;

// Horizontal season picker (newest first) — shared by the team + division
// schedules so you can look back at past seasons.
export function SeasonPills({
  seasons,
  selected,
  onSelect,
}: {
  seasons: number[];
  selected: number | null;
  onSelect: (season: number) => void;
}) {
  if (seasons.length < 2) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.inner}
    >
      {seasons.map((s) => (
        <PressableScale key={s} style={[styles.pill, s === selected && styles.pillOn]} onPress={() => onSelect(s)}>
          <Text style={[styles.text, s === selected && styles.textOn]}>{label(s)}</Text>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { marginTop: SPACE[6], marginHorizontal: -SPACE[6] },
  inner: { paddingHorizontal: SPACE[6], gap: SPACE[2] },
  pill: {
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[2],
    borderRadius: RADIUS.pill,
    backgroundColor: COLOR.surface,
  },
  pillOn: { backgroundColor: 'rgba(245,194,0,0.14)' },
  text: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.bold },
  textOn: { color: COLOR.gold },
});
