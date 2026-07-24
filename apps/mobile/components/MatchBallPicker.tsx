import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BallOrb } from '@/components/BallOrb';
import { GlassSheet } from '@/components/GlassSheet';
import { PressableScale } from '@/components/PressableScale';
import { useMyBalls } from '@/lib/balls';
import { useAttachBall, useDetachBall, useMatchBalls } from '@/lib/diary';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Pick balls from the bag to log against a match. Tapping a row toggles it — a
// checkmark shows what's already attached.
export function MatchBallPicker({
  visible,
  onClose,
  matchId,
  hall,
}: {
  visible: boolean;
  onClose: () => void;
  matchId: number;
  hall: string | null;
}) {
  const router = useRouter();
  const { data: bag = [] } = useMyBalls();
  const { data: attached = [] } = useMatchBalls(matchId);
  const attach = useAttachBall();
  const detach = useDetachBall();

  const inBag = bag.filter((b) => b.inBag);
  const rowFor = (playerBallId: string) => attached.find((a) => a.playerBallId === playerBallId);

  return (
    <GlassSheet visible={visible} onClose={onClose} title="Vilka klot spelade du?">
      {inBag.length === 0 ? (
        <PressableScale
          style={styles.empty}
          onPress={() => {
            onClose();
            router.push('/arsenal/add');
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color={COLOR.gold} />
          <Text style={styles.emptyText}>Din väska är tom — lägg till klot först.</Text>
        </PressableScale>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[8] }}>
          {inBag.map((b) => {
            const row = rowFor(b.id);
            const on = !!row;
            return (
              <PressableScale
                key={b.id}
                style={styles.row}
                onPress={() =>
                  on
                    ? detach.mutate({ rowId: row!.rowId, matchId })
                    : attach.mutate({ matchId, playerBallId: b.id, hall })
                }
              >
                <BallOrb label={`${b.brand ?? ''} ${b.name}`} imageUrl={b.imageUrl} size={40} />
                <View style={styles.text}>
                  <Text style={styles.name} numberOfLines={1}>{b.name}</Text>
                  {b.weight != null && <Text style={styles.meta}>{b.weight} lb</Text>}
                </View>
                <View style={[styles.check, on && styles.checkOn]}>
                  {on && <Ionicons name="checkmark" size={16} color={COLOR.bg} />}
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
      )}
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    paddingVertical: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  text: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: COLOR.ink4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: COLOR.gold, borderColor: COLOR.gold },
  empty: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[4] },
  emptyText: { color: COLOR.ink2, fontSize: TYPE.body, flexShrink: 1 },
});
