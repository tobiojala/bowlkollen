import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useIsFollowing, useToggleFollow, type FollowEntityType } from '@/lib/follows';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Reusable follow pill with real state (useIsFollowing) + optimistic toggle.
export function FollowButton({
  entityType,
  entityId,
}: {
  entityType: FollowEntityType;
  entityId: string;
}) {
  const { data: initial } = useIsFollowing(entityType, entityId);
  const [override, setOverride] = useState<boolean | null>(null);
  const { mutate } = useToggleFollow(entityType, entityId);

  const following = override ?? initial ?? false;

  return (
    <Pressable
      style={[styles.pill, following && styles.pillOn]}
      hitSlop={6}
      onPress={() => {
        setOverride(!following);
        mutate();
      }}
    >
      <Text style={[styles.text, following && styles.textOn]}>
        {following ? 'Följer' : 'Följ'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[2],
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLOR.ink4,
  },
  pillOn: { backgroundColor: COLOR.gold, borderColor: COLOR.gold },
  text: { color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.bold },
  textOn: { color: COLOR.bg },
});
