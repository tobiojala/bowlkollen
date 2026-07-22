import { Ionicons } from '@expo/vector-icons';
import { computeStandings } from '@bowlkollen/core';
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

type TeamMatch = MatchRowData & {
  home_bits_team_id: number;
  away_bits_team_id: number;
  bits_division_id: number | null;
};

function useTeamMatches(teamId: number) {
  return useQuery({
    queryKey: ['team-matches', teamId],
    queryFn: async (): Promise<TeamMatch[]> => {
      const { data, error } = await supabase
        .from('bits_matches')
        .select(
          'bits_match_id, home_team_name, away_team_name, home_result, away_result, division_name, is_finished, match_date, hall_name, home_bits_team_id, away_bits_team_id, bits_division_id',
        )
        .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
        .eq('season_id', CURRENT_SEASON);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Full division table -> this team's standing (rank / points), via the shared
// computeStandings from @bowlkollen/core.
function useTeamStanding(divisionId: number | null, teamId: number) {
  return useQuery({
    queryKey: ['team-standing', divisionId, teamId],
    enabled: divisionId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bits_matches')
        .select(
          'bits_match_id, home_bits_team_id, away_bits_team_id, home_team_name, away_team_name, home_result, away_result, is_finished, match_date, round_id, hall_name',
        )
        .eq('bits_division_id', divisionId!)
        .eq('season_id', CURRENT_SEASON);
      if (error) throw error;
      const table = computeStandings(data ?? []);
      const idx = table.findIndex((s) => s.teamId === teamId);
      if (idx === -1) return null;
      return { rank: idx + 1, total: table.length, points: table[idx].points };
    },
  });
}

type FormResult = 'W' | 'L' | 'D';

function computeForm(matches: TeamMatch[], teamId: number): FormResult[] {
  return matches
    .filter((m) => m.is_finished && m.home_result != null && m.away_result != null)
    .sort((a, b) => a.match_date.localeCompare(b.match_date))
    .slice(-5)
    .map((m) => {
      const home = m.home_bits_team_id === teamId;
      const my = (home ? m.home_result : m.away_result) ?? 0;
      const opp = (home ? m.away_result : m.home_result) ?? 0;
      return my > opp ? 'W' : my < opp ? 'L' : 'D';
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
  const divisionId = matches.find((m) => m.bits_division_id != null)?.bits_division_id ?? null;
  const { data: standing } = useTeamStanding(divisionId, teamId);

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
  const form = computeForm(matches, teamId);

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

          {(standing || form.length > 0) && (
            <View style={styles.statRow}>
              <Stat value={standing ? `${standing.rank}/${standing.total}` : '–'} label="PLACERING" />
              <View style={styles.statDivider} />
              <Stat value={standing ? String(standing.points) : '–'} label="POÄNG" />
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                {form.length > 0 ? (
                  <View style={styles.formDots}>
                    {form.map((r, i) => (
                      <View
                        key={i}
                        style={[
                          styles.formDot,
                          {
                            backgroundColor:
                              r === 'W' ? COLOR.green : r === 'L' ? COLOR.red : COLOR.surface2,
                          },
                        ]}
                      >
                        <Text style={[styles.formDotText, { color: r === 'D' ? COLOR.ink2 : COLOR.bg }]}>
                          {r === 'W' ? 'V' : r === 'L' ? 'F' : 'O'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.statValue}>–</Text>
                )}
                <Text style={styles.statLabel}>FORM</Text>
              </View>
            </View>
          )}

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
                  <Text style={styles.playerAvg} numberOfLines={1}>
                    {[
                      p.licence_average ? `snitt ${p.licence_average}` : null,
                      `${p.appearances} ${p.appearances === 1 ? 'match' : 'matcher'}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color={COLOR.ink4} />
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACE[6] },
  statCol: { flex: 1, alignItems: 'center', gap: 6 },
  statValue: { fontFamily: FONT.display, fontSize: 26, color: COLOR.ink, letterSpacing: -0.5 },
  statLabel: { fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, color: COLOR.ink3 },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: COLOR.hairline },
  formDots: { flexDirection: 'row', gap: 5 },
  formDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  formDotText: { fontSize: 10, fontFamily: FONT.bold },
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
    gap: SPACE[3],
    paddingVertical: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  playerName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  playerAvg: { color: COLOR.ink3, fontSize: TYPE.caption },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
