import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { useKonstellationer } from '@/lib/konstellationer';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const MIN_TOGETHER = 4; // enough shared bords to be a real pairing, not a fluke
const TOP_N = 4;

type Person = { publicId: string; name: string };

// "Bästa konstellationer": among the lineup candidates, the pairs with the strongest
// historical record as a 2-man konstellation — so the captain can seat proven pairs
// together. Records are numbers (win first); win-rate tints green only when genuinely
// strong, never carrying meaning by colour alone. Tap to seat both into an empty banpar.
export function KonstellationPanel({
  candidates,
  seatedIds,
  onSeatPair,
  onOpenPlayer,
}: {
  candidates: Person[];
  seatedIds: Set<string>;
  onSeatPair: (a: Person, b: Person) => void;
  onOpenPlayer: (publicId: string) => void;
}) {
  const { data: pairs = [] } = useKonstellationer(candidates.map((c) => c.publicId));
  const nameById = new Map(candidates.map((c) => [c.publicId, c.name] as const));

  const top = pairs
    .filter((p) => p.together >= MIN_TOGETHER && nameById.has(p.aPublicId) && nameById.has(p.bPublicId))
    .sort((a, b) => b.winRate - a.winRate || b.together - a.together)
    .slice(0, TOP_N);

  if (!top.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>BÄSTA KONSTELLATIONER</Text>
      {top.map((p) => {
        const a: Person = { publicId: p.aPublicId, name: nameById.get(p.aPublicId)! };
        const b: Person = { publicId: p.bPublicId, name: nameById.get(p.bPublicId)! };
        const bothFree = !seatedIds.has(a.publicId) && !seatedIds.has(b.publicId);
        const pct = Math.round(p.winRate * 100);
        return (
          <View key={`${p.aPublicId}-${p.bPublicId}`} style={styles.row}>
            <View style={styles.names}>
              <Pressable hitSlop={6} onPress={() => onOpenPlayer(a.publicId)}>
                <Text style={styles.name} numberOfLines={1}>{a.name}</Text>
              </Pressable>
              <Text style={styles.plus}>+</Text>
              <Pressable hitSlop={6} onPress={() => onOpenPlayer(b.publicId)}>
                <Text style={styles.name} numberOfLines={1}>{b.name}</Text>
              </Pressable>
            </View>
            <View style={styles.stat}>
              <Text style={styles.rec}>{p.wins}–{p.losses}</Text>
              <Text style={[styles.pct, pct >= 60 && styles.pctStrong]}>{pct}%</Text>
            </View>
            {bothFree ? (
              <PressableScale
                style={styles.seat}
                onPress={() => onSeatPair(a, b)}
                hitSlop={6}
                accessibilityLabel={`Placera ${a.name} och ${b.name}`}
              >
                <Ionicons name="add" size={22} color={COLOR.bg} />
              </PressableScale>
            ) : (
              <View style={styles.seated}><Ionicons name="checkmark" size={16} color={COLOR.ink3} /></View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACE[4], padding: SPACE[4], borderRadius: RADIUS.lg,
    backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.surface2,
  },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[2] },
  names: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  name: { color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  plus: { color: COLOR.ink4, fontSize: TYPE.caption, fontFamily: FONT.bold },
  stat: { alignItems: 'flex-end', minWidth: 54 },
  rec: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  pct: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold, fontVariant: ['tabular-nums'] },
  pctStrong: { color: COLOR.green },
  seat: {
    width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLOR.gold,
  },
  seated: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
