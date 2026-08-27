import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ListSkeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SupabaseClient } from '@supabase/supabase-js';
import { GlassCircle, GlassPill } from '@/components/GlassButtons';
import { GlassSheet } from '@/components/GlassSheet';
import { MatchScorecard } from '@/components/MatchScorecard';
import { DelmatchBoard } from '@/components/DelmatchBoard';
import { MomentShareSheet } from '@/components/MomentShareSheet';
import { RivalryCallout } from '@/components/RivalryCallout';
import { SeasonContext } from '@/components/SeasonContext';
import { Hojdpunkter } from '@/components/Hojdpunkter';
import { ScrollBlur } from '@/components/ScrollBlur';
import { divisionTier } from '@/lib/tiers';
import { useMatchAvgs } from '@/lib/match-context';
import { usePro } from '@/lib/pro';
import { Segmented } from '@/components/Segmented';
import { TeamResults, type ResultRow } from '@/components/TeamResults';
import { computeDelmatcher, type DelmatchSlot, type DelmatchSummary } from '@/lib/delmatch';
import { useMatchRivalry } from '@/lib/match-rivalry';
import type { Moment } from '@/lib/share';
import { formatMatchDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

type Match = {
  home_team_name: string; away_team_name: string;
  home_score: number | null; away_score: number | null;   // pinfall
  home_result: number | null; away_result: number | null; // match points
  home_bits_team_id: number | null; away_bits_team_id: number | null;
  bits_division_id: number | null; season_id: number;
  division_name: string | null; is_finished: boolean | null; match_date: string; hall_name: string | null;
};

function useMatch(matchId: number) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async (): Promise<Match | null> => {
      const { data } = await supabase
        .from('bits_matches')
        .select(
          'home_team_name, away_team_name, home_score, away_score, home_result, away_result, home_bits_team_id, away_bits_team_id, bits_division_id, season_id, division_name, is_finished, match_date, hall_name',
        )
        .eq('bits_match_id', matchId)
        .maybeSingle();
      return data;
    },
  });
}

function useMatchResults(matchId: number) {
  return useQuery({
    queryKey: ['match-results', matchId],
    queryFn: async (): Promise<ResultRow[]> => {
      const { data, error } = await supabase
        .from('bits_match_player_results')
        .select('player_name, total_result, series, is_home_team, lic_nbr')
        .eq('bits_match_id', matchId)
        .order('total_result', { ascending: false });
      if (error) throw error;
      const rows = data ?? [];

      // Resolve licence numbers -> profile ids so rows can open player pages.
      const licNbrs = [...new Set(rows.map((r) => r.lic_nbr))];
      const idMap = new Map<string, string>();
      if (licNbrs.length) {
        const { data: players } = await supabase
          .from('bits_players')
          .select('lic_nbr, public_id')
          .in('lic_nbr', licNbrs);
        for (const p of players ?? []) idMap.set(p.lic_nbr, p.public_id);
      }

      return rows.map((r) => ({
        player_name: r.player_name,
        total_result: r.total_result,
        series: r.series,
        is_home_team: r.is_home_team,
        public_id: idMap.get(r.lic_nbr) ?? null,
      }));
    },
  });
}

function useMatchDelmatcher(matchId: number) {
  return useQuery({
    queryKey: ['match-delmatch', matchId],
    queryFn: async (): Promise<DelmatchSummary> => {
      // bits_match_delmatch isn't in the generated types yet — cast (see AGENTS.md).
      const db = supabase as unknown as SupabaseClient;
      const { data, error } = await db
        .from('bits_match_delmatch')
        .select('serie, table_no, player_order, is_home_team, player_name, lic_nbr, score')
        .eq('bits_match_id', matchId);
      if (error) throw error;
      const rows = (data ?? []) as {
        serie: number; table_no: number; player_order: number;
        is_home_team: boolean; player_name: string; lic_nbr: string | null; score: number;
      }[];

      // Resolve licence numbers -> profile ids so bord names can open player pages.
      const licNbrs = [...new Set(rows.map((r) => r.lic_nbr).filter(Boolean) as string[])];
      const idMap = new Map<string, string>();
      if (licNbrs.length) {
        const { data: players } = await supabase
          .from('bits_players')
          .select('lic_nbr, public_id')
          .in('lic_nbr', licNbrs);
        for (const p of players ?? []) idMap.set(p.lic_nbr, p.public_id);
      }

      const slots: DelmatchSlot[] = rows.map((r) => ({
        serie: r.serie,
        tableNo: r.table_no,
        order: r.player_order,
        isHomeTeam: r.is_home_team,
        playerName: r.player_name,
        publicId: r.lic_nbr ? idMap.get(r.lic_nbr) ?? null : null,
        score: r.score,
      }));
      return computeDelmatcher(slots);
    },
  });
}

