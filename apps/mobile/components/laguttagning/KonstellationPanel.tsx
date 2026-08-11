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
// together. Cardless list to match the app; names stack so they never crowd the record.
// Win-rate tints green only when strong, never colour alone. Tap + to seat the pair.
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
    <View style={styles.section}>
      <Text style={styles.label}>BÄSTA KONSTELLATIONER</Text>
      {top.map((p) => {
        const a: Person = { publicId: p.aPublicId, name: nameById.get(p.aPublicId)! };
        const b: Person = { publicId: p.bPublicId, name: nameById.get(p.bPublicId)! };
        const bothFree = !seatedIds.has(a.publicId) && !seatedIds.has(b.publicId);
        const pct = Math.round(p.winRate * 100);
        return (
          <View key={`${p.aPublicId}-${p.bPublicId}`} style={styles.row}>
            <View style={styles.names}>
              <Pressable hitSlop={4} onPress={() => onOpenPlayer(a.publicId)}>
                <Text style={styles.nameA} numberOfLines={1}>{a.name}</Text>
              </Pressable>
              <Pressable hitSlop={4} onPress={() => onOpenPlayer(b.publicId)}>
                <Text style={styles.nameB} numberOfLines={1}>{b.name}</Text>
              </Pressable>
            </View>

            <View style={styles.stat}>
              <Text style={styles.rec}>{p.wins}–{p.losses}</Text>
              <Text style={[styles.pct, pct >= 60 && styles.pctStrong]}>{pct}% · {p.together} ihop</Text>
            </View>

            {bothFree ? (
              <PressableScale
                style={styles.seat}
                onPress={() => onSeatPair(a, b)}
                hitSlop={8}
                accessibilityLabel={`Placera ${a.name} och ${b.name}`}
              >
                <Ionicons name="add" size={22} color={COLOR.ink} />
              </PressableScale>
            ) : (
              <View style={styles.seat}><Ionicons name="checkmark" size={20} color={COLOR.ink4} /></View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: SPACE[4] },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[1] },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3],
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLOR.surface2,
  },
  names: { flex: 1, minWidth: 0, gap: 1 },
  nameA: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  nameB: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  stat: { alignItems: 'flex-end', minWidth: 74 },
  rec: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  pct: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, fontVariant: ['tabular-nums'], marginTop: 1 },
  pctStrong: { color: COLOR.green },
  seat: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLOR.surface2, backgroundColor: COLOR.surface,
  },
});
