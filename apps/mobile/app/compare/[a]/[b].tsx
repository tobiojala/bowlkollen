import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { ListSkeleton } from '@/components/Skeleton';
import { ScrollBlur } from '@/components/ScrollBlur';
import { useComparePlayer, useH2H, type ComparePlayer } from '@/lib/compare';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

type Metric = { label: string; get: (p: ComparePlayer) => number };
const METRICS: Metric[] = [
  { label: 'Snitt', get: (p) => p.stats?.seasonAvg ?? 0 },
  { label: 'BK-rating', get: (p) => p.stats?.rating ?? 0 },
  { label: 'Bästa serie', get: (p) => p.stats?.bestSeries ?? 0 },
  { label: 'Högsta spel', get: (p) => p.stats?.bestGame ?? 0 },
  { label: '200+ spel', get: (p) => p.stats?.games200 ?? 0 },
  { label: '250+ spel', get: (p) => p.over250 },
  { label: 'Matcher', get: (p) => p.stats?.matchesPlayed ?? 0 },
];

export default function ComparePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { a, b } = useLocalSearchParams<{ a: string; b: string }>();
  const A = useComparePlayer(a);
  const B = useComparePlayer(b);
  const { data: h2h } = useH2H(a, b);

  const ready = A.data && B.data;

  return (
    <View style={styles.safe}>
      {!ready ? (
        <ListSkeleton />
      ) : (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}>
          <Text style={styles.kicker}>JÄMFÖRELSE</Text>

          <View style={styles.heads}>
            <PlayerHead p={A.data!} onPress={() => router.push(`/player/${a}`)} />
            <Text style={styles.mot}>MOT</Text>
            <PlayerHead p={B.data!} onPress={() => router.push(`/player/${b}`)} />
          </View>

          {h2h && h2h.meetings > 0 && (
            <View style={styles.h2h}>
              <Text style={styles.h2hLabel}>INBÖRDES VID BORDET</Text>
              <View style={styles.h2hRow}>
                <Text style={[styles.h2hNum, h2h.aWins > h2h.bWins && styles.h2hWin]}>{h2h.aWins}</Text>
                <Text style={styles.h2hDash}>–</Text>
                <Text style={[styles.h2hNum, h2h.bWins > h2h.aWins && styles.h2hWin]}>{h2h.bWins}</Text>
              </View>
              <Text style={styles.h2hMeta}>
                {h2h.meetings} möten{h2h.recent.length ? `  ·  senaste: ${h2h.recent.join(' ')}` : ''}
              </Text>
            </View>
          )}

          <View style={styles.metrics}>
            {METRICS.map((m) => {
              const va = m.get(A.data!);
              const vb = m.get(B.data!);
              return (
                <View key={m.label} style={styles.row}>
                  <Text style={[styles.val, va > vb ? styles.win : va < vb ? styles.lose : styles.tie]}>{va}</Text>
                  <Text style={styles.rowLabel}>{m.label}</Text>
                  <Text style={[styles.val, vb > va ? styles.win : vb < va ? styles.lose : styles.tie]}>{vb}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <ScrollBlur />
      <View style={[styles.chrome, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function PlayerHead({ p, onPress }: { p: ComparePlayer; onPress: () => void }) {
  const tier = p.stats?.tier;
  return (
    <Pressable style={styles.head} onPress={onPress}>
      <IdentityAvatar colors={teamColor(p.identity.name)} initials={teamInitials(p.identity.name)} size={58} />
      <Text style={styles.name} numberOfLines={2}>{p.identity.name}</Text>
      {!!p.identity.clubName && <Text style={styles.club} numberOfLines={1}>{p.identity.clubName}</Text>}
      {tier && <Text style={[styles.tier, { color: tier.accent }]}>{tier.label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  chrome: { position: 'absolute', left: 16 },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 2, fontFamily: FONT.bold, textAlign: 'center', marginTop: SPACE[2] },

  heads: { flexDirection: 'row', alignItems: 'flex-start', marginTop: SPACE[6] },
  head: { flex: 1, alignItems: 'center', gap: SPACE[1] },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold, textAlign: 'center', marginTop: SPACE[2], lineHeight: 20 },
  club: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center' },
  tier: { fontSize: TYPE.caption, fontFamily: FONT.bold, letterSpacing: 1, marginTop: 2 },
  mot: { color: COLOR.ink4, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, paddingHorizontal: SPACE[2], marginTop: SPACE[8] },

  h2h: { alignItems: 'center', marginTop: SPACE[8], padding: SPACE[4], borderRadius: RADIUS.lg, backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.surface2 },
  h2hLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  h2hRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  h2hNum: { color: COLOR.ink3, fontSize: TYPE.hero - 8, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  h2hWin: { color: COLOR.green },
  h2hDash: { color: COLOR.ink4, fontSize: TYPE.title, fontFamily: FONT.score, marginHorizontal: SPACE[3] },
  h2hMeta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },

  metrics: { marginTop: SPACE[8] },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLOR.surface2 },
  val: { flex: 1, fontSize: TYPE.title, fontFamily: FONT.score, fontVariant: ['tabular-nums'], textAlign: 'center' },
  win: { color: COLOR.green },
  lose: { color: COLOR.ink3 },
  tie: { color: COLOR.ink2 },
  rowLabel: { flex: 1.4, color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold, textAlign: 'center' },
});
