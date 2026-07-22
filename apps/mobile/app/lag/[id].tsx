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

import { FollowButton } from '@/components/FollowButton';
import { MatchRow, type MatchRowData } from '@/components/MatchRow';
import { useFollowCount } from '@/lib/follows';
import { supabase } from '@/lib/supabase';
import { COLOR, SPACE, TYPE } from '@/theme';

const CURRENT_SEASON = 2026;

function useTeam(teamId: number) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from('bits_teams')
        .select('name, club_name')
        .eq('bits_team_id', teamId)
        .maybeSingle();
      return data;
    },
  });
}

function useTeamMatches(teamId: number) {
  return useQuery({
    queryKey: ['team-matches', teamId],
    queryFn: async (): Promise<MatchRowData[]> => {
      const { data, error } = await supabase
        .from('bits_matches')
        .select(
          'bits_match_id, home_team_name, away_team_name, home_result, away_result, division_name, is_finished, match_date, hall_name',
        )
        .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
        .eq('season_id', CURRENT_SEASON);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useRoster(teamId: number) {
  return useQuery({
    queryKey: ['team-roster', teamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_roster', {
        p_bits_team_id: teamId,
        p_limit: 20,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function TeamPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);

  const { data: team, isLoading: teamLoading } = useTeam(teamId);
  const { data: matches = [] } = useTeamMatches(teamId);
  const { data: roster = [] } = useRoster(teamId);
  const { data: followers = 0 } = useFollowCount('team', String(teamId));

  const upcoming = matches
    .filter((m) => !m.is_finished)
    .sort((a, b) => a.match_date.localeCompare(b.match_date));
  const results = matches
    .filter((m) => m.is_finished)
    .sort((a, b) => b.match_date.localeCompare(a.match_date));
  const divisionName = matches.find((m) => m.division_name)?.division_name ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={COLOR.ink2} />
      </Pressable>

      {teamLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLOR.gold} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.kicker}>{divisionName ?? 'LAG'}</Text>
          <Text style={styles.name}>{team?.name ?? 'Lag'}</Text>
          {team?.club_name && team.club_name !== team?.name && (
            <Text style={styles.club}>{team.club_name}</Text>
          )}
          <View style={styles.followRow}>
            <FollowButton entityType="team" entityId={String(teamId)} />
            <Text style={styles.followers}>{followers} följare</Text>
          </View>

          {upcoming.length > 0 && (
            <Section label="KOMMANDE">
              {upcoming.map((m) => (
                <MatchRow
                  key={m.bits_match_id}
                  m={m}
                  showDivision={false}
                  onPress={() => router.push(`/matcher/${m.bits_match_id}`)}
                />
              ))}
            </Section>
          )}

          {results.length > 0 && (
            <Section label="RESULTAT">
              {results.map((m) => (
                <MatchRow
                  key={m.bits_match_id}
                  m={m}
                  showDivision={false}
                  onPress={() => router.push(`/matcher/${m.bits_match_id}`)}
                />
              ))}
            </Section>
          )}

          {roster.length > 0 && (
            <Section label="TRUPP">
              {roster.map((p) => (
                <Pressable
                  key={p.public_id}
                  style={styles.playerRow}
                  onPress={() => router.push(`/player/${p.public_id}`)}
                >
                  <Text style={styles.playerName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  {!!p.licence_average && (
                    <Text style={styles.playerAvg}>Snitt {p.licence_average}</Text>
                  )}
                </Pressable>
              ))}
            </Section>
          )}

          {matches.length === 0 && roster.length === 0 && (
            <Text style={styles.empty}>Ingen säsongsdata för det här laget ännu.</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  back: { paddingHorizontal: SPACE[4], paddingTop: SPACE[2], paddingBottom: SPACE[1] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  kicker: {
    color: COLOR.gold,
    fontSize: TYPE.label,
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: SPACE[2],
  },
  name: { color: COLOR.ink, fontSize: TYPE.title + 10, fontWeight: '800', letterSpacing: -0.5, marginTop: SPACE[1] },
  club: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: 2 },
  followRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[4] },
  followers: { color: COLOR.ink3, fontSize: TYPE.caption, fontWeight: '600' },
  section: { marginTop: SPACE[8] },
  sectionLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: SPACE[2],
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  playerName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontWeight: '600' },
  playerAvg: { color: COLOR.ink3, fontSize: TYPE.caption },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
