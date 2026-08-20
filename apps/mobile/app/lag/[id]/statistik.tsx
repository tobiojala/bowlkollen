import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { ProfileTrend } from '@/components/ProfileTrend';
import { useTeam } from '@/lib/team-data';
import { useTeamStats } from '@/lib/team-stats';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';
import type { TeamStats } from '@bowlkollen/core';

// Download the web-generated share card PNG and hand it to the OS share sheet
// (→ Instagram, stories, lagchatt). Same card as web /statistik/card.
async function shareStatsCard(teamId: number) {
  try {
    const dest = new File(Paths.cache, `lag-${teamId}-statistik.png`);
    try { if (dest.exists) dest.delete(); } catch { /* recreate below */ }
    const file = await File.downloadFileAsync(`https://bowlkollen.se/lag/${teamId}/statistik/card`, dest);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: 'image/png', UTI: 'public.png' });
    }
  } catch { /* ignore — sharing best-effort */ }
}

// Deep team statistics — native parity with web /lag/[id]/statistik, same core
// engine. Pinfall-first hero, the ProfileTrend glow graph, home/away, highs, and
// a per-player snitt leaderboard.
export default function TeamStatistik() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);
  const { data: team } = useTeam(teamId);
  const { data, isLoading } = useTeamStats(teamId);

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}>
        <Text style={styles.kicker}>STATISTIK</Text>
        <Text style={styles.h1} numberOfLines={2}>{team?.name ?? 'Laget'}</Text>

        {isLoading ? (
          <View style={styles.center}><ActivityIndicator color={COLOR.gold} /></View>
        ) : !data ? (
          <Text style={styles.empty}>Ingen färdigspelad match att visa statistik för än.</Text>
        ) : (
          <>
            <StatsBody stats={data.stats} season={data.season} />
            <View style={styles.actions}>
              <PressableScale style={styles.shareBtn} onPress={() => shareStatsCard(teamId)} haptic>
                <Ionicons name="share-outline" size={18} color={COLOR.bg} />
                <Text style={styles.shareText}>Dela statistik</Text>
              </PressableScale>
              <PressableScale style={styles.compareBtn} onPress={() => router.push(`/compare/teams/${teamId}` as never)}>
                <Text style={styles.compareText}>Jämför lag</Text>
              </PressableScale>
            </View>
          </>
        )}
      </ScrollView>
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function StatsBody({ stats, season }: { stats: TeamStats; season: 'current' | 'last' }) {
  const trendPoints = stats.trend.map((t) => ({ avg: t.teamTotal, date: t.date, label: t.opponent }));
  return (
    <View style={{ gap: SPACE[4], marginTop: SPACE[6] }}>
      {season === 'last' && (
        <Text style={styles.note}>Ingen färdigspelad match den här säsongen än — visar förra säsongen.</Text>
      )}

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroLabel}>PINFALL / MATCH</Text>
            <Text style={styles.heroValue}>{stats.pinfallPerMatch != null ? stats.pinfallPerMatch.toLocaleString('sv-SE') : '–'}</Text>
            <Text style={styles.heroSub}>
              {stats.totalPinfall.toLocaleString('sv-SE')} pins totalt{stats.teamAverage != null ? ` · snitt/serie ${stats.teamAverage}` : ''}
            </Text>
            <Text style={styles.heroSub}>{stats.played} {stats.played === 1 ? 'match' : 'matcher'} · {stats.winPct}% vinst</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: SPACE[2] }}>
            <Text style={styles.formLabel}>FORM</Text>
            <FormDots form={stats.form} />
          </View>
        </View>
      </View>

      {trendPoints.length >= 2 && (
        <ProfileTrend
          points={trendPoints}
          label="Pinfall per match"
          restValue={stats.pinfallPerMatch ?? undefined}
          baseline={stats.pinfallPerMatch}
          baselineLabel="snitt"
          accent={COLOR.gold}
          caption={`${trendPoints.length} matcher`}
        />
      )}

      <View style={styles.statRow}>
        <Stat label="Hemma" value={stats.home.average != null ? String(stats.home.average) : '–'}
          sub={`${stats.home.wins}–${stats.home.losses}${stats.home.draws ? `–${stats.home.draws}` : ''} · ${stats.home.played} m`} />
        <Stat label="Borta" value={stats.away.average != null ? String(stats.away.average) : '–'}
          sub={`${stats.away.wins}–${stats.away.losses}${stats.away.draws ? `–${stats.away.draws}` : ''} · ${stats.away.played} m`} />
      </View>

      <View style={styles.statRow}>
        {stats.highGame && <Stat label="Högsta serie" value={String(stats.highGame.pins)} sub={stats.highGame.name} accent={COLOR.gold} />}
        {stats.highMatch && <Stat label="Bästa lagresultat" value={String(stats.highMatch.total)} sub={`mot ${stats.highMatch.opponent}`} />}
      </View>

      {stats.players.length > 0 && (
        <View style={{ gap: 6 }}>
          <Text style={styles.sectionLabel}>SPELARE · SNITT</Text>
          {stats.players.map((p, i) => (
            <View key={p.lic || p.name} style={styles.playerRow}>
              <Text style={[styles.rank, i === 0 && styles.rankTop]}>{i + 1}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.playerSub}>{p.matches} m · {p.games} serier · högsta {p.high}</Text>
              </View>
              <Text style={styles.playerAvg}>{p.average}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
      {!!sub && <Text style={styles.statSub} numberOfLines={1}>{sub}</Text>}
    </View>
  );
}

function FormDots({ form }: { form: TeamStats['form'] }) {
  if (form.length === 0) return null;
  const ordered = [...form].reverse();
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  scroll: { paddingHorizontal: SPACE[4], paddingBottom: 120 },
  chromeLeft: { position: 'absolute', left: 16 },
  center: { paddingVertical: SPACE[16], alignItems: 'center' },

  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 4, fontFamily: FONT.bold, letterSpacing: -0.5, marginTop: 2 },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', paddingVertical: SPACE[16] },
  note: { color: COLOR.ink3, fontSize: TYPE.caption },

  hero: { backgroundColor: COLOR.surface, borderRadius: RADIUS.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: COLOR.hairline, padding: SPACE[6] },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACE[4] },
  heroLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  heroValue: { color: COLOR.gold, fontSize: 52, fontFamily: FONT.score, fontVariant: ['tabular-nums'], marginTop: 4 },
  heroSub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 4 },
  formLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },

  statRow: { flexDirection: 'row', gap: SPACE[3] },
  stat: { flex: 1, minWidth: 0, backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: COLOR.hairline, padding: SPACE[4] },
  statLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.5 },
  statValue: { color: COLOR.ink, fontSize: 26, fontFamily: FONT.score, fontVariant: ['tabular-nums'], marginTop: 4 },
  statSub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 2 },

  sectionLabel: { color: COLOR.ink2, fontSize: 13, fontFamily: FONT.bold, letterSpacing: 1, marginTop: SPACE[2], marginBottom: SPACE[1] },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: COLOR.hairline, padding: SPACE[3] },
  rank: { width: 22, textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  rankTop: { color: COLOR.gold },
  playerName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  playerSub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  playerAvg: { color: COLOR.ink, fontSize: 22, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },

  dot: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontSize: 12, fontFamily: FONT.bold },

  actions: { flexDirection: 'row', gap: SPACE[3], marginTop: SPACE[6] },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLOR.gold, borderRadius: RADIUS.lg, paddingVertical: SPACE[3] },
  shareText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },
  compareBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: COLOR.hairline, borderRadius: RADIUS.lg, paddingVertical: SPACE[3] },
  compareText: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold },
});
