import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassSheet } from '@/components/GlassSheet';
import { PressableScale } from '@/components/PressableScale';
import { Scoreboard } from '@/components/Scoreboard';
import { Segmented } from '@/components/Segmented';
import {
  useDiaryEntries, useSaveDiaryEntry, useDeleteNote, noteDate, noteType, entrySeries, entryAvg, entryTotal,
  type DiaryType, type Note, type Game,
} from '@/lib/diary';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const TYPE_OPTS: { key: DiaryType; label: string }[] = [
  { key: 'traning', label: 'Träning' }, { key: 'tavling', label: 'Tävling' },
  { key: 'match', label: 'Match' }, { key: 'ovrigt', label: 'Övrigt' },
];
const LABEL: Record<DiaryType, string> = { traning: 'Träning', tavling: 'Tävling', match: 'Match', ovrigt: 'Övrigt' };
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: string) => {
  const dt = new Date(d + 'T12:00:00');
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
};

// DAGBOK — the player's private diary (Remember pillar). Match-prep notes plus
// standalone entries for training and competitions outside league play.
export function DiarySection() {
  const { data: entries = [] } = useDiaryEntries();
  const [adding, setAdding] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.label}>LOGGBOK</Text>
        {entries.length > 0 && (
          <PressableScale onPress={() => setAdding(true)}><Text style={styles.add}>Ny anteckning</Text></PressableScale>
        )}
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
  const t = noteType(note);
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
      {!!note.body && <Text style={styles.body}>{note.body}</Text>}
    </View>
  );
}

function AddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const save = useSaveDiaryEntry();
  const [type, setType] = useState<DiaryType>('traning');
  const [hall, setHall] = useState('');
  const [body, setBody] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [board, setBoard] = useState(false);

  const canSave = body.trim().length > 0 || games.length > 0;
  const reset = () => { setBody(''); setHall(''); setType('traning'); setGames([]); };
  const submit = () => {
    if (!canSave) return;
    save.mutate({ body, hall: hall.trim() || null, type, date: todayISO(), games }, {
      onSuccess: () => { reset(); onClose(); },
    });
  };
  const gTotal = games.reduce((a, g) => a + g.total, 0);
  const gAvg = games.length ? Math.round(gTotal / games.length) : 0;

  return (
    <GlassSheet visible={visible} onClose={onClose} title="Ny anteckning">
      <View style={{ gap: SPACE[3] }}>
        <Segmented options={TYPE_OPTS} value={type} onChange={setType} />
        <TextInput value={hall} onChangeText={setHall} placeholder="Hall (valfritt)" placeholderTextColor={COLOR.ink4} style={styles.input} />
        <TextInput value={body} onChangeText={setBody} placeholder="Hur gick det? Vad testade du?" placeholderTextColor={COLOR.ink4}
          multiline style={[styles.input, styles.textarea]} />
        <PressableScale style={styles.scoreBtn} onPress={() => setBoard(true)}>
          <Ionicons name="list" size={20} color={games.length ? COLOR.gold : COLOR.ink3} />
          <Text style={styles.scoreBtnText}>{games.length ? `${games.length} spel · ⌀ ${gAvg} · ${gTotal} tot` : 'Lägg till spel'}</Text>
          <Text style={styles.scoreBtnHint}>{games.length ? 'Ändra' : 'Poängräkning'}</Text>
        </PressableScale>
        <PressableScale style={[styles.save, !canSave && styles.saveOff]} onPress={submit} disabled={!canSave || save.isPending}>
          <Text style={[styles.saveText, !canSave && styles.saveTextOff]}>Spara</Text>
        </PressableScale>
      </View>
      <Scoreboard visible={board} initial={games} onClose={() => setBoard(false)} onSave={(g) => { setGames(g); setBoard(false); }} />
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACE[4] },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: SPACE[1], marginBottom: SPACE[3] },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.4 },
  add: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold },

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
