import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ListSkeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { ScrollBlur } from '@/components/ScrollBlur';
import { formatMatchDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

type Match = {
  home_team_name: string;
  away_team_name: string;
  home_score: number | null; // pinfall
  away_score: number | null;
  home_result: number | null; // match points
  away_result: number | null;
  home_bits_team_id: number | null;
  away_bits_team_id: number | null;
  division_name: string | null;
  is_finished: boolean | null;
  match_date: string;
  hall_name: string | null;
};

function useMatch(matchId: number) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async (): Promise<Match | null> => {
      const { data } = await supabase
        .from('bits_matches')
        .select(
          'home_team_name, away_team_name, home_score, away_score, home_result, away_result, home_bits_team_id, away_bits_team_id, division_name, is_finished, match_date, hall_name',
        )
        .eq('bits_match_id', matchId)
        .maybeSingle();
      return data;
    },
  });
}

type ResultRow = {
  player_name: string;
  total_result: number;
  series: number[];
  is_home_team: boolean;
  public_id: string | null;
};

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

export default function MatchPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const { data: match, isLoading } = useMatch(matchId);
  const { data: results = [] } = useMatchResults(matchId);

  const home = results.filter((r) => r.is_home_team);
  const away = results.filter((r) => !r.is_home_team);

  const finished = !!match?.is_finished && match.home_result != null && match.away_result != null;
  const homeWon = finished && (match!.home_result ?? 0) > (match!.away_result ?? 0);
  const awayWon = finished && (match!.away_result ?? 0) > (match!.home_result ?? 0);
  const hasPins = finished && match!.home_score != null && match!.away_score != null;

  const openTeam = (tid: number | null) => tid != null && router.push(`/lag/${tid}`);

  return (
    <View style={styles.safe}>
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
              <Text style={styles.pointsLabel}>{finished ? 'MATCHPOÄNG' : 'KOMMANDE'}</Text>
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

          <TeamResults teamName={match.home_team_name} pins={match.home_score} rows={home} />
          <TeamResults teamName={match.away_team_name} pins={match.away_score} rows={away} />
        </ScrollView>
      )}

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
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

function TeamResults({ teamName, pins, rows }: { teamName: string; pins: number | null; rows: ResultRow[] }) {
  const router = useRouter();
  if (rows.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionLabel} numberOfLines={1}>{teamName.toUpperCase()}</Text>
        {pins != null && <Text style={styles.teamPins}>{pins}</Text>}
      </View>
      {rows.map((r, i) => (
        <PressableScale
          key={i}
          style={styles.playerRow}
          disabled={!r.public_id}
          onPress={() => r.public_id && router.push(`/player/${r.public_id}`)}
        >
          <View style={styles.playerTop}>
            <Text style={styles.playerName} numberOfLines={1}>{r.player_name}</Text>
            <Text style={styles.total}>{r.total_result}</Text>
          </View>
          {r.series?.length > 0 && (
            <View style={styles.seriesRow}>
              {r.series.map((g, gi) => (
                <Text key={gi} style={styles.seriesNum}>{g}</Text>
              ))}
            </View>
          )}
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 },
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
  points: { fontSize: TYPE.hero, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  pWin: { color: COLOR.ink },
  pLose: { color: COLOR.ink3 },
  pSep: { color: COLOR.ink4, fontSize: TYPE.title, fontFamily: FONT.display, marginHorizontal: SPACE[2] },
  pointsLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  heroDate: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold },

  pins: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold, textAlign: 'center', marginTop: SPACE[3], fontVariant: ['tabular-nums'] },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', marginTop: SPACE[1] },

  section: { marginTop: SPACE[8] },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: SPACE[2] },
  sectionLabel: { flex: 1, color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  teamPins: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  playerRow: {
    paddingVertical: SPACE[3],
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
    gap: 4,
  },
  playerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3] },
  playerName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  total: { color: COLOR.ink, fontSize: TYPE.body + 4, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  seriesRow: { flexDirection: 'row', gap: SPACE[3] },
  seriesNum: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.regular, fontVariant: ['tabular-nums'] },
});
