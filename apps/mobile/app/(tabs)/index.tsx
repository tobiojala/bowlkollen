import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatMatchDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { COLOR, RADIUS, SPACE, TYPE } from '@/theme';

type Match = {
  bits_match_id: number;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  division_name: string;
  is_finished: boolean;
  hall_name: string;
};

function useMyMatches() {
  return useQuery({
    queryKey: ['my-matches'],
    staleTime: 60_000,
    queryFn: async (): Promise<Match[]> => {
      const { data, error } = await supabase.rpc('get_user_season_matches');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function Home() {
  const router = useRouter();
  const { data = [], isLoading } = useMyMatches();

  const upcoming = data
    .filter((m) => !m.is_finished)
    .sort((a, b) => a.match_date.localeCompare(b.match_date));
  const results = data
    .filter((m) => m.is_finished)
    .sort((a, b) => b.match_date.localeCompare(a.match_date));

  const sections = [
    { title: 'KOMMANDE', data: upcoming },
    { title: 'RESULTAT', data: results },
  ].filter((s) => s.data.length > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.kicker}>BOWLKOLLEN</Text>
        <Text style={styles.title}>Hem</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLOR.gold} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Din feed är tom</Text>
          <Text style={styles.emptyBody}>
            Följ lag och spelare så fylls den med deras matcher.
          </Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push('/schema')}>
            <Text style={styles.emptyBtnText}>Utforska divisioner</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(m) => String(m.bits_match_id)}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          )}
          renderItem={({ item }) => <MatchRow m={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function MatchRow({ m }: { m: Match }) {
  return (
    <View style={styles.match}>
      <View style={styles.faceoff}>
        <Text style={styles.team} numberOfLines={1}>
          {m.home_team_name}
        </Text>
        <View style={styles.centerCol}>
          {m.is_finished ? (
            <Text style={styles.score}>
              {m.home_score}–{m.away_score}
            </Text>
          ) : (
            <Text style={styles.date}>{formatMatchDate(m.match_date)}</Text>
          )}
        </View>
        <Text style={[styles.team, styles.teamRight]} numberOfLines={1}>
          {m.away_team_name}
        </Text>
      </View>
      <Text style={styles.meta} numberOfLines={1}>
        {[m.division_name, m.is_finished ? formatMatchDate(m.match_date) : null, m.hall_name]
          .filter(Boolean)
          .join(' · ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  header: { paddingHorizontal: SPACE[6], paddingTop: SPACE[6], paddingBottom: SPACE[4] },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 3, fontWeight: '700' },
  title: { color: COLOR.ink, fontSize: TYPE.title + 8, fontWeight: '800', letterSpacing: -0.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  sectionLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: SPACE[6],
    marginBottom: SPACE[2],
  },
  match: {
    paddingVertical: SPACE[4],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
    gap: SPACE[2],
  },
  faceoff: { flexDirection: 'row', alignItems: 'center' },
  team: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontWeight: '600' },
  teamRight: { textAlign: 'right' },
  centerCol: { paddingHorizontal: SPACE[3], minWidth: 64, alignItems: 'center' },
  score: { color: COLOR.ink, fontSize: TYPE.body + 4, fontWeight: '800', letterSpacing: 0.5 },
  date: { color: COLOR.ink3, fontSize: TYPE.caption, fontWeight: '600' },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE[8], gap: SPACE[3] },
  emptyTitle: { color: COLOR.ink, fontSize: TYPE.title, fontWeight: '800' },
  emptyBody: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center' },
  emptyBtn: {
    marginTop: SPACE[2],
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE[6],
    paddingVertical: SPACE[3],
  },
  emptyBtnText: { color: COLOR.gold, fontSize: TYPE.caption, fontWeight: '700' },
});
