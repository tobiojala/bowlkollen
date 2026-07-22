import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MatchRow } from '@/components/MatchRow';
import { supabase } from '@/lib/supabase';
import { COLOR, SPACE, TYPE } from '@/theme';

const CURRENT_SEASON = 2026;

function useDivision(divisionId: number) {
  return useQuery({
    queryKey: ['division', divisionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('bits_divisions')
        .select('name')
        .eq('bits_division_id', divisionId)
        .eq('season_id', CURRENT_SEASON)
        .maybeSingle();
      return data;
    },
  });
}

function useDivisionMatches(divisionId: number) {
  return useQuery({
    queryKey: ['division-matches', divisionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bits_matches')
        .select(
          'bits_match_id, home_team_name, away_team_name, home_result, away_result, division_name, is_finished, match_date, hall_name, home_bits_team_id, away_bits_team_id',
        )
        .eq('bits_division_id', divisionId)
        .eq('season_id', CURRENT_SEASON);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function DivisionPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const divisionId = Number(id);
  const { data: division, isLoading } = useDivision(divisionId);
  const { data: matches = [] } = useDivisionMatches(divisionId);

  // Unique teams from the season's matches.
  const teamMap = new Map<number, string>();
  for (const m of matches) {
    teamMap.set(m.home_bits_team_id, m.home_team_name);
    teamMap.set(m.away_bits_team_id, m.away_team_name);
  }
  const teams = [...teamMap.entries()]
    .map(([tid, name]) => ({ tid, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const recent = matches
    .filter((m) => m.is_finished)
    .sort((a, b) => b.match_date.localeCompare(a.match_date))
    .slice(0, 15);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={COLOR.ink2} />
      </Pressable>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLOR.gold} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.kicker}>DIVISION</Text>
          <Text style={styles.name}>{division?.name ?? matches[0]?.division_name ?? 'Division'}</Text>

          {teams.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LAG</Text>
              {teams.map((t) => (
                <Pressable
                  key={t.tid}
                  style={styles.teamRow}
                  onPress={() => router.push(`/lag/${t.tid}`)}
                >
                  <Text style={styles.teamName} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={COLOR.ink4} />
                </Pressable>
              ))}
            </View>
          )}

          {recent.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SENASTE RESULTAT</Text>
              {recent.map((m) => (
                <MatchRow
                  key={m.bits_match_id}
                  m={m}
                  showDivision={false}
                  onPress={() => router.push(`/matcher/${m.bits_match_id}`)}
                />
              ))}
            </View>
          )}

          {matches.length === 0 && (
            <Text style={styles.empty}>Ingen säsongsdata för den här divisionen ännu.</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  back: { paddingHorizontal: SPACE[4], paddingTop: SPACE[2], paddingBottom: SPACE[1] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 2, fontWeight: '700', marginTop: SPACE[2] },
  name: { color: COLOR.ink, fontSize: TYPE.title + 6, fontWeight: '800', letterSpacing: -0.5, marginTop: SPACE[1] },
  section: { marginTop: SPACE[8] },
  sectionLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: SPACE[2],
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE[4],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  teamName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontWeight: '600' },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