export default function MatchPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const { data: match, isLoading } = useMatch(matchId);
  const { data: results = [] } = useMatchResults(matchId);
  const { data: delmatch } = useMatchDelmatcher(matchId);
  const hasDelmatch = !!delmatch?.hasData;
  const { data: rivalry } = useMatchRivalry(matchId, hasDelmatch);

  const home = results.filter((r) => r.is_home_team), away = results.filter((r) => !r.is_home_team);
  const pro = usePro();
  const { data: avgByPublicId = {} } = useMatchAvgs(results.map((r) => r.public_id).filter(Boolean) as string[], match?.season_id ?? 0);
  const topTotal = results.length ? Math.max(...results.map((r) => r.total_result)) : 0;
  const topPlayer = results.find((r) => r.total_result === topTotal) ?? null;

  const finished = !!match?.is_finished && match.home_result != null && match.away_result != null;
  const homeWon = finished && (match!.home_result ?? 0) > (match!.away_result ?? 0), awayWon = finished && (match!.away_result ?? 0) > (match!.home_result ?? 0);
  const hasPins = finished && match!.home_score != null && match!.away_score != null, hasSeries = results.some((r) => (r.series?.length ?? 0) > 0);

  const openTeam = (tid: number | null) => tid != null && router.push(`/lag/${tid}`);

  const [cardOpen, setCardOpen] = useState(false);
  const [cardView, setCardView] = useState<'bord' | 'serie'>('bord');
  const [shareMoment, setShareMoment] = useState<Moment | null>(null);
  const bg = useSharedValue(0);
  useEffect(() => {
    bg.value = cardOpen
      ? withSpring(1, { stiffness: 240, damping: 30, mass: 0.9 })
      : withTiming(0, { duration: 220 });
  }, [cardOpen]);
  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - bg.value * 0.06 }],
    borderRadius: bg.value * 24,
  }));

  return (
    <View style={styles.safe}>
      <Animated.View style={[styles.pageClip, bgStyle]}>
      {isLoading || !match ? (
        isLoading ? (
          <ListSkeleton />
        ) : (
          <View style={styles.center}>
            <Text style={styles.empty}>Matchen hittades inte.</Text>
          </View>
        )
      ) : (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}>
          {!!match.division_name && <Text style={styles.kicker}>{match.division_name}</Text>}

          <View style={styles.hero}>
            <HeroTeam name={match.home_team_name} won={homeWon} finished={finished} onPress={() => openTeam(match.home_bits_team_id)} />
            <View style={styles.heroCentre}>
              {finished ? (
                <View style={styles.pointsRow}>
                  <Text style={[styles.points, homeWon ? styles.pWin : styles.pLose]}>{match.home_result}</Text>
                  <Text style={styles.pSep}>–</Text>
                  <Text style={[styles.points, awayWon ? styles.pWin : styles.pLose]}>{match.away_result}</Text>
                </View>
              ) : (
                <Text style={styles.heroDate}>{formatMatchDate(match.match_date)}</Text>
              )}
              <Text style={styles.pointsLabel}>{finished ? 'BANPOÄNG' : 'KOMMANDE'}</Text>
            </View>
            <HeroTeam name={match.away_team_name} won={awayWon} finished={finished} right onPress={() => openTeam(match.away_bits_team_id)} />
          </View>

          {hasPins && (
            <Text style={styles.pins}>
              {match.home_score} – {match.away_score} käglor
            </Text>
          )}
          <Text style={styles.meta}>
            {[formatMatchDate(match.match_date), match.hall_name].filter(Boolean).join('  ·  ')}
          </Text>

          {finished && <SeasonContext divisionId={match.bits_division_id} seasonId={match.season_id} homeTeamId={match.home_bits_team_id} awayTeamId={match.away_bits_team_id} homeName={match.home_team_name} awayName={match.away_team_name} tier={divisionTier(match.division_name ?? '')} />}

          {topPlayer && topTotal > 0 && (
            <PressableScale
              style={styles.best}
              disabled={!topPlayer.public_id}
              onPress={() => topPlayer.public_id && router.push(`/player/${topPlayer.public_id}`)}
            >
              <Ionicons name="trophy" size={22} color={COLOR.gold} />
              <View style={styles.bestText}>
                <Text style={styles.bestLabel}>MATCHENS BÄSTA</Text>
                <Text style={styles.bestName} numberOfLines={1}>
                  {topPlayer.player_name} · {topPlayer.is_home_team ? match.home_team_name : match.away_team_name}
                </Text>
              </View>
              <Text style={styles.bestTotal}>{topTotal}</Text>
            </PressableScale>
          )}

          {rivalry && (
            <RivalryCallout
              rivalry={rivalry}
              onOpenPlayer={(pid) => router.push(`/player/${pid}`)}
              onOpenBord={() => { setCardView('bord'); setCardOpen(true); }}
              onShare={() => setShareMoment({
                kind: 'rivalry',
                aName: rivalry.a.name, bName: rivalry.b.name,
                aWins: rivalry.a.wins, bWins: rivalry.b.wins,
                meetings: rivalry.meetings,
              })}
            />
          )}

          {pro && <Hojdpunkter results={results} delmatch={delmatch} avgByPublicId={avgByPublicId} />}
          <TeamResults teamName={match.home_team_name} pins={match.home_score} rows={home} topTotal={topTotal} avgByPublicId={avgByPublicId} showDeltas={pro} />
          <TeamResults teamName={match.away_team_name} pins={match.away_score} rows={away} topTotal={topTotal} avgByPublicId={avgByPublicId} showDeltas={pro} />
        </ScrollView>
      )}

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
      {finished && (hasDelmatch || hasSeries) && (
        <View style={[styles.chromeRight, { top: insets.top + 6 }]}>
          <GlassPill
            icon={hasDelmatch ? 'grid-outline' : 'stats-chart-outline'}
            label={hasDelmatch ? 'Bord' : 'Scorecard'}
            onPress={() => {
              setCardView(hasDelmatch ? 'bord' : 'serie');
              setCardOpen(true);
            }}
          />
        </View>
      )}
      </Animated.View>

      {match && (
        <GlassSheet
          visible={cardOpen}
          onClose={() => setCardOpen(false)}
          title={hasDelmatch && cardView === 'bord' ? 'Bord' : 'Scorecard'}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[8] }}>
            {hasDelmatch && hasSeries && (
              <View style={{ marginBottom: SPACE[4] }}>
                <Segmented
                  options={[{ key: 'bord', label: 'Bord' }, { key: 'serie', label: 'Serie' }]}
                  value={cardView}
                  onChange={setCardView}
                />
              </View>
            )}
            {cardView === 'bord' && delmatch ? (
              <DelmatchBoard summary={delmatch} avg={avgByPublicId} showDeltas={pro} onOpenPlayer={(pid) => { setCardOpen(false); router.push(`/player/${pid}`); }} />
            ) : (
              <MatchScorecard
                homeTeam={match.home_team_name}
                awayTeam={match.away_team_name}
                home={home}
                away={away}
                homeBanp={match.home_result}
                awayBanp={match.away_result}
                homePins={match.home_score}
                awayPins={match.away_score}
              />
            )}
          </ScrollView>
        </GlassSheet>
      )}

      <MomentShareSheet moment={shareMoment} onClose={() => setShareMoment(null)} />
    </View>
  );
}

