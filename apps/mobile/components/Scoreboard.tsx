import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { scoreGame, frameMarks, framesOf, maxNextRoll, isGameComplete, gameTotal, type Game } from '@bowlkollen/core';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// Ten-pin scoreboard for a session — one or more games scored live via
// @bowlkollen/core. Fill in practice/comp/league; onSave hands back the games.
export function Scoreboard({ visible, initial, onClose, onSave }: {
  visible: boolean;
  initial?: Game[];
  onClose: () => void;
  onSave: (games: Game[]) => void;
}) {
  const [games, setGames] = useState<number[][]>(initial?.length ? initial.map((g) => g.rolls) : [[]]);
  const [gi, setGi] = useState(0);
  const rolls = games[gi] ?? [];

  const setRolls = (next: number[]) => setGames((gs) => gs.map((g, i) => (i === gi ? next : g)));
  const addRoll = (p: number) => { if (!isGameComplete(rolls)) setRolls([...rolls, p]); };
  const undo = () => setRolls(rolls.slice(0, -1));
  const addGame = () => { setGames((gs) => [...gs, []]); setGi(games.length); };

  const mx = maxNextRoll(rolls);
  const over = isGameComplete(rolls);
  const { frames: cum } = scoreGame(rolls);
  const marks = frameMarks(rolls);
  const fs = framesOf(rolls);
  const lastDone = fs.length > 0 && (fs.length < 10 ? (fs[fs.length - 1][0] === 10 || fs[fs.length - 1].length === 2) : true);
  const active = over ? -1 : (fs.length === 0 ? 0 : lastDone ? fs.length : fs.length - 1);
  const onSecond = !over && fs.length > 0 && !lastDone && fs[fs.length - 1].length >= 1 && mx > 0 && mx < 10;

  const sessionGames = games.filter((g) => g.length > 0);
  const sessionTotal = sessionGames.reduce((a, g) => a + gameTotal(g), 0);
  const save = () => onSave(sessionGames.map((g) => ({ rolls: g, total: gameTotal(g) })));

  const markColor = (m: string) => (m === 'X' ? COLOR.gold : m === '/' ? COLOR.green : COLOR.ink);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>Poängräkning</Text>
            <View style={styles.tabs}>
              {games.map((_, i) => (
                <PressableScale key={i} style={[styles.tab, i === gi && styles.tabOn]} onPress={() => setGi(i)}>
                  <Text style={[styles.tabText, i === gi && styles.tabTextOn]}>{i + 1}</Text>
                </PressableScale>
              ))}
              <PressableScale onPress={addGame} accessibilityLabel="Nytt spel"><Ionicons name="add" size={22} color={COLOR.ink3} /></PressableScale>
            </View>
            <View style={{ flex: 1 }} />
            <PressableScale onPress={onClose} accessibilityLabel="Stäng"><Ionicons name="close" size={24} color={COLOR.ink3} /></PressableScale>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
            <View style={styles.grid}>
              {Array.from({ length: 10 }).map((_, i) => {
                const m = marks[i] ?? [];
                const boxes = i === 9 ? 3 : 2;
                return (
                  <View key={i} style={[styles.fr, i === 9 && styles.fr10, i === active && styles.frActive]}>
                    <Text style={styles.frn}>{i + 1}</Text>
                    <View style={styles.balls}>
                      {Array.from({ length: boxes }).map((_, b) => (
                        <View key={b} style={[styles.bx, b > 0 && styles.bxBorder]}>
                          <Text style={[styles.bxText, { color: markColor(m[b] ?? '') }]}>{m[b] ?? ''}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.cum, cum[i] === null && styles.cumPending]}>{cum[i] === null ? '' : cum[i]}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.totalRow}>
            <Text style={styles.total}>{gameTotal(rolls)}</Text>
            <Text style={styles.totalLabel}>{over ? `spel ${gi + 1} klart` : `spel ${gi + 1} · löpande`}{sessionGames.length > 1 ? ` · session ${sessionTotal}` : ''}</Text>
          </View>

          <View style={styles.pad}>
            <View style={styles.numGrid}>
              {Array.from({ length: 10 }).map((_, n) => (
                <Pressable key={n} onPress={() => addRoll(n)} disabled={over || n > mx}
                  style={[styles.key, (over || n > mx) && styles.keyOff]}>
                  <Text style={styles.keyText}>{n === 0 ? '–' : n}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.actRow}>
              <Pressable onPress={() => addRoll(10)} disabled={over || mx < 10} style={[styles.act, styles.strike, (over || mx < 10) && styles.keyOff]}><Text style={styles.strikeText}>Strike</Text></Pressable>
              <Pressable onPress={() => addRoll(mx)} disabled={!onSecond} style={[styles.act, styles.spare, !onSecond && styles.keyOff]}><Text style={styles.spareText}>Spärr /</Text></Pressable>
              <Pressable onPress={undo} disabled={rolls.length === 0} style={[styles.undo, rolls.length === 0 && styles.keyOff]}><Ionicons name="backspace-outline" size={20} color={COLOR.ink2} /></Pressable>
            </View>
            <PressableScale style={[styles.save, sessionGames.length === 0 && styles.saveOff]} onPress={save} disabled={sessionGames.length === 0}>
              <Text style={[styles.saveText, sessionGames.length === 0 && styles.saveTextOff]}>Klar{sessionGames.length > 1 ? ` · ${sessionGames.length} spel` : ''}</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLOR.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: SPACE[8] },
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], padding: SPACE[4] },
  title: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  tab: { width: 30, height: 30, borderRadius: 999, borderWidth: 1, borderColor: COLOR.ink4, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: COLOR.surface2, borderColor: COLOR.surface2 },
  tabText: { color: COLOR.ink3, fontFamily: FONT.bold, fontSize: TYPE.caption },
  tabTextOn: { color: COLOR.ink },

  sheetScroll: { paddingHorizontal: SPACE[4] },
  grid: { flexDirection: 'row', borderWidth: 1, borderColor: COLOR.hairline, borderRadius: 10, overflow: 'hidden' },
  fr: { width: 52, borderRightWidth: 1, borderRightColor: COLOR.hairline },
  fr10: { width: 74, borderRightWidth: 0 },
  frActive: { backgroundColor: 'rgba(245,194,0,0.08)' },
  frn: { textAlign: 'center', fontSize: 11, color: COLOR.ink4, fontFamily: FONT.bold, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  balls: { flexDirection: 'row', height: 26 },
  bx: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bxBorder: { borderLeftWidth: 1, borderLeftColor: COLOR.hairline },
  bxText: { fontFamily: FONT.score, fontSize: 15, fontVariant: ['tabular-nums'] },
  cum: { height: 32, textAlign: 'center', textAlignVertical: 'center', fontFamily: FONT.score, fontSize: 18, color: COLOR.ink, fontVariant: ['tabular-nums'] },
  cumPending: { color: COLOR.ink4 },

  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE[3], paddingHorizontal: SPACE[4], paddingTop: SPACE[3] },
  total: { fontFamily: FONT.scoreHeavy, fontSize: 38, color: COLOR.ink, fontVariant: ['tabular-nums'] },
  totalLabel: { color: COLOR.ink3, fontSize: TYPE.caption },

  pad: { padding: SPACE[4] },
  numGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] },
  key: { width: '15.2%', aspectRatio: 1.3, borderRadius: 12, backgroundColor: COLOR.surface2, alignItems: 'center', justifyContent: 'center' },
  keyOff: { opacity: 0.28 },
  keyText: { color: COLOR.ink, fontFamily: FONT.score, fontSize: 20 },
  actRow: { flexDirection: 'row', gap: SPACE[2], marginTop: SPACE[2] },
  act: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  strike: { backgroundColor: 'rgba(245,194,0,0.16)' },
  strikeText: { color: COLOR.gold, fontFamily: FONT.bold, fontSize: TYPE.body },
  spare: { backgroundColor: 'rgba(48,212,126,0.14)' },
  spareText: { color: COLOR.green, fontFamily: FONT.bold, fontSize: TYPE.body },
  undo: { paddingHorizontal: SPACE[4], height: 48, borderRadius: 12, borderWidth: 1, borderColor: COLOR.hairline, alignItems: 'center', justifyContent: 'center' },
  save: { marginTop: SPACE[3], paddingVertical: SPACE[4], borderRadius: 12, backgroundColor: COLOR.gold, alignItems: 'center' },
  saveOff: { backgroundColor: COLOR.surface2 },
  saveText: { color: COLOR.bg, fontFamily: FONT.bold, fontSize: TYPE.body },
  saveTextOff: { color: COLOR.ink3 },
});
