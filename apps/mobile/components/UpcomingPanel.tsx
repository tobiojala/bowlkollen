import { StyleSheet, Text, View } from 'react-native';

import { matchKickoff } from '@bowlkollen/core';
import { useUpcoming, type Outcome, type TeamForm } from '@/lib/match-context';
import { usePro } from '@/lib/pro';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const DOT: Record<Outcome, string> = { V: COLOR.green, F: COLOR.red, O: COLOR.ink2 };

function FormDots({ results }: { results: Outcome[] }) {
  if (!results.length) return <Text style={styles.dash}>—</Text>;
  return (
    <View style={styles.dots}>
      {results.map((o, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: `${DOT[o]}22` }]}>
          <Text style={[styles.dotText, { color: DOT[o] }]}>{o}</Text>
        </View>
      ))}
    </View>
  );
}

function Fact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factK} numberOfLines={1}>{k}</Text>
      <View style={styles.factV}>{children}</View>
    </View>
  );
}

// The upcoming-match state: real kickoff + venue + oil + both teams' recent form
// (free), and a directional prognos from banpoäng form (Pro, non-official).
// Web parity (UpcomingPanel).
export function UpcomingPanel({ homeTeamId, awayTeamId, matchDatetime, matchDate, hallName, hallCity, oilPattern, homeName, awayName }: {
  homeTeamId: number | null; awayTeamId: number | null;
  matchDatetime: string | null; matchDate: string;
  hallName: string | null; hallCity: string | null; oilPattern: string | null;
  homeName: string; awayName: string;
}) {
  const pro = usePro();
  const { data } = useUpcoming(homeTeamId, awayTeamId);
  const time = matchKickoff(matchDatetime);
  const dateStr = new Date(matchDate + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

  const net = (t?: TeamForm) => (t ? t.avgFor - t.avgAgainst : 0);
  const netHome = net(data?.home), netAway = net(data?.away);
  const favName = netHome === netAway ? null : (netHome > netAway ? homeName : awayName);
  const edge = Math.abs(netHome - netAway);
  const played = (data?.home.played ?? 0) + (data?.away.played ?? 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.when}>
        {!!time && <Text style={styles.time}>{time}</Text>}
        <Text style={styles.date}>{dateStr}{hallName ? ` · ${hallName}` : ''}{hallCity ? `, ${hallCity}` : ''}</Text>
      </View>

      <View style={styles.facts}>
        {!!oilPattern && <Fact k="OLJA"><Text style={styles.factText}>{oilPattern}</Text></Fact>}
        <Fact k={`${homeName} form`.toUpperCase()}><FormDots results={data?.home.results ?? []} /></Fact>
        <Fact k={`${awayName} form`.toUpperCase()}><FormDots results={data?.away.results ?? []} /></Fact>
      </View>

      {pro && favName && played > 0 && (
        <View style={styles.prognos}>
          <Text style={styles.prognosK}>PROGNOS · UTIFRÅN FORM</Text>
          <Text style={styles.prognosBody}>
            <Text style={styles.prognosFav}>{favName}</Text> favorit
            {edge > 0 ? <Text style={styles.prognosEdge}>{` · +${edge} banpoäng/match i snittform`}</Text> : null}
          </Text>
          <Text style={styles.prognosNote}>Riktning utifrån senaste matcherna — inte officiell.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACE[8] },
  when: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE[3], flexWrap: 'wrap' },
  time: { fontFamily: FONT.score, fontVariant: ['tabular-nums'], fontSize: 32, color: COLOR.gold },
  date: { fontSize: TYPE.body, color: COLOR.ink2, textTransform: 'capitalize' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2], marginTop: SPACE[4] },
  fact: { flexGrow: 1, flexBasis: '46%', backgroundColor: COLOR.surface, borderRadius: RADIUS.md, paddingVertical: SPACE[3], paddingHorizontal: SPACE[4] },
  factK: { fontSize: TYPE.micro, fontFamily: FONT.bold, letterSpacing: 0.6, color: COLOR.ink3 },
  factV: { marginTop: SPACE[2] },
  factText: { fontSize: TYPE.body, fontFamily: FONT.semibold, color: COLOR.ink },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontSize: 12, fontFamily: FONT.bold },
  dash: { fontSize: TYPE.caption, color: COLOR.ink4 },
  prognos: { marginTop: SPACE[4], backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[4] },
  prognosK: { fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.8, color: COLOR.ink3 },
  prognosBody: { fontSize: TYPE.body, color: COLOR.ink, marginTop: SPACE[2] },
  prognosFav: { fontFamily: FONT.bold },
  prognosEdge: { color: COLOR.ink2 },
  prognosNote: { fontSize: TYPE.caption, color: COLOR.ink3, marginTop: SPACE[1] },
});
