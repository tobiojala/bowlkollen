import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { MatchRow } from '@/components/MatchRow';
import { PressableScale } from '@/components/PressableScale';
import { ScheduleActions } from '@/components/ScheduleActions';
import { ScrollBlur } from '@/components/ScrollBlur';
import { SeasonPills } from '@/components/SeasonPills';
import { ListSkeleton } from '@/components/Skeleton';
import { useTeam, useTeamSeasonMatches, useTeamSeasons } from '@/lib/team-data';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

export default function TeamSchedulePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);

  const { data: team } = useTeam(teamId);
  const { data: seasons = [] } = useTeamSeasons(teamId);
  const [picked, setPicked] = useState<number | null>(null);
  const season = picked ?? seasons[0] ?? null;
  const { data: matches = [], isLoading } = useTeamSeasonMatches(teamId, season);

  const teamName = team?.name ?? 'Lag';

  const { upcoming, past } = useMemo(() => {
    const up = matches.filter((m) => !m.is_finished).sort((a, b) => a.match_date.localeCompare(b.match_date));
    const pa = matches.filter((m) => m.is_finished).sort((a, b) => b.match_date.localeCompare(a.match_date));
    return { upcoming: up, past: pa };
  }, [matches]);

  const openTeam = (tid: number) => router.push(`/lag/${tid}`);

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}>
        <Text style={styles.kicker}>SPELSCHEMA</Text>
        <PressableScale onPress={() => router.push(`/lag/${teamId}`)} hitSlop={6}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>{teamName}</Text>
            <Ionicons name="chevron-forward" size={22} color={COLOR.ink3} />
          </View>
        </PressableScale>

        <ScheduleActions followType="team" followId={String(teamId)} name={teamName} upcoming={upcoming} matches={matches} />
        <SeasonPills seasons={seasons} selected={season} onSelect={setPicked} />

        {isLoading ? (
          <ListSkeleton />
        ) : (
          <>
            {upcoming.length > 0 && (
              <Section label="KOMMANDE">
                {upcoming.map((m) => (
                  <MatchRow key={m.bits_match_id} m={m} showDivision={false} onPress={() => router.push(`/matcher/${m.bits_match_id}`)} onOpenTeam={openTeam} />
                ))}
              </Section>
            )}
            {past.length > 0 && (
              <Section label="SPELADE">
                {past.map((m) => (
                  <MatchRow key={m.bits_match_id} m={m} showDivision={false} onPress={() => router.push(`/matcher/${m.bits_match_id}`)} onOpenTeam={openTeam} />
                ))}
              </Section>
            )}
            {matches.length === 0 && <Text style={styles.empty}>Inga matcher den här säsongen.</Text>}
          </>
        )}
      </ScrollView>

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
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
  chromeLeft: { position: 'absolute', left: 16 },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 2, fontFamily: FONT.bold },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], marginTop: SPACE[1] },
  name: { flex: 1, color: COLOR.ink, fontSize: TYPE.title + 6, fontFamily: FONT.bold, letterSpacing: -0.5 },
  section: { marginTop: SPACE[8] },
  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
