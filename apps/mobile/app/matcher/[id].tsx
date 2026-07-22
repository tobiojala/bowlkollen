import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ListSkeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMatchDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

function useMatch(matchId: number) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('bits_matches')
        .select(
          'home_team_name, away_team_name, home_score, away_score, division_name, is_finished, match_date, hall_name',
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const { data: match, isLoading } = useMatch(matchId);
  const { data: results = [] } = useMatchResults(matchId);

  const home = results.filter((r) => r.is_home_team);
  const away = results.filter((r) => !r.is_home_team);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PressableScale style={styles.back} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={COLOR.ink2} />
      </PressableScale>

      {isLoading ? (
        <ListSkeleton />
      ) : !match ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Matchen hittades inte.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {!!match.division_name && <Text style={styles.kicker}>{match.division_name}</Text>}
          <View style={styles.hero}>
            <Text style={styles.heroTeam} numberOfLines={2}>
              {match.home_team_name}
            </Text>
            <View style={styles.heroCenter}>
              {match.is_finished ? (
                <Text style={styles.heroScore}>
                  {match.home_score ?? 0}–{match.away_score ?? 0}
                </Text>
              ) : (
                <Text style={styles.heroDate}>{formatMatchDate(match.match_date)}</Text>
              )}
            </View>
            <Text style={[styles.heroTeam, styles.heroTeamRight]} numberOfLines={2}>
              {match.away_team_name}
            </Text>
          </View>
          <Text style={styles.meta}>
            {[formatMatchDate(match.match_date), match.hall_name].filter(Boolean).join(' · ')}
          </Text>

          {home.length > 0 && (
            <ResultBlock title={match.home_team_name} rows={home} />
          )}
          {away.length > 0 && (
            <ResultBlock title={match.away_team_name} rows={away} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ResultBlock({ title, rows }: { title: string; rows: ResultRow[] }) {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel} numberOfLines={1}>
        {title.toUpperCase()}
      </Text>
      {rows.map((r, i) => (
        <PressableScale
          key={i}
          style={styles.playerRow}
          disabled={!r.public_id}
          onPress={() => r.public_id && router.push(`/player/${r.public_id}`)}
        >
          <View style={styles.playerText}>
            <Text style={styles.playerName} numberOfLines={1}>
              {r.player_name}
            </Text>
            {r.series?.length > 0 && (
              <Text style={styles.series}>{r.series.join(' · ')}</Text>
            )}
          </View>
          <Text style={styles.total}>{r.total_result}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  back: { paddingHorizontal: SPACE[4], paddingTop: SPACE[2], paddingBottom: SPACE[1] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: COLOR.ink3, fontSize: TYPE.body },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  kicker: {
    color: COLOR.gold,
    fontSize: TYPE.label,
    letterSpacing: 2,
    fontFamily: FONT.bold,
    textAlign: 'center',
    marginTop: SPACE[2],
  },
  hero: { flexDirection: 'row', alignItems: 'center', marginTop: SPACE[4] },
  heroTeam: { flex: 1, color: COLOR.ink, fontSize: TYPE.body + 2, fontFamily: FONT.bold },
  heroTeamRight: { textAlign: 'right' },
  heroCenter: { paddingHorizontal: SPACE[4], alignItems: 'center' },
  heroScore: { color: COLOR.ink, fontSize: TYPE.hero, fontFamily: FONT.display },
  heroDate: { color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.bold },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', marginTop: SPACE[2] },
  section: { marginTop: SPACE[8] },
  sectionLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginBottom: SPACE[2],
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE[3],
    paddingVertical: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  playerText: { flex: 1, minWidth: 0 },
  playerName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  series: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  total: { color: COLOR.ink, fontSize: TYPE.body + 2, fontFamily: FONT.bold },
});
