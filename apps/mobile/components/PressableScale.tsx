import * as Haptics from 'expo-haptics';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  // Subtle scale on press-in; restore on release (ui-ux-pro-max: scale-feedback).
  scaleTo?: number;
  // Light haptic on a completed press (ui-ux-pro-max: haptic-feedback, used sparingly).
  haptic?: boolean;
};

// The app's one tappable primitive: press-in scale + optional haptic, tuned to
// HIG timing (~100ms). Layout-safe (transform only). Use it wherever a raw
// Pressable was, so every tap in the app feels the same.
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  haptic = false,
  onPress,
  disabled,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, { duration: 90 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: 140 });
        rest.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
