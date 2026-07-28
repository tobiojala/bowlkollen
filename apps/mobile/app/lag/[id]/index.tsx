import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ListSkeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FollowButton } from '@/components/FollowButton';
import { GlassCircle } from '@/components/GlassButtons';
import { GlassSheet } from '@/components/GlassSheet';
import { ScrollBlur } from '@/components/ScrollBlur';
import { CrestViewer } from '@/components/CrestViewer';
import { HeaderBand } from '@/components/HeaderBand';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { LineupDisplay } from '@/components/LineupDisplay';
import { MatchRow } from '@/components/MatchRow';
import { PlayerRosterCard } from '@/components/PlayerRosterCard';
import { StandingsLadder } from '@/components/StandingsLadder';
import { StandingsTable } from '@/components/StandingsTable';
import { useAuth } from '@/lib/auth';
import { useFollowCount } from '@/lib/follows';
import { useMyTeamRole } from '@/lib/team-admin';
import {
  computeForm,
  useRoster,
  useTeam,
  useTeamMatches,
  useTeamStanding,
} from '@/lib/team-data';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const MATCH_PREVIEW = 3; // keep the profile short — the rest lives in the schedule

export default function TeamPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);

  const { data: team, isLoading: teamLoading } = useTeam(teamId);
  const { data: matches = [] } = useTeamMatches(teamId);
  const { data: roster = [] } = useRoster(teamId);
  const { data: followers = 0 } = useFollowCount('team', String(teamId));
  const { data: myRole } = useMyTeamRole(teamId);
  const { session } = useAuth();
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
  const base = teamColor(teamName);
  const tc = team?.ringColor ? { ...base, ring: team.ringColor } : base;
  const initials = teamInitials(teamName);
  const form = computeForm(matches, teamId);

  const openTeam = (tid: number) => {
    if (tid !== teamId) router.push(`/lag/${tid}/schema`);
  };

  const [tableOpen, setTableOpen] = useState(false);
  const [crestOpen, setCrestOpen] = useState(false);
  const bg = useSharedValue(0);
  useEffect(() => {
    bg.value = tableOpen
      ? withSpring(1, { stiffness: 240, damping: 30, mass: 0.9 })
      : withTiming(0, { duration: 220 });
  }, [tableOpen]);
  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - bg.value * 0.06 }],
    borderRadius: bg.value * 24,
  }));

  return (
    <View style={styles.safe}>
      <Animated.View style={[styles.pageClip, bgStyle]}>
      {teamLoading ? (
        <ListSkeleton />
      ) : (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}>
          <HeaderBand color={team?.headerColor ?? tc.ring} />
          <View style={styles.heroRow}>
            <PressableScale onPress={() => team?.logoUrl && setCrestOpen(true)} disabled={!team?.logoUrl}>
              <IdentityAvatar colors={tc} initials={initials} imageUrl={team?.logoUrl} size={80} />
            </PressableScale>
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

          {myRole ? (
            <PressableScale style={styles.manage} onPress={() => router.push(`/lag/${teamId}/laget`)}>
              <Ionicons name="clipboard-outline" size={22} color={COLOR.gold} />
              <View style={styles.manageText}>
                <Text style={styles.manageTitle}>Mitt lag</Text>
                <Text style={styles.manageBody}>
                  {myRole === 'captain' ? 'Närvaro & laguppställning' : 'Svara på närvaro för kommande matcher'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLOR.ink3} />
            </PressableScale>
          ) : session ? (
            <PressableScale style={styles.manage} onPress={() => router.push(`/lag/${teamId}/ga-med`)}>
              <Ionicons name="person-add-outline" size={22} color={COLOR.gold} />
              <View style={styles.manageText}>
                <Text style={styles.manageTitle}>Spelar du i laget?</Text>
                <Text style={styles.manageBody}>Gå med för närvaro och lagverktyg.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLOR.ink3} />
            </PressableScale>
          ) : null}

          {(standing?.rank != null || form.length > 0) && (
            <View style={styles.statRow}>
              <Stat value={standing?.rank != null ? `${standing.rank}/${standing.total}` : '–'} label="PLACERING" />
              <View style={styles.statDivider} />
              <Stat value={standing?.points != null ? String(standing.points) : '–'} label="POÄNG" />
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

          {standing?.table && standing.table.length > 1 && (
            <StandingsLadder
              standings={standing.table}
              teamId={teamId}
              historical={standing.historical}
              onOpenTeam={(tid) => router.push(`/lag/${tid}`)}
              onOpenDivision={() => setTableOpen(true)}
            />
          )}

          {upcoming[0] && (
            <LineupDisplay
              teamId={teamId}
              matchId={upcoming[0].bits_match_id}
              subtitle={
                (upcoming[0].home_bits_team_id === teamId ? 'Hemma mot ' : 'Borta mot ') +
                (upcoming[0].home_bits_team_id === teamId ? upcoming[0].away_team_name : upcoming[0].home_team_name)
              }
            />
          )}

          {upcoming.length > 0 && (
            <Section
              label="KOMMANDE"
              linkLabel={upcoming.length > MATCH_PREVIEW ? 'Hela schemat' : undefined}
              onLink={() => router.push(`/lag/${teamId}/schema`)}
            >
              {upcoming.slice(0, MATCH_PREVIEW).map((m) => (
                <MatchRow
                  key={m.bits_match_id}
                  m={m}
                  showDivision={false}
                  onPress={() => router.push(`/matcher/${m.bits_match_id}`)}
                  onOpenTeam={openTeam}
                />
              ))}
            </Section>
          )}

          {results.length > 0 && (
            <Section
              label="RESULTAT"
              linkLabel={results.length > MATCH_PREVIEW ? 'Alla resultat' : undefined}
              onLink={() => router.push(`/lag/${teamId}/schema`)}
            >
              {results.slice(0, MATCH_PREVIEW).map((m) => (
                <MatchRow
                  key={m.bits_match_id}
                  m={m}
                  showDivision={false}
                  onPress={() => router.push(`/matcher/${m.bits_match_id}`)}
                  onOpenTeam={openTeam}
                />
              ))}
            </Section>
          )}

          {roster.length > 0 && (
            <Section label="TRUPP">
              <View style={styles.roster}>
                {roster.map((p) => (
                  <PlayerRosterCard
                    key={p.public_id}
                    name={p.name}
                    average={p.licence_average}
                    appearances={p.appearances}
                    onPress={() => router.push(`/player/${p.public_id}`)}
                  />
                ))}
              </View>
            </Section>
          )}

          {matches.length === 0 && roster.length === 0 && (
            <Text style={styles.empty}>Ingen säsongsdata för det här laget ännu.</Text>
          )}
        </ScrollView>
      )}

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
      </Animated.View>

      <GlassSheet
        visible={tableOpen}
        onClose={() => setTableOpen(false)}
        title={standing?.historical ? 'Tabell — förra säsongen' : 'Tabell'}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[8] }}>
          {standing?.table && (
            <StandingsTable
              standings={standing.table}
              highlightTeamId={teamId}
              onOpenTeam={(tid) => {
                setTableOpen(false);
                router.push(`/lag/${tid}`);
              }}
              animate
            />
          )}
        </ScrollView>
      </GlassSheet>

      <CrestViewer visible={crestOpen} uri={team?.logoUrl ?? null} name={teamName} onClose={() => setCrestOpen(false)} />
    </View>
  );
}

