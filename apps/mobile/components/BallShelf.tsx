import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BallDetail } from '@/components/BallDetail';
import { BallOrb } from '@/components/BallOrb';
import { GlassSheet } from '@/components/GlassSheet';
import { PressableScale } from '@/components/PressableScale';
import { useMyBalls, type BagBall } from '@/lib/balls';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const ORB = 72;

// The bag as a shelf: a horizontal rail of ball orbs. Tap one → the glass sheet with
// its specs + your notes. Only shown for a signed-in player (mounted from profile).
export function BallShelf() {
  const router = useRouter();
  const { data: balls = [] } = useMyBalls();
  const [selected, setSelected] = useState<BagBall | null>(null);

  const inBag = balls.filter((b) => b.inBag);
  const retired = balls.filter((b) => !b.inBag);
  const ordered = [...inBag, ...retired];

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.label}>DIN VÄSKA</Text>
        {balls.length > 0 && (
          <PressableScale onPress={() => router.push('/arsenal/add')} hitSlop={8}>
            <Text style={styles.add}>Lägg till</Text>
          </PressableScale>
        )}
      </View>

      {balls.length === 0 ? (
        <PressableScale style={styles.empty} onPress={() => router.push('/arsenal/add')}>
          <Ionicons name="add-circle-outline" size={24} color={COLOR.gold} />
          <View style={styles.emptyText}>
            <Text style={styles.emptyTitle}>Bygg din väska</Text>
            <Text style={styles.emptyBody}>Lägg till kloten du spelar med — så minns appen vad du kastar.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLOR.ink3} />
        </PressableScale>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {ordered.map((b) => (
            <PressableScale key={b.id} style={styles.ball} onPress={() => setSelected(b)}>
              <View style={!b.inBag && styles.retiredOrb}>
                <BallOrb label={`${b.brand ?? ''} ${b.name}`} imageUrl={b.imageUrl} size={ORB} />
              </View>
              <Text style={styles.ballName} numberOfLines={1}>{b.name}</Text>
              {b.weight != null && <Text style={styles.ballMeta}>{b.weight} lb</Text>}
            </PressableScale>
          ))}
          <PressableScale style={styles.ball} onPress={() => router.push('/arsenal/add')}>
            <View style={[styles.addTile, { width: ORB, height: ORB, borderRadius: ORB / 2 }]}>
              <Ionicons name="add" size={30} color={COLOR.ink3} />
            </View>
            <Text style={styles.ballMeta}>Lägg till</Text>
          </PressableScale>
        </ScrollView>
      )}

      <GlassSheet visible={!!selected} onClose={() => setSelected(null)} title="Klot">
        {selected && <BallDetail ball={selected} onClose={() => setSelected(null)} />}
      </GlassSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: SPACE[3] },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  add: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },

  rail: { gap: SPACE[4], paddingRight: SPACE[4], paddingVertical: SPACE[1] },
  ball: { alignItems: 'center', width: ORB + 12, gap: 6 },
  retiredOrb: { opacity: 0.4 },
  ballName: { color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.semibold, maxWidth: ORB + 10, textAlign: 'center' },
  ballMeta: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.medium },
  addTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLOR.hairline,
    borderStyle: 'dashed',
    backgroundColor: COLOR.surface,
  },

  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    padding: SPACE[4],
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(245,194,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.24)',
  },
  emptyText: { flex: 1, minWidth: 0, gap: 2 },
  emptyTitle: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  emptyBody: { color: COLOR.ink3, fontSize: TYPE.caption, lineHeight: 18 },
});
