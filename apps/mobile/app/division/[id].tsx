import { computeStandings } from '@bowlkollen/core';
import { useQuery } from '@tanstack/react-query';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListSkeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';

import { GlassCircle, GlassPill } from '@/components/GlassButtons';
import { GlassSheet } from '@/components/GlassSheet';
import { MatchRow } from '@/components/MatchRow';
import { RoundGroups } from '@/components/RoundGroups';
import { ScrollBlur } from '@/components/ScrollBlur';
import { StandingsTable } from '@/components/StandingsTable';
import { supabase } from '@/lib/supabase';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

type SheetKind = 'table' | 'upcoming' | 'season' | null;

const CURRENT_SEASON = 2026;
const PREVIOUS_SEASON = 2025;
const MATCH_COLS =
  'bits_match_id, home_team_name, away_team_name, home_result, away_result, division_name, is_finished, match_date, hall_name, home_bits_team_id, away_bits_team_id, round_id';

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

// Division IDs are stable across seasons, so pre-season (no finished matches yet)
// falls back to last season's same division, flagged historical — mirrors the
// team page + the web.
function useDivisionMatches(divisionId: number) {
  return useQuery({
    queryKey: ['division-matches', divisionId],
    queryFn: async () => {
      const cur = await supabase
        .from('bits_matches')
        .select(MATCH_COLS)
        .eq('bits_division_id', divisionId)
        .eq('season_id', CURRENT_SEASON);
      if (cur.error) throw cur.error;
      const curMatches = cur.data ?? [];
      // Upcoming fixtures always come from THIS season's schedule.
      const upcoming = curMatches
        .filter((m) => !m.is_finished)
        .sort((a, b) => a.match_date.localeCompare(b.match_date));

      if (curMatches.some((m) => m.is_finished)) {
        return { matches: curMatches, upcoming, historical: false };
      }

      // Pre-season: no results yet -> table + results fall back to last season.
      const prev = await supabase
        .from('bits_matches')
        .select(MATCH_COLS)
        .eq('bits_division_id', divisionId)
        .eq('season_id', PREVIOUS_SEASON);
      if (prev.error) throw prev.error;
      const prevMatches = prev.data ?? [];
      if (prevMatches.some((m) => m.is_finished)) {
        return { matches: prevMatches, upcoming, historical: true };
      }
      return { matches: curMatches, upcoming, historical: false };
    },
  });
}

