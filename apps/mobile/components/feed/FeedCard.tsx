import { StyleSheet, View, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, RADIUS, SPACE } from '@/theme';

// The one card frame every feed item shares — a floating, borderless, rounded
// surface with a soft shadow (Instagram/Revolut feel) and a generous minimum
// height so nothing feels cramped. A shop/centre ad drops into the same frame
// and blends in. Keep all feed cards going through this.
export function FeedCard({
  onPress,
  children,
  contentStyle,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}) {
  return (
    <PressableScale style={styles.card} onPress={onPress} disabled={!onPress} haptic>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.xl,
    marginBottom: SPACE[4],
    minHeight: 148,
    overflow: 'hidden',
    // Floating — no borders, soft depth.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  content: {
    flex: 1,
    padding: SPACE[6],
    justifyContent: 'center',
    gap: 20,
  },
});
