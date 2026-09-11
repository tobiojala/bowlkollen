import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { usePlayerSpares } from '@/lib/use-player-spares';
import { COLOR, FONT, SPACE } from '@/theme';

// Spare analysis (parity with web): white numbers, bars fade white→tip and only
// tip gold/green/red when a cap is crossed. Fed by the user's logged leaves.
const ELITE = 85, TARGET = 70, FLOOR = 40;
const HEX: Record<string, string> = { gold: '#f5c200', green: '#48d18a', red: '#e05555' };
const tip = (p: number): string | null => (p >= ELITE ? 'gold' : p >= TARGET ? 'green' : p < FLOOR ? 'red' : null);
type Grad = { colors: readonly [string, string, ...string[]]; locations: readonly [number, number, ...number[]] };
function bar(p: number): Grad {
  const k = tip(p);
  if (!k) return { colors: ['rgba(244,245,247,0.14)', 'rgba(244,245,247,0.55)'], locations: [0, 1] };
  return { colors: ['rgba(244,245,247,0.14)', 'rgba(244,245,247,0.55)', HEX[k]], locations: [0, 0.72, 1] };
}

function Stat({ v, lbl, sub }: { v: string; lbl: string; sub?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.big}>{v}</Text>
      <Text style={s.lbl}>{lbl}</Text>
      {sub ? <Text style={s.sub}>{sub}</Text> : null}
    </View>
  );
}

export function SparAnalys() {
  const { stats, total } = usePlayerSpares();
  if (total === 0) return (
    <Text style={s.empty}>Inga lämningar loggade än. Logga ett spel och pricka käglorna som stod på de öppna rutorna — din spärranalys byggs upp här, läge för läge.</Text>
  );
  const { overall, byKind, byLeave, nemesis } = stats;
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: SPACE[2] }}>
        <Stat v={`${overall.pct}%`} lbl="Spärr totalt" sub={`${overall.made} / ${overall.att} lägen`} />
        <Stat v={`${byKind.single.pct}%`} lbl="Enkelkäglor" />
        <Stat v={`${byKind.hal.att ? byKind.hal.pct : 0}%`} lbl="Hål" />
      </View>

      <View style={s.rule} />
      <Text style={s.h2}>LÄGE FÖR LÄGE</Text>
      {byLeave.map((l) => {
        const g = bar(l.pct);
        return (
          <View key={l.key} style={s.row}>
            <View style={s.rowTop}>
              <Text style={s.nm}>{l.name}{l.kind === 'hal' ? ' · hål' : ''}</Text>
              <Text style={s.pct}>{l.pct}<Text style={s.pctU}>%</Text></Text>
            </View>
            <Text style={s.meta}>{l.made}/{l.att} lägen</Text>
            <View style={s.track}>
              <LinearGradient colors={g.colors} locations={g.locations} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: '100%', width: `${l.pct}%`, borderRadius: 3 }} />
            </View>
          </View>
        );
      })}

      {nemesis ? (
        <View style={s.nem}>
          <Text style={s.nemP}>{nemesis.pct}%</Text>
          <Text style={s.nemT}>Din <Text style={s.b}>nemesis</Text>: {nemesis.name}. Satt <Text style={s.b}>{nemesis.made}</Text> av <Text style={s.b}>{nemesis.att}</Text>.</Text>
        </View>
      ) : null}

      <Text style={s.foot}>Byggt från dina egna loggade spel — funkar i varje hall. Logga fler serier så blir mönstret skarpare.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  big: { fontFamily: FONT.scoreHeavy, fontSize: 40, color: COLOR.ink, letterSpacing: -1 },
  lbl: { fontSize: 11, color: COLOR.ink3, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT.bold, marginTop: SPACE[2] },
  sub: { fontSize: 12, color: COLOR.ink4, marginTop: 2, fontFamily: FONT.regular },
  rule: { height: 1, backgroundColor: COLOR.hairline, marginVertical: SPACE[6] },
  h2: { fontSize: 13, fontFamily: FONT.bold, letterSpacing: 0.4, color: COLOR.ink2, marginBottom: SPACE[2] },
  row: { paddingVertical: SPACE[3], borderTopWidth: 1, borderTopColor: COLOR.hairline },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nm: { fontFamily: FONT.semibold, fontSize: 15, color: COLOR.ink },
  pct: { fontFamily: FONT.scoreHeavy, fontSize: 19, color: COLOR.ink },
  pctU: { fontSize: 11, color: COLOR.ink4 },
  meta: { fontSize: 12, color: COLOR.ink4, marginTop: 2, fontFamily: FONT.regular },
  track: { height: 4, borderRadius: 3, backgroundColor: 'rgba(244,245,247,0.06)', overflow: 'hidden', marginTop: SPACE[2] },
  nem: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], marginTop: SPACE[6], paddingTop: SPACE[4], borderTopWidth: 1, borderTopColor: COLOR.hairline },
  nemP: { fontFamily: FONT.scoreHeavy, fontSize: 28, color: COLOR.red },
  nemT: { flex: 1, fontSize: 13, color: COLOR.ink2, fontFamily: FONT.regular, lineHeight: 19 },
  b: { color: COLOR.ink, fontFamily: FONT.semibold },
  foot: { marginTop: SPACE[8], paddingTop: SPACE[4], borderTopWidth: 1, borderTopColor: COLOR.hairline, fontSize: 13, color: COLOR.ink3, fontFamily: FONT.regular, lineHeight: 19 },
  empty: { padding: SPACE[8], color: COLOR.ink3, fontSize: 15, fontFamily: FONT.regular, lineHeight: 22 },
});
