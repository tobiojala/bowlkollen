import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { useTeam } from '@/lib/team-data';
import { useTeamStats } from '@/lib/team-stats';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';
import type { TeamStats } from '@bowlkollen/core';

// Two teams side by side on the shared computeTeamStats engine — native parity
// with web /compare/teams/[id1]/[id2]. Leading side per row lights green.
export default function TeamCompare() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { a, b } = useLocalSearchParams<{ a: string; b: string }>();
  const idA = Number(a), idB = Number(b);
  const { data: teamA } = useTeam(idA);
  const { data: teamB } = useTeam(idB);
  const { data: dataA, isLoading: la } = useTeamStats(idA);
  const { data: dataB, isLoading: lb } = useTeamStats(idB);
  const sa = dataA?.stats, sb = dataB?.stats;

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}>
        <Text style={styles.kicker}>JÄMFÖR LAG</Text>
        <View style={styles.crests}>
          <Crest name={teamA?.name ?? 'Lag A'} side="a" />
          <Text style={styles.vs}>VS</Text>
          <Crest name={teamB?.name ?? 'Lag B'} side="b" />
        </View>

        {la || lb ? (
          <View style={styles.center}><ActivityIndicator color={COLOR.gold} /></View>
        ) : !sa || !sb ? (
          <Text style={styles.empty}>
            {!sa && !sb ? 'Ingen statistik för något av lagen än.' : `Ingen statistik för ${!sa ? (teamA?.name ?? 'Lag A') : (teamB?.name ?? 'Lag B')} än.`}
          </Text>
        ) : (
          <View style={styles.card}>
            <Row label="Pinfall / match" a={sa.pinfallPerMatch} b={sb.pinfallPerMatch} />
            <Row label="Total pinfall" a={sa.totalPinfall} b={sb.totalPinfall} />
            <Row label="Vinst %" a={sa.winPct} b={sb.winPct} />
            <Row label="Snitt / serie" a={sa.teamAverage} b={sb.teamAverage} />
            <Row label="Bästa serie" a={sa.highGame?.pins ?? null} b={sb.highGame?.pins ?? null} />
            <Row label="Bästa lagresultat" a={sa.highMatch?.total ?? null} b={sb.highMatch?.total ?? null} />
            <Row label="Matcher" a={sa.played} b={sb.played} neutral />
            <FormRow a={sa.form} b={sb.form} />
          </View>
        )}
      </ScrollView>
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function hueOf(name: string) { return name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 360; }

function Crest({ name, side }: { name: string; side: 'a' | 'b' }) {
  const hue = hueOf(name);
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase();
  return (
    <View style={{ flex: 1, alignItems: side === 'a' ? 'flex-start' : 'flex-end', gap: SPACE[2] }}>
      <View style={[styles.crest, { backgroundColor: `hsla(${hue},50%,45%,0.15)`, borderColor: `hsla(${hue},50%,45%,0.5)` }]}>
        <Text style={[styles.crestText, { color: `hsl(${hue},50%,72%)` }]}>{initials}</Text>
      </View>
      <Text style={[styles.crestName, { textAlign: side === 'a' ? 'left' : 'right' }]} numberOfLines={1}>{name}</Text>
    </View>
  );
}

function num(n: number | null | undefined) { return n != null ? n.toLocaleString('sv-SE') : '–'; }

function Row({ label, a, b, neutral = false }: { label: string; a: number | null; b: number | null; neutral?: boolean }) {
  const aWin = !neutral && a != null && b != null && a > b;
  const bWin = !neutral && a != null && b != null && b > a;
  return (
    <View style={styles.row}>
      <Text style={[styles.cell, { textAlign: 'left' }, aWin && styles.win]}>{num(a)}</Text>
      <Text style={styles.rowLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.cell, { textAlign: 'right' }, bWin && styles.win]}>{num(b)}</Text>
    </View>
  );
}

function FormRow({ a, b }: { a: TeamStats['form']; b: TeamStats['form'] }) {
  const dots = (form: TeamStats['form'], align: 'flex-start' | 'flex-end') => (
    <View style={{ flex: 1, flexDirection: 'row', gap: 4, justifyContent: align }}>
      {[...form].reverse().map((o, i) => {
        const c = o === 'W' ? COLOR.green : o === 'L' ? COLOR.red : COLOR.ink3;
        const letter = o === 'W' ? 'V' : o === 'L' ? 'F' : 'O';
        return <View key={i} style={[styles.dot, { backgroundColor: `${c}22` }]}><Text style={[styles.dotText, { color: c }]}>{letter}</Text></View>;
      })}
    </View>
  );
  return (
    <View style={styles.row}>
      {dots(a, 'flex-start')}
      <Text style={styles.rowLabel}>FORM</Text>
      {dots(b, 'flex-end')}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  scroll: { paddingHorizontal: SPACE[4], paddingBottom: 120 },
  chromeLeft: { position: 'absolute', left: 16 },
  center: { paddingVertical: SPACE[16], alignItems: 'center' },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', paddingVertical: SPACE[16] },

  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  crests: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE[3], marginTop: SPACE[3], marginBottom: SPACE[6] },
  vs: { alignSelf: 'center', color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold },
  crest: { width: 52, height: 52, borderRadius: RADIUS.lg, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  crestText: { fontSize: 16, fontFamily: FONT.bold },
  crestName: { color: COLOR.ink, fontSize: 15, fontFamily: FONT.bold, maxWidth: '100%' },

  card: { backgroundColor: COLOR.surface, borderRadius: RADIUS.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: COLOR.hairline, paddingHorizontal: SPACE[4] },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLOR.hairline },
  cell: { flex: 1, color: COLOR.ink, fontSize: 20, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  win: { color: COLOR.green },
  rowLabel: { flex: 1.3, textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.4 },
  dot: { width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontSize: 11, fontFamily: FONT.bold },
});
