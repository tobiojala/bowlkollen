import { StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, SPACE } from '@/theme';

// Every feed item shares this frame. No card, no border, no shadow — just an
// airy post separated from the next by a thin hairline (the web feed feel), and
// tall (~one before the fold, Instagram-style) so the stream breathes. A shop/
// centre ad fills the same post height and blends in.
const FOLD_FRACTION = 0.46;

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
    <PressableScale
      style={[styles.post, { minHeight: Math.round(height * FOLD_FRACTION) }]}
      onPress={onPress}
      disabled={!onPress}
      haptic
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  post: {
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLOR.hairline,
  },
  content: {
    paddingVertical: SPACE[8],
    gap: 22,
  },
});