function HeroTeam({
  name,
  won,
  finished,
  right,
  onPress,
}: {
  name: string;
  won: boolean;
  finished: boolean;
  right?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.heroTeamWrap} onPress={onPress} accessibilityLabel={name}>
      <Text
        style={[styles.heroTeam, right && styles.heroTeamRight, won ? styles.teamWin : finished ? styles.teamLose : null]}
        numberOfLines={2}
      >
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  pageClip: { flex: 1, overflow: 'hidden', backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 }, chromeRight: { position: 'absolute', right: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: COLOR.ink3, fontSize: TYPE.body },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 2, fontFamily: FONT.bold, textAlign: 'center', marginTop: SPACE[2] },

  hero: { flexDirection: 'row', alignItems: 'center', marginTop: SPACE[6] },
  heroTeamWrap: { flex: 1 },
  heroTeam: { color: COLOR.ink2, fontSize: TYPE.body + 3, fontFamily: FONT.semibold, lineHeight: 24 },
  heroTeamRight: { textAlign: 'right' },
  teamWin: { color: COLOR.ink, fontFamily: FONT.bold },
  teamLose: { color: COLOR.ink3 },
  heroCentre: { paddingHorizontal: SPACE[4], alignItems: 'center', gap: 4 },
  pointsRow: { flexDirection: 'row', alignItems: 'baseline' },
  points: { fontSize: TYPE.hero, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  pWin: { color: COLOR.ink },
  pLose: { color: COLOR.ink3 },
  pSep: { color: COLOR.ink4, fontSize: TYPE.title, fontFamily: FONT.score, marginHorizontal: SPACE[2] },
  pointsLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  heroDate: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold },

  pins: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold, textAlign: 'center', marginTop: SPACE[3], fontVariant: ['tabular-nums'] },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', marginTop: SPACE[1] },

  best: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    marginTop: SPACE[6],
    padding: SPACE[4],
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(245,194,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.24)',
  },
  bestText: { flex: 1, minWidth: 0 },
  bestLabel: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  bestName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold, marginTop: 2 },
  bestTotal: { color: COLOR.gold, fontSize: TYPE.title + 4, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
});
