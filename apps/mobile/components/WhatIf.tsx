import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassSheet } from '@/components/GlassSheet';
import { PressableScale } from '@/components/PressableScale';
import { Slider } from '@/components/Slider';
import type { PlayerMatch } from '@/lib/player-stats';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const NEXT_GAMES = 4; // a league match is 4 games

// "Vad händer om…" — a compact card that opens a slider projecting how next match's
// snitt would move your season average. Ported from the web WhatIfCard/Sheet.
export function WhatIf({ history, seasonAvg }: { history: PlayerMatch[]; seasonAvg: number | null }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(210);
  const games = history.flatMap((h) => (h.series ?? []).filter((g) => g > 0));
  if (seasonAvg == null || games.length === 0) return null;

  const totalSum = games.reduce((a, b) => a + b, 0);
  const projAvg = Math.round((totalSum + val * NEXT_GAMES) / (games.length + NEXT_GAMES));
  const diff = projAvg - seasonAvg;
  const dColor = diff > 0 ? COLOR.green : diff < 0 ? COLOR.red : COLOR.ink3;

  return (
    <>
      <PressableScale style={styles.card} onPress={() => setOpen(true)} accessibilityLabel="Vad händer om">
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>VAD HÄNDER OM…</Text>
          <Text style={styles.cardSub}>Se hur nästa match påverkar ditt snitt</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={COLOR.ink3} />
      </PressableScale>

      <GlassSheet visible={open} onClose={() => setOpen(false)} title="Vad händer om…">
        <Text style={styles.subtitle}>Dra reglaget — se hur nästa match påverkar ditt snitt</Text>
        <View style={styles.hero}>
          <View>
            <Text style={styles.cap}>Du snittar</Text>
            <Text style={styles.big}>{val}</Text>
            <Text style={styles.cap}>i nästa match</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color={COLOR.ink4} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cap}>Nytt säsongssnitt</Text>
            <Text style={[styles.big, { color: dColor }]}>{projAvg}</Text>
            <View style={styles.deltaRow}>
              {diff !== 0 && <Ionicons name={diff > 0 ? 'trending-up' : 'trending-down'} size={14} color={dColor} />}
              <Text style={[styles.delta, { color: dColor }]}>{diff > 0 ? `+${diff}` : diff < 0 ? String(diff) : 'oförändrat'}</Text>
            </View>
          </View>
        </View>
        <Slider min={140} max={280} step={5} value={val} onChange={setVal} />
        <View style={styles.scaleRow}>
          <Text style={styles.scaleEnd}>140</Text>
          <Text style={styles.scaleMid}>Ditt snitt: {seasonAvg}</Text>
          <Text style={styles.scaleEnd}>280</Text>
        </View>
      </GlassSheet>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[6],
    backgroundColor: COLOR.surface, borderRadius: RADIUS.md, paddingVertical: SPACE[4], paddingHorizontal: SPACE[4],
  },
  cardLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  cardSub: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },
  subtitle: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginBottom: SPACE[6] },
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE[6] },
  cap: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  big: { color: COLOR.ink, fontSize: 52, fontFamily: FONT.scoreHeavy, letterSpacing: -2, fontVariant: ['tabular-nums'], marginVertical: 2 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[1] },
  delta: { fontSize: TYPE.caption, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACE[2] },
  scaleEnd: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, fontVariant: ['tabular-nums'] },
  scaleMid: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold, fontVariant: ['tabular-nums'] },
});
