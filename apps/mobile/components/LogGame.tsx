import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { PinDeck } from '@/components/PinDeck';
import { leaveName, isSplit } from '@bowlkollen/core';
import { useSaveDiaryEntry } from '@/lib/diary';
import { useLogGame } from '@/lib/use-log-game';
import { COLOR, FONT, SPACE } from '@/theme';

const box = (m: string[], tenth: boolean): string[] =>
  tenth ? [m[0] ?? '', m[1] ?? '', m[2] ?? ''] : (m.length === 1 && m[0] === 'X' ? ['', 'X'] : [m[0] ?? '', m[1] ?? '']);

// Log a full game via the pin deck (parity with web): each ball, tap the käglor
// that stood. Scores itself (core) and captures open-frame leaves for Spärranalys.
export function LogGame({ onSaved }: { onSaved?: () => void }) {
  const g = useLogGame();
  const save = useSaveDiaryEntry();
  const [hall, setHall] = useState('');

  const stand = [...g.standing].sort((a, b) => a - b);
  const hal = isSplit(stand);
  const readout = stand.length === 0 ? (g.ball === 1 ? 'Strike' : 'Spärr') : leaveName(stand) + (hal ? '  ·  hål' : '');
  const readColor = stand.length === 0 && g.ball === 1 ? COLOR.gold : hal ? COLOR.red : COLOR.ink;

  const commit = () => {
    if (!g.game) return;
    save.mutate({ body: '', hall: hall.trim() || null, type: 'match', date: new Date().toISOString().slice(0, 10), games: [g.game] },
      { onSuccess: () => { g.reset(); setHall(''); onSaved?.(); } });
  };
  const shownLeaves = g.leaves.filter((l) => l.converted || l.residual.length);

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={s.sb}>
          {Array.from({ length: 10 }).map((_, f) => {
            const bx = box(g.marks[f] ?? [], f === 9), cur = f === g.frame && !g.done;
            return (
              <View key={f} style={[s.fr, f === 9 && s.fr10, cur && s.frCur]}>
                <Text style={s.fn}>{f + 1}</Text>
                <View style={s.balls}>
                  {bx.map((m, k) => (
                    <View key={k} style={[s.bx, k > 0 && s.bxBorder]}>
                      <Text style={[s.bxT, { color: m === 'X' ? COLOR.gold : m === '–' ? COLOR.ink4 : COLOR.ink }]}>{m}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[s.cum, g.cum[f] == null && { color: COLOR.ink4 }]}>{g.cum[f] ?? '·'}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.totalRow}>
        <Text style={s.total}>{g.total}</Text>
        <Text style={s.totalK}>{g.done ? 'slutresultat' : 'löpande summa'}</Text>
      </View>

      {!g.done ? (
        <View style={s.ball}>
          <PinDeck available={g.available} standing={g.standing} onToggle={g.toggle} />
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={s.step}>Ruta {g.frame + 1} · Kast {g.ball}</Text>
            <Text style={[s.rd, { color: readColor }]}>{readout}</Text>
            <Text style={s.hint}>Tryck på käglorna som stod kvar. Inga kvar = strike / spärr.</Text>
            <View style={s.brow}>
              <PressableScale style={s.btnP} onPress={g.confirm}><Text style={s.btnPT}>Klar</Text></PressableScale>
              <PressableScale style={[s.btnG, !g.canUndo && { opacity: 0.5 }]} onPress={g.undo} disabled={!g.canUndo}><Text style={s.btnGT}>Ångra</Text></PressableScale>
            </View>
          </View>
        </View>
      ) : (
        <View style={s.done}>
          <Text style={s.doneQ}>{g.total === 300 ? 'PERFEKT · 300!' : `Serie klar · ${g.total}`}</Text>
          <TextInput value={hall} onChangeText={setHall} placeholder="Hall (valfritt)" placeholderTextColor={COLOR.ink4} style={s.input} />
          <View style={s.brow}>
            <PressableScale style={[s.btnP, { backgroundColor: COLOR.gold }]} onPress={commit} disabled={save.isPending}><Text style={s.btnPT}>Spara serie</Text></PressableScale>
            <PressableScale style={s.btnG} onPress={g.reset}><Text style={s.btnGT}>Ny serie</Text></PressableScale>
          </View>
        </View>
      )}

      {shownLeaves.length > 0 && (
        <View style={s.slog}>
          <Text style={s.slogH}>LÄMNINGAR DENNA SERIE</Text>
          {shownLeaves.map((l, i) => {
            const nm = leaveName(l.pins), lh = isSplit(l.pins);
            const res = l.converted ? 'spärr ✓' : 'lämnade ' + [...l.residual].sort((a, b) => a - b).join('–');
            return (
              <View key={i} style={[s.lrow, i > 0 && { borderTopWidth: 1, borderTopColor: COLOR.hairline }]}>
                <Text style={s.lf}>RUTA {l.frame + 1}</Text>
                <Text style={s.llv}>{nm}{lh ? ' · hål' : ''}</Text>
                <Text style={[s.lr, { color: l.converted ? COLOR.green : lh ? COLOR.red : COLOR.ink3 }]}>{res}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  sb: { flexDirection: 'row', borderWidth: 1, borderColor: COLOR.hairline, borderRadius: 12, overflow: 'hidden' },
  fr: { width: 46, borderRightWidth: 1, borderRightColor: COLOR.hairline },
  fr10: { width: 66, borderRightWidth: 0 },
  frCur: { backgroundColor: 'rgba(245,194,0,0.06)' },
  fn: { fontSize: 10, color: COLOR.ink4, textAlign: 'center', paddingVertical: 4, fontFamily: FONT.bold },
  balls: { flexDirection: 'row', height: 30, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLOR.hairline },
  bx: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bxBorder: { borderLeftWidth: 1, borderLeftColor: COLOR.hairline },
  bxT: { fontFamily: FONT.score, fontSize: 15 },
  cum: { height: 30, textAlign: 'center', textAlignVertical: 'center', fontFamily: FONT.scoreHeavy, fontSize: 16, color: COLOR.ink },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE[3], marginTop: SPACE[4] },
  total: { fontFamily: FONT.scoreHeavy, fontSize: 38, color: COLOR.ink, letterSpacing: -1 },
  totalK: { fontSize: 13, color: COLOR.ink3, fontFamily: FONT.regular },
  ball: { flexDirection: 'row', gap: SPACE[6], alignItems: 'center', marginTop: SPACE[4], flexWrap: 'wrap' },
  step: { fontSize: 12, color: COLOR.ink4, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT.bold },
  rd: { fontFamily: FONT.scoreHeavy, fontSize: 24, marginTop: 4, letterSpacing: -0.5 },
  hint: { fontSize: 13, color: COLOR.ink3, marginTop: SPACE[2], fontFamily: FONT.regular },
  brow: { flexDirection: 'row', gap: SPACE[2], marginTop: SPACE[4] },
  btnP: { backgroundColor: COLOR.ink, borderRadius: 11, paddingVertical: 12, paddingHorizontal: 22 },
  btnPT: { color: COLOR.bg, fontFamily: FONT.bold, fontSize: 15 },
  btnG: { borderRadius: 11, paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: COLOR.hairline },
  btnGT: { color: COLOR.ink2, fontFamily: FONT.bold, fontSize: 15 },
  done: { marginTop: SPACE[4], padding: SPACE[4], borderRadius: 14, backgroundColor: COLOR.surface },
  doneQ: { fontFamily: FONT.display, fontSize: 20, color: COLOR.ink },
  input: { marginTop: SPACE[3], backgroundColor: COLOR.surface2, borderRadius: 10, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], color: COLOR.ink, fontSize: 15, fontFamily: FONT.regular },
  slog: { marginTop: SPACE[6], borderTopWidth: 1, borderTopColor: COLOR.hairline, paddingTop: SPACE[4] },
  slogH: { fontSize: 13, fontFamily: FONT.bold, letterSpacing: 0.4, color: COLOR.ink3, marginBottom: SPACE[2] },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[2] },
  lf: { fontFamily: FONT.score, fontSize: 12, color: COLOR.ink4, width: 52 },
  llv: { fontFamily: FONT.score, fontSize: 14, color: COLOR.ink, flex: 1 },
  lr: { fontSize: 13, fontFamily: FONT.semibold },
});
