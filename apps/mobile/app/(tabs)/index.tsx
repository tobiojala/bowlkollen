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

import { MatchRow } from '@/components/MatchRow';
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
