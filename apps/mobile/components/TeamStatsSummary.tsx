import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { PressableScale } from '@/components/PressableScale';
import { useTeamStats } from '@/lib/team-stats';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';
import type { TeamStats } from '@bowlkollen/core';

// Compact team-stats summary on the team page — pinfall/match hero, total pinfall,
// form, and a mini pinfall trend. A doorway to /lag/[id]/statistik (the deep dive).
// Renders nothing until there are finished matches. Mirrors web TeamStatsSummary.

function MiniTrend({ stats }: { stats: TeamStats }) {
  const vals = stats.trend.map((t) => t.teamTotal);
  if (vals.length < 2) return null;
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const W = 96, H = 34;
  const pts = vals.map((v, i) => `${((i / (vals.length - 1)) * W).toFixed(1)},${(H - ((v - min) / span) * H).toFixed(1)}`).join(' ');
  return (
    <Svg width={W} height={H}>
      <Polyline points={pts} fill="none" stroke={COLOR.gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FormDots({ form }: { form: TeamStats['form'] }) {
  if (form.length === 0) return null;
  const ordered = [...form].reverse();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {ordered.map((o, i) => {
        const c = o === 'W' ? COLOR.green : o === 'L' ? COLOR.red : COLOR.ink3;
        const letter = o === 'W' ? 'V' : o === 'L' ? 'F' : 'O';
        return (
          <View key={i} style={[styles.dot, { backgroundColor: `${c}22` }]}>
            <Text style={[styles.dotText, { color: c }]}>{letter}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function TeamStatsSummary({ teamId }: { teamId: number }) {
  const router = useRouter();
  const { data } = useTeamStats(teamId);
  if (!data) return null;
  const s = data.stats;

  return (
    <PressableScale style={styles.card} onPress={() => router.push(`/lag/${teamId}/statistik` as never)}>
      <View style={styles.head}>
        <Text style={styles.kicker}>LAGSTATISTIK</Text>
        <View style={styles.seeAll}>
          <Text style={styles.seeAllText}>Se allt</Text>
          <Ionicons name="chevron-forward" size={14} color={COLOR.ink3} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.label}>PINFALL / MATCH</Text>
          <Text style={styles.hero}>{s.pinfallPerMatch != null ? s.pinfallPerMatch.toLocaleString('sv-SE') : '–'}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {s.totalPinfall.toLocaleString('sv-SE')} pins totalt · {s.played} {s.played === 1 ? 'match' : 'matcher'} · {s.winPct}% vinst
          </Text>
        </View>
        <View style={styles.right}>
          <MiniTrend stats={s} />
          <FormDots form={s.form} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: COLOR.hairline, padding: SPACE[4] },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[3] },
  kicker: { color: COLOR.ink2, fontSize: 13, fontFamily: FONT.bold, letterSpacing: 1 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },

  body: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: SPACE[4] },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  hero: { color: COLOR.gold, fontSize: 40, fontFamily: FONT.score, fontVariant: ['tabular-nums'], marginTop: 2 },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 4 },
  right: { alignItems: 'flex-end', gap: SPACE[2], flexShrink: 0 },

  dot: { width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontSize: 11, fontFamily: FONT.bold },
});
