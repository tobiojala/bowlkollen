import { StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, SPACE } from '@/theme';

// Every feed item shares this frame. Full-bleed (edge-to-edge divider), a small
// internal inset off the vertical edges, and content that fills the post top to
// bottom (header → hero → detail via space-between) rather than clumping in the
// middle. Tall (~one before the fold). A shop/centre ad fills the same frame.
const FOLD_FRACTION = 0.44;
const SIDE = SPACE[4]; // small spacing off the screen edges

export function FeedCard({
  onPress,
  children,
  contentStyle,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}) {
  const { height } = useWindowDimensions();
  return (
    <PressableScale style={styles.post} onPress={onPress} disabled={!onPress} haptic>
      <View style={[styles.content, { minHeight: Math.round(height * FOLD_FRACTION) }, contentStyle]}>
        {children}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  post: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLOR.hairline,
  },
  content: {
    paddingHorizontal: SIDE,
    paddingVertical: SPACE[6],
    justifyContent: 'space-between',
    gap: SPACE[4],
  },
});