function Section({
  label,
  linkLabel,
  onLink,
  children,
}: {
  label: string;
  linkLabel?: string;
  onLink?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {linkLabel && onLink && (
          <PressableScale onPress={onLink} hitSlop={8}>
            <Text style={styles.sectionLink}>{linkLabel}</Text>
          </PressableScale>
        )}
      </View>
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
  pageClip: { flex: 1, overflow: 'hidden', backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], marginTop: SPACE[6] },
  heroText: { flex: 1, minWidth: 0 },
  divLabel: { fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, marginBottom: 3 },
  name: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.bold, letterSpacing: -0.5 },
  club: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 2 },
  followRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[4] },
  followers: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  manage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    marginTop: SPACE[4],
    padding: SPACE[4],
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(245,194,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.24)',
  },
  manageText: { flex: 1, minWidth: 0, gap: 2 },
  manageTitle: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  manageBody: { color: COLOR.ink3, fontSize: TYPE.caption, lineHeight: 18 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACE[6] },
  statCol: { flex: 1, alignItems: 'center', gap: 6 },
  statValue: { fontFamily: FONT.display, fontSize: 26, color: COLOR.ink, letterSpacing: -0.5 },
  statLabel: { fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, color: COLOR.ink3 },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: COLOR.hairline },
  formDots: { flexDirection: 'row', gap: 5 },
  formDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  formDotText: { fontSize: 10, fontFamily: FONT.bold },
  section: { marginTop: SPACE[8] },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: SPACE[2],
  },
  sectionLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
  },
  sectionLink: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  roster: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3] },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
