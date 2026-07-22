import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ListSkeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FollowButton } from '@/components/FollowButton';
import { MatchRow, type MatchRowData } from '@/components/MatchRow';
import { useFollowCount } from '@/lib/follows';
import { supabase } from '@/lib/supabase';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

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

  const teamName = team?.name ?? 'Lag';
  const tc = teamColor(teamName);
  const initials = teamInitials(teamName);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PressableScale style={styles.back} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={COLOR.ink2} />
      </PressableScale>

      {teamLoading ? (
        <ListSkeleton />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.heroRow}>
            <View
              style={[
                styles.avatar,
                { borderColor: tc.ring, backgroundColor: tc.bg, shadowColor: tc.ring },
              ]}
            >
              <Text style={[styles.initials, { color: tc.text }]}>{initials}</Text>
            </View>
            <View style={styles.heroText}>
              {!!divisionName && (
                <Text style={[styles.divLabel, { color: tc.text }]} numberOfLines={1}>
                  {divisionName}
                </Text>
              )}
              <Text style={styles.name} numberOfLines={2}>
                {teamName}
              </Text>
              {team?.club_name && team.club_name !== teamName && (
                <Text style={styles.club} numberOfLines={1}>
                  {team.club_name}
                </Text>
              )}
            </View>
          </View>
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
                <PressableScale
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
                </PressableScale>
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
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], marginTop: SPACE[6] },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
    shadowOpacity: 0.55,
    elevation: 8,
  },
  initials: { fontFamily: FONT.display, fontSize: 26, letterSpacing: 0.5 },
  heroText: { flex: 1, minWidth: 0 },
  divLabel: { fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, marginBottom: 3 },
  name: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.bold, letterSpacing: -0.5 },
  club: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 2 },
  followRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[4] },
  followers: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
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
    paddingVertical: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  playerName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  playerAvg: { color: COLOR.ink3, fontSize: TYPE.caption },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
