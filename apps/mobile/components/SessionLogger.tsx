import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EntryMeta, type EntryMetaValue } from '@/components/EntryMeta';
import { LogGame } from '@/components/LogGame';
import { PressableScale } from '@/components/PressableScale';
import type { Game } from '@bowlkollen/core';
import { useSaveDiaryEntry } from '@/lib/diary';
import { COLOR, FONT, RADIUS, SPACE } from '@/theme';

const EMPTY: EntryMetaValue = { type: 'traning', hall: '', note: '', ballIds: [], oil: '' };
const todayISO = () => new Date().toISOString().slice(0, 10);

// One logging session (parity with web): score serie after serie on the pin deck,
// attach the context (center, oil, käglor, note), and save it as one loggbok entry.
export function SessionLogger({ onSaved, defaultType }: { onSaved?: () => void; defaultType?: EntryMetaValue['type'] }) {
  const save = useSaveDiaryEntry();
  const [games, setGames] = useState<Game[]>([]);
  const [meta, setMeta] = useState<EntryMetaValue>({ ...EMPTY, type: defaultType ?? 'traning' });

  const total = games.reduce((a, g) => a + g.total, 0);
  const avg = games.length ? Math.round(total / games.length) : 0;
  const canSave = games.length > 0 || meta.note.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    save.mutate(
      { body: meta.note, hall: meta.hall.trim() || null, type: meta.type, date: todayISO(), games, oilPattern: meta.oil, ballIds: meta.ballIds },
      { onSuccess: () => { setGames([]); setMeta({ ...EMPTY, type: defaultType ?? 'traning' }); onSaved?.(); } },
    );
  };

  return (
    <View>
      <LogGame onComplete={(g) => setGames((gs) => [...gs, g])} />

      {games.length > 0 && (
        <View style={s.list}>
          <View style={s.listHead}>
            <Text style={s.listHeadT}>{games.length} serie{games.length > 1 ? 'r' : ''} i loggen</Text>
            <Text style={s.listHeadM}><Text style={s.tot}>{total}</Text> tot · ⌀ {avg}</Text>
          </View>
          {games.map((g, i) => (
            <View key={i} style={s.serie}>
              <Text style={s.serieN}>SERIE {i + 1}</Text>
              <Text style={s.serieV}>{g.total}</Text>
              <PressableScale onPress={() => setGames((gs) => gs.filter((_, k) => k !== i))}><Text style={s.rm}>Ta bort</Text></PressableScale>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: SPACE[6] }}>
        <EntryMeta value={meta} onChange={setMeta} />
      </View>

      <PressableScale style={[s.save, !canSave && s.saveOff]} onPress={submit} disabled={!canSave || save.isPending}>
        <Text style={[s.saveT, !canSave && { color: COLOR.ink3 }]}>Spara i loggboken</Text>
      </PressableScale>
    </View>
  );
}

const s = StyleSheet.create({
  list: { marginTop: SPACE[6], borderWidth: 1, borderColor: COLOR.hairline, borderRadius: RADIUS.lg, overflow: 'hidden' },
  listHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], backgroundColor: COLOR.surface },
  listHeadT: { fontSize: 12, fontFamily: FONT.bold, letterSpacing: 0.6, color: COLOR.ink3 },
  listHeadM: { fontSize: 13, color: COLOR.ink3, fontFamily: FONT.regular },
  tot: { fontFamily: FONT.scoreHeavy, color: COLOR.ink },
  serie: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], borderTopWidth: 1, borderTopColor: COLOR.hairline },
  serieN: { fontSize: 12, fontFamily: FONT.bold, color: COLOR.ink4, width: 60 },
  serieV: { flex: 1, fontFamily: FONT.scoreHeavy, fontSize: 18, color: COLOR.ink },
  rm: { fontSize: 13, color: COLOR.ink4, fontFamily: FONT.semibold },
  save: { marginTop: SPACE[6], backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingVertical: SPACE[4], alignItems: 'center' },
  saveOff: { backgroundColor: COLOR.surface2 },
  saveT: { color: COLOR.bg, fontFamily: FONT.bold, fontSize: 15 },
});
