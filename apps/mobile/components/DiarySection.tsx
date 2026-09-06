import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassSheet } from '@/components/GlassSheet';
import { PressableScale } from '@/components/PressableScale';
import { Segmented } from '@/components/Segmented';
import {
  useDiaryEntries, useSaveDiaryEntry, useDeleteNote, noteDate, noteType, type DiaryType, type Note,
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
      <Text style={styles.body}>{note.body}</Text>
    </View>
  );
}

function AddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const save = useSaveDiaryEntry();
  const [type, setType] = useState<DiaryType>('traning');
  const [hall, setHall] = useState('');
  const [body, setBody] = useState('');

  const submit = () => {
    if (!body.trim()) return;
    save.mutate({ body, hall: hall.trim() || null, type, date: todayISO() }, {
      onSuccess: () => { setBody(''); setHall(''); setType('traning'); onClose(); },
    });
  };

  return (
    <GlassSheet visible={visible} onClose={onClose} title="Ny anteckning">
      <View style={{ gap: SPACE[3] }}>
        <Segmented options={TYPE_OPTS} value={type} onChange={setType} />
        <TextInput value={hall} onChangeText={setHall} placeholder="Hall (valfritt)" placeholderTextColor={COLOR.ink4} style={styles.input} />
        <TextInput value={body} onChangeText={setBody} placeholder="Hur gick det? Vad testade du?" placeholderTextColor={COLOR.ink4}
          multiline style={[styles.input, styles.textarea]} />
        <PressableScale style={[styles.save, !body.trim() && styles.saveOff]} onPress={submit} disabled={!body.trim() || save.isPending}>
          <Text style={[styles.saveText, !body.trim() && styles.saveTextOff]}>Spara</Text>
        </PressableScale>
      </View>
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

  input: { backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3],
    color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.regular },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  save: { backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingVertical: SPACE[4], alignItems: 'center', marginTop: SPACE[2] },
  saveOff: { backgroundColor: COLOR.surface2 },
  saveText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },
  saveTextOff: { color: COLOR.ink3 },
});
