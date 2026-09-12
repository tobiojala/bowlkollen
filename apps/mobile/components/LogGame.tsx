import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { PinDeck } from '@/components/PinDeck';
import { leaveName, isSplit, type Game } from '@bowlkollen/core';
import { useLogGame } from '@/lib/use-log-game';
import { COLOR, FONT, SPACE } from '@/theme';

const box = (m: string[], tenth: boolean): string[] =>
  tenth ? [m[0] ?? '', m[1] ?? '', m[2] ?? ''] : (m.length === 1 && m[0] === 'X' ? ['', 'X'] : [m[0] ?? '', m[1] ?? '']);

// Score one serie via the pin deck (parity with web): each ball, tap the käglor
// that stood. Scores itself (core) and captures open-frame leaves. When done, the
// serie is handed up via onComplete — SessionLogger collects series and saves.
export function LogGame({ onComplete }: { onComplete: (game: Game) => void }) {
  const g = useLogGame();

  const stand = [...g.standing].sort((a, b) => a - b);
  const hal = isSplit(stand);
  const readout = stand.length === 0 ? (g.ball === 1 ? 'Strike' : 'Spärr') : leaveName(stand) + (hal ? '  ·  hål' : '');
  const readColor = stand.length === 0 && g.ball === 1 ? COLOR.gold : hal ? COLOR.red : COLOR.ink;

  const add = () => { if (g.game) { onComplete(g.game); g.reset(); } };
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

      {!g.done ? (
        // Thumb-first: readout + total, then the deck, then Klar right under it.
        <View style={{ marginTop: SPACE[4] }}>
          <View style={s.readRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.step}>Ruta {g.frame + 1} · Kast {g.ball}</Text>
              <Text style={[s.rd, { color: readColor }]}>{readout}</Text>
            </View>
            <Text style={s.totalInline}>{g.total}</Text>
          </View>
          <View style={s.deckWrap}>
            <PinDeck available={g.available} standing={g.standing} onToggle={g.toggle} />
          </View>
          <View style={s.brow}>
            <PressableScale style={[s.btnP, { flex: 2 }]} onPress={g.confirm}><Text style={s.btnPT}>Klar</Text></PressableScale>
            <PressableScale style={[s.btnG, { flex: 1 }, !g.canUndo && { opacity: 0.5 }]} onPress={g.undo} disabled={!g.canUndo}><Text style={s.btnGT}>Ångra</Text></PressableScale>
          </View>
          <Text style={s.hint}>Tryck på käglorna som stod kvar. Inga kvar = strike / spärr.</Text>
        </View>
      ) : (
        <View style={s.done}>
          <Text style={s.doneQ}>{g.total === 300 ? 'PERFEKT · 300!' : `Serie klar · ${g.total}`}</Text>
          <Text style={s.doneSub}>Lägg serien i loggen och räkna nästa, eller spara nedan.</Text>
          <View style={s.brow}>
            <PressableScale style={[s.btnP, { backgroundColor: COLOR.gold, flex: 2 }]} onPress={add}><Text style={s.btnPT}>Lägg till serie</Text></PressableScale>
            <PressableScale style={[s.btnG, { flex: 1 }]} onPress={g.reset}><Text style={s.btnGT}>Gör om</Text></PressableScale>
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
  readRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACE[3] },
  totalInline: { fontFamily: FONT.scoreHeavy, fontSize: 30, color: COLOR.ink, letterSpacing: -1 },
  deckWrap: { alignItems: 'center', marginTop: SPACE[3] },
  step: { fontSize: 12, color: COLOR.ink4, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT.bold },
  rd: { fontFamily: FONT.scoreHeavy, fontSize: 24, marginTop: 4, letterSpacing: -0.5 },
  hint: { fontSize: 13, color: COLOR.ink3, marginTop: SPACE[3], fontFamily: FONT.regular, textAlign: 'center' },
  brow: { flexDirection: 'row', gap: SPACE[2], marginTop: SPACE[4] },
  btnP: { backgroundColor: COLOR.ink, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnPT: { color: COLOR.bg, fontFamily: FONT.bold, fontSize: 16 },
  btnG: { borderRadius: 12, paddingVertical: 15, borderWidth: 1, borderColor: COLOR.hairline, alignItems: 'center' },
  btnGT: { color: COLOR.ink2, fontFamily: FONT.bold, fontSize: 15 },
  done: { marginTop: SPACE[4], padding: SPACE[4], borderRadius: 14, backgroundColor: COLOR.surface },
  doneQ: { fontFamily: FONT.display, fontSize: 20, color: COLOR.ink },
  doneSub: { fontSize: 13, color: COLOR.ink3, marginTop: 6, fontFamily: FONT.regular },
  slog: { marginTop: SPACE[6], borderTopWidth: 1, borderTopColor: COLOR.hairline, paddingTop: SPACE[4] },
  slogH: { fontSize: 13, fontFamily: FONT.bold, letterSpacing: 0.4, color: COLOR.ink3, marginBottom: SPACE[2] },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[2] },
  lf: { fontFamily: FONT.score, fontSize: 12, color: COLOR.ink4, width: 52 },
  llv: { fontFamily: FONT.score, fontSize: 14, color: COLOR.ink, flex: 1 },
  lr: { fontSize: 13, fontFamily: FONT.semibold },
});
