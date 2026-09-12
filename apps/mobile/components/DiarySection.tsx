import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { GlassSheet } from '@/components/GlassSheet';
import { PressableScale } from '@/components/PressableScale';
import { SessionLogger } from '@/components/SessionLogger';
import { useMyBalls } from '@/lib/balls';
import {
  useDiaryEntries, useDeleteNote, noteDate, noteType, entrySeries, entryAvg, entryTotal,
  type DiaryType, type Note,
} from '@/lib/diary';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const LABEL: Record<DiaryType, string> = { traning: 'Träning', tavling: 'Tävling', match: 'Match', ovrigt: 'Övrigt' };
const fmtDate = (d: string) => {
  const dt = new Date(d + 'T12:00:00');
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
};

// DAGBOK — the player's private diary (Remember pillar). Match-prep notes plus
// standalone entries for training and competitions outside league play.
export function DiarySection() {
  const router = useRouter();
  const { data: entries = [] } = useDiaryEntries();
  const [adding, setAdding] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.label}>LOGGBOK</Text>
        <View style={styles.headActions}>
          <PressableScale onPress={() => router.push('/mina-spel' as never)}>
            <Text style={styles.addGold}>Logga spel</Text>
          </PressableScale>
          {entries.length > 0 && (
            <PressableScale onPress={() => setAdding(true)}><Text style={styles.add}>Snabbnotis</Text></PressableScale>
          )}
        </View>
      </View>

      {entries.length === 0 ? (
        <PressableScale style={styles.empty} onPress={() => setAdding(true)}>
          <Ionicons name="add-circle" size={24} color={COLOR.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.emptyTitle}>Börja föra loggbok</Text>
            <Text style={styles.emptySub}>Logga träning, tävling och matcher — privat, bara för dig.</Text>
          </View>
        </PressableScale>
      ) : (
        entries.map((n) => <EntryRow key={n.id} note={n} />)
      )}

      <AddSheet visible={adding} onClose={() => setAdding(false)} />
    </View>
  );
}

function EntryRow({ note }: { note: Note }) {
  const del = useDeleteNote();
  const { data: balls = [] } = useMyBalls();
  const t = noteType(note);
  const ballNames = note.ballIds.map((id) => balls.find((b) => b.id === id)?.name).filter(Boolean) as string[];
  const remove = () => Alert.alert('Ta bort', 'Ta bort anteckningen?', [
    { text: 'Avbryt', style: 'cancel' },
    { text: 'Ta bort', style: 'destructive', onPress: () => del.mutate(note.id) },
  ]);
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.badge}><Text style={styles.badgeText}>{LABEL[t]}</Text></View>
        <Text style={styles.meta}>{fmtDate(noteDate(note))}</Text>
        {!!note.hall && <Text style={styles.meta} numberOfLines={1}>· {note.hall}</Text>}
        <View style={{ flex: 1 }} />
        <PressableScale onPress={remove} accessibilityLabel="Ta bort"><Ionicons name="trash-outline" size={16} color={COLOR.ink4} /></PressableScale>
      </View>
      {note.games && note.games.length > 0 && (
        <View style={styles.gamesRow}>
          <Text style={styles.gamesSeries}>{entrySeries(note).join('  ')}</Text>
          <Text style={styles.gamesMeta}>· ⌀ {entryAvg(note)} · {entryTotal(note)} tot</Text>
        </View>
      )}
      {(!!note.oilPattern || ballNames.length > 0) && (
        <Text style={styles.context} numberOfLines={2}>
          {[note.oilPattern, ballNames.join(', ')].filter(Boolean).join('  ·  ')}
        </Text>
      )}
      {!!note.body && <Text style={styles.body}>{note.body}</Text>}
    </View>
  );
}

function AddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <GlassSheet visible={visible} onClose={onClose} title="Logga spel">
      <SessionLogger onSaved={onClose} />
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACE[4] },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: SPACE[1], marginBottom: SPACE[3] },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.4 },
  headActions: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE[4] },
  add: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold },
  addGold: { color: COLOR.gold, fontSize: TYPE.body, fontFamily: FONT.bold },

  empty: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], padding: SPACE[4], borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(245,194,0,0.08)', borderWidth: 1, borderColor: 'rgba(245,194,0,0.24)' },
  emptyTitle: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  emptySub: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.regular, marginTop: 2 },

  row: { borderBottomWidth: 1, borderBottomColor: COLOR.hairline, paddingVertical: SPACE[3], paddingHorizontal: SPACE[1] },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  badge: { backgroundColor: COLOR.surface2, borderRadius: RADIUS.pill, paddingVertical: 3, paddingHorizontal: 9 },
  badgeText: { color: COLOR.ink2, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.4 },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, flexShrink: 1 },
  body: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.regular, lineHeight: 22, marginTop: 6 },
  context: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.regular, marginTop: 6 },
  gamesRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: SPACE[2], marginTop: 6 },
  gamesSeries: { color: COLOR.ink, fontFamily: FONT.score, fontSize: TYPE.body, fontVariant: ['tabular-nums'] },
  gamesMeta: { color: COLOR.ink3, fontSize: TYPE.caption },
  scoreBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3] },
  scoreBtnText: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  scoreBtnHint: { color: COLOR.ink3, fontSize: TYPE.caption },

  input: { backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3],
    color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.regular },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  save: { backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingVertical: SPACE[4], alignItems: 'center', marginTop: SPACE[2] },
  saveOff: { backgroundColor: COLOR.surface2 },
  saveText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },
  saveTextOff: { color: COLOR.ink3 },
});
