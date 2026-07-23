import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FollowButton } from '@/components/FollowButton';
import { GlassCircle } from '@/components/GlassButtons';
import { MatchRow } from '@/components/MatchRow';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { ListSkeleton } from '@/components/Skeleton';
import { useTeam, useTeamSeasonMatches, useTeamSeasons } from '@/lib/team-data';
import { addToCalendar, shareCSV, sharePDF } from '@/lib/team-export';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const seasonLabel = (s: number) => `${s}/${String((s + 1) % 100).padStart(2, '0')}`;

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
    const up = matches
      .filter((m) => !m.is_finished)
      .sort((a, b) => a.match_date.localeCompare(b.match_date));
    const pa = matches
      .filter((m) => m.is_finished)
      .sort((a, b) => b.match_date.localeCompare(a.match_date));
    return { upcoming: up, past: pa };
  }, [matches]);

  const openTeam = (tid: number) => router.push(`/lag/${tid}`);

  const onCalendar = async () => {
    const res = await addToCalendar(upcoming);
    if (res.ok) {
      Alert.alert('Tillagt i kalendern', `${res.added} ${res.added === 1 ? 'match' : 'matcher'} tillagda.`);
    } else if (res.reason === 'permission') {
      Alert.alert('Kalender', 'Ge Bowlkollen åtkomst till kalendern i Inställningar för att lägga till matcher.');
    } else {
      Alert.alert('Kalender', 'Kunde inte lägga till i kalendern.');
    }
  };

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

        <View style={styles.actions}>
          <FollowButton entityType="team" entityId={String(teamId)} />
          <Action icon="calendar-outline" label="Kalender" onPress={onCalendar} disabled={upcoming.length === 0} />
          <Action icon="grid-outline" label="Excel" onPress={() => shareCSV(teamName, matches)} disabled={matches.length === 0} />
          <Action icon="document-outline" label="PDF" onPress={() => sharePDF(teamName, matches)} disabled={matches.length === 0} />
        </View>

        {seasons.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seasonRow} contentContainerStyle={styles.seasonRowInner}>
            {seasons.map((s) => (
              <PressableScale key={s} style={[styles.seasonPill, s === season && styles.seasonPillOn]} onPress={() => setPicked(s)}>
                <Text style={[styles.seasonText, s === season && styles.seasonTextOn]}>{seasonLabel(s)}</Text>
              </PressableScale>
            ))}
          </ScrollView>
        )}

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

function Action({ icon, label, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <PressableScale style={[styles.action, disabled && styles.actionOff]} onPress={onPress} disabled={disabled}>
      <Ionicons name={icon} size={20} color={disabled ? COLOR.ink4 : COLOR.ink} />
      <Text style={[styles.actionText, disabled && styles.actionTextOff]}>{label}</Text>
    </PressableScale>
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
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], marginTop: SPACE[6] },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: SPACE[1],
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.md,
    backgroundColor: COLOR.surface,
  },
  actionOff: { opacity: 0.5 },
  actionText: { color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  actionTextOff: { color: COLOR.ink4 },
  seasonRow: { marginTop: SPACE[6], marginHorizontal: -SPACE[6] },
  seasonRowInner: { paddingHorizontal: SPACE[6], gap: SPACE[2] },
  seasonPill: {
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[2],
    borderRadius: RADIUS.pill,
    backgroundColor: COLOR.surface,
  },
  seasonPillOn: { backgroundColor: 'rgba(245,194,0,0.14)' },
  seasonText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.bold },
  seasonTextOn: { color: COLOR.gold },
  section: { marginTop: SPACE[8] },
  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