export default function DivisionPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const divisionId = Number(id);
  const { data: division, isLoading } = useDivision(divisionId);
  const { data: matchData } = useDivisionMatches(divisionId);
  const matches = matchData?.matches ?? [];
  const upcoming = matchData?.upcoming ?? [];
  const historical = matchData?.historical ?? false;

  const standings = computeStandings(matches);

  const past = matches
    .filter((m) => m.is_finished)
    .sort((a, b) => b.match_date.localeCompare(a.match_date));

  // Nearest upcoming omgång and latest played omgång — the rest expands into sheets.
  const nextRound = upcoming[0]?.round_id ?? null;
  const nextRoundMatches = upcoming.filter((m) => m.round_id === nextRound);
  const lastRound = past[0]?.round_id ?? null;
  const lastRoundMatches = past.filter((m) => m.round_id === lastRound);
  const hasMoreUpcoming = upcoming.length > nextRoundMatches.length;
  const hasMorePast = past.length > lastRoundMatches.length;

  const [sheet, setSheet] = useState<SheetKind>(null);
  const openMatch = (mid: number) => {
    setSheet(null);
    router.push(`/matcher/${mid}`);
  };
  const openTeam = (tid: number) => {
    setSheet(null);
    router.push(`/lag/${tid}`);
  };

  const bg = useSharedValue(0);
  useEffect(() => {
    bg.value = sheet != null
      ? withSpring(1, { stiffness: 240, damping: 30, mass: 0.9 })
      : withTiming(0, { duration: 220 });
  }, [sheet]);
  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - bg.value * 0.06 }],
    borderRadius: bg.value * 24,
  }));

  const sheetTitle =
    sheet === 'table'
      ? historical ? 'Tabell — förra säsongen' : 'Tabell'
      : sheet === 'upcoming'
        ? 'Kommande omgångar'
        : historical ? 'Förra säsongen' : 'Hela säsongen';

  return (
    <View style={styles.safe}>
      <Animated.View style={[styles.pageClip, bgStyle]}>
          {isLoading ? (
            <ListSkeleton />
          ) : (
            <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}>
              <Text style={styles.kicker}>DIVISION</Text>
              <Text style={styles.name}>
                {division?.name ?? matches[0]?.division_name ?? 'Division'}
              </Text>

              {nextRoundMatches.length > 0 && (
                <View style={styles.section}>
                  <SectionHead
                    label="NÄSTA OMGÅNG"
                    linkLabel={hasMoreUpcoming ? 'Alla kommande' : undefined}
                    onLink={() => setSheet('upcoming')}
                  />
                  {nextRoundMatches.map((m) => (
                    <MatchRow key={m.bits_match_id} m={m} showDivision={false} onPress={() => openMatch(m.bits_match_id)} onOpenTeam={openTeam} />
                  ))}
                </View>
              )}

              {lastRoundMatches.length > 0 && (
                <View style={styles.section}>
                  <SectionHead
                    label={historical ? 'SENASTE OMGÅNGEN — FÖRRA SÄSONGEN' : 'SENASTE OMGÅNGEN'}
                    linkLabel={hasMorePast ? 'Hela säsongen' : undefined}
                    onLink={() => setSheet('season')}
                  />
                  {lastRoundMatches.map((m) => (
                    <MatchRow key={m.bits_match_id} m={m} showDivision={false} onPress={() => openMatch(m.bits_match_id)} onOpenTeam={openTeam} />
                  ))}
                </View>
              )}

              {matches.length === 0 && upcoming.length === 0 && (
                <Text style={styles.empty}>Ingen säsongsdata för den här divisionen ännu.</Text>
              )}
            </ScrollView>
          )}

          <ScrollBlur />
          <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
            <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
          </View>
          {standings.length > 0 && (
            <View style={[styles.chromeRight, { top: insets.top + 6 }]}>
              <GlassPill icon="podium-outline" label="Tabell" onPress={() => setSheet('table')} />
            </View>
          )}
      </Animated.View>

      <GlassSheet visible={sheet != null} onClose={() => setSheet(null)} title={sheetTitle}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[8] }}>
          {sheet === 'table' && (
            <StandingsTable
              standings={standings}
              onOpenTeam={(tid) => {
                setSheet(null);
                router.push(`/lag/${tid}`);
              }}
              animate
            />
          )}
          {sheet === 'upcoming' && <RoundGroups matches={upcoming} onOpenMatch={openMatch} onOpenTeam={openTeam} />}
          {sheet === 'season' && <RoundGroups matches={past} onOpenMatch={openMatch} onOpenTeam={openTeam} />}
        </ScrollView>
      </GlassSheet>
    </View>
  );
}

function SectionHead({
  label,
  linkLabel,
  onLink,
}: {
  label: string;
  linkLabel?: string;
  onLink: () => void;
}) {
  return (
    <View style={styles.secHead}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {linkLabel && (
        <PressableScale onPress={onLink} hitSlop={8}>
          <Text style={styles.link}>{linkLabel} →</Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  pageClip: { flex: 1, overflow: 'hidden', backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 },
  chromeRight: { position: 'absolute', right: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 2, fontFamily: FONT.bold, marginTop: SPACE[2] },
  name: { color: COLOR.ink, fontSize: TYPE.title + 6, fontFamily: FONT.bold, letterSpacing: -0.5, marginTop: SPACE[1] },
  section: { marginTop: SPACE[8] },
  secHead: {
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
  link: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
