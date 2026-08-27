import { StyleSheet, Text, View } from 'react-native';

import type { ResultRow } from '@/components/TeamResults';
import type { DelmatchSummary } from '@/lib/delmatch';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const HIGH_SERIE = 200;

type Peak = { k: string; v: string; s: string; gold?: boolean };

// Auto-surfaced highlights — turns raw serie data into the match's story. Pure.
// Mirrors web's Hojdpunkter; the "skräll" (biggest over-snitt) uses the season
// serie-averages the Pro layer already loads.
function computeHighlights(results: ResultRow[], delmatch: DelmatchSummary | undefined, avgByPublicId: Record<string, number>): Peak[] {
  const peaks: Peak[] = [];
  let hi = { score: 0, name: '', idx: 0 };
  let over200 = 0, totalSeries = 0;
  let skrall = { delta: -Infinity, name: '', score: 0 };

  for (const r of results) {
    const avg = r.public_id ? avgByPublicId[r.public_id] : undefined;
    r.series.forEach((g, i) => {
      if (g <= 0) return;
      totalSeries++;
      if (g >= HIGH_SERIE) over200++;
      if (g > hi.score) hi = { score: g, name: r.player_name, idx: i };
      if (avg) { const d = Math.round(g - avg); if (d > skrall.delta) skrall = { delta: d, name: r.player_name, score: g }; }
    });
  }

  if (hi.score) peaks.push({ k: 'HÖGSTA SERIE', v: String(hi.score), s: `${hi.name} · S${hi.idx + 1}`, gold: true });
  if (totalSeries) peaks.push({ k: '200+ SERIER', v: `${over200}/${totalSeries}`, s: `${Math.round((over200 / totalSeries) * 100)}% av alla serier` });

  if (delmatch?.hasData) {
    let bw = { margin: 0, bord: 0, serie: 0 };
    for (const s of delmatch.series) for (const d of s.tables) {
      const m = Math.abs(d.homeTotal - d.awayTotal);
      if (m > bw.margin) bw = { margin: m, bord: d.tableNo, serie: s.serie };
    }
    if (bw.margin) peaks.push({ k: 'STÖRSTA BORDSEGER', v: `+${bw.margin}`, s: `Bord ${bw.bord} · Serie ${bw.serie}` });
  }

  if (Number.isFinite(skrall.delta) && skrall.delta > 0) peaks.push({ k: 'KVÄLLENS SKRÄLL', v: `+${skrall.delta}`, s: `${skrall.name} · ${skrall.score}` });
  return peaks;
}

export function Hojdpunkter({ results, delmatch, avgByPublicId }: {
  results: ResultRow[];
  delmatch?: DelmatchSummary;
  avgByPublicId: Record<string, number>;
}) {
  const peaks = computeHighlights(results, delmatch, avgByPublicId);
  if (!peaks.length) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.head}>HÖJDPUNKTER</Text>
      <View style={styles.grid}>
        {peaks.map((p) => (
          <View key={p.k} style={styles.card}>
            <Text style={styles.k}>{p.k}</Text>
            <Text style={[styles.v, p.gold && styles.vGold]}>{p.v}</Text>
            <Text style={styles.s} numberOfLines={1}>{p.s}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACE[6] },
  head: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[3] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] },
  card: { flexGrow: 1, flexBasis: '46%', backgroundColor: COLOR.surface, borderRadius: RADIUS.md, paddingVertical: SPACE[3], paddingHorizontal: SPACE[4] },
  k: { color: COLOR.ink3, fontSize: TYPE.micro, fontFamily: FONT.bold, letterSpacing: 0.6 },
  v: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.score, fontVariant: ['tabular-nums'], marginTop: 4 },
  vGold: { color: COLOR.gold },
  s: { color: COLOR.ink2, fontSize: TYPE.caption, marginTop: 1 },
});
