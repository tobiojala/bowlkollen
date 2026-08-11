import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export type HeroCard = { key: string; label: string; element: React.ReactElement };

// The profile hero: a segmented toggle over one big metric card at a time. We use a
// tap-toggle rather than a swipe pager because each card's graph owns the horizontal
// drag-scrub — a swipe deck would fight that gesture.
export function HeroDeck({ cards }: { cards: HeroCard[] }) {
  const [active, setActive] = useState(0);
  if (cards.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {cards.length > 1 && (
        <View style={styles.segments}>
          {cards.map((c, i) => (
            <PressableScale
              key={c.key}
              style={[styles.segment, i === active && styles.segmentOn]}
              onPress={() => setActive(i)}
              accessibilityLabel={c.label}
            >
              <Text style={[styles.segText, i === active && styles.segTextOn]}>{c.label}</Text>
            </PressableScale>
          ))}
        </View>
      )}
      {cards[active].element}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACE[4] },
  segments: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: SPACE[1],
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.pill,
    padding: SPACE[1],
    marginBottom: SPACE[4],
  },
  segment: { paddingVertical: SPACE[2], paddingHorizontal: SPACE[4], borderRadius: RADIUS.pill, minHeight: 40, justifyContent: 'center' },
  segmentOn: { backgroundColor: COLOR.surface2 },
  segText: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  segTextOn: { color: COLOR.ink },
});
