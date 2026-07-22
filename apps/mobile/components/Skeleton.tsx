import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { COLOR, RADIUS, SPACE } from '@/theme';

// A single pulsing placeholder block.
export function Skeleton({
  width = '100%',
  height,
  radius = RADIUS.sm,
}: {
  width?: DimensionValue;
  height: number;
  radius?: number;
}) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.9, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: COLOR.surface2 }, style]}
    />
  );
}

// A list of shimmer rows for a loading list (feed, roster, results, etc.).
export function ListSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width="55%" height={15} />
          <Skeleton width={44} height={22} radius={RADIUS.sm} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: SPACE[6], paddingTop: SPACE[4], gap: SPACE[6] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
