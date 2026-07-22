import { Ionicons } from '@expo/vector-icons';
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
import { ListSkeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassSheet } from '@/components/GlassSheet';
import { MatchRow } from '@/components/MatchRow';
import { StandingsTable } from '@/components/StandingsTable';
import { supabase } from '@/lib/supabase';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

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
      if (curMatches.some((m) => m.is_finished)) {
        return { matches: curMatches, historical: false };
      }

      const prev = await supabase
        .from('bits_matches')
        .select(MATCH_COLS)
        .eq('bits_division_id', divisionId)
        .eq('season_id', PREVIOUS_SEASON);
      if (prev.error) throw prev.error;
      const prevMatches = prev.data ?? [];
      if (prevMatches.some((m) => m.is_finished)) {
        return { matches: prevMatches, historical: true };
      }
      return { matches: curMatches, historical: false };
    },
  });
}

export default function DivisionPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const divisionId = Number(id);
  const { data: division, isLoading } = useDivision(divisionId);
  const { data: matchData } = useDivisionMatches(divisionId);
  const matches = matchData?.matches ?? [];
  const historical = matchData?.historical ?? false;

  const standings = computeStandings(matches);

  const recent = matches
    .filter((m) => m.is_finished)
    .sort((a, b) => b.match_date.localeCompare(a.match_date))
    .slice(0, 20);

  const [matchesOpen, setMatchesOpen] = useState(false);
  const bg = useSharedValue(0);
  useEffect(() => {
    bg.value = matchesOpen
      ? withSpring(1, { stiffness: 240, damping: 30, mass: 0.9 })
      : withTiming(0, { duration: 220 });
  }, [matchesOpen]);
  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - bg.value * 0.06 }],
    borderRadius: bg.value * 24,
  }));

  return (
    <View style={styles.safe}>
      <Animated.View style={[styles.pageClip, bgStyle]}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <PressableScale style={styles.back} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={COLOR.ink2} />
          </PressableScale>

          {isLoading ? (
            <ListSkeleton />
          ) : (
            <ScrollView contentContainerStyle={styles.scroll}>
              <Text style={styles.kicker}>DIVISION</Text>
              <Text style={styles.name}>
                {division?.name ?? matches[0]?.division_name ?? 'Division'}
              </Text>

              {recent.length > 0 && (
                <PressableScale style={styles.matchesBtn} onPress={() => setMatchesOpen(true)}>
                  <Ionicons name="calendar-outline" size={18} color={COLOR.ink2} />
                  <Text style={styles.matchesBtnText}>
                    {historical ? 'Resultat — förra säsongen' : 'Senaste resultat'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={COLOR.ink3} />
                </PressableScale>
              )}

              {standings.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    {historical ? 'TABELL — FÖRRA SÄSONGEN' : 'TABELL'}
                  </Text>
                  <StandingsTable
                    standings={standings}
                    onOpenTeam={(tid) => router.push(`/lag/${tid}`)}
                    animate
                  />
                </View>
              )}

              {matches.length === 0 && (
                <Text style={styles.empty}>Ingen säsongsdata för den här divisionen ännu.</Text>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Animated.View>

      <GlassSheet
        visible={matchesOpen}
        onClose={() => setMatchesOpen(false)}
        title={historical ? 'Resultat — förra säsongen' : 'Senaste resultat'}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[8] }}>
          {recent.map((m) => (
            <MatchRow
              key={m.bits_match_id}
              m={m}
              showDivision={false}
              onPress={() => {
                setMatchesOpen(false);
                router.push(`/matcher/${m.bits_match_id}`);
              }}
            />
          ))}
        </ScrollView>
      </GlassSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  pageClip: { flex: 1, overflow: 'hidden', backgroundColor: COLOR.bg },
  back: { paddingHorizontal: SPACE[4], paddingTop: SPACE[2], paddingBottom: SPACE[1] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 2, fontFamily: FONT.bold, marginTop: SPACE[2] },
  name: { color: COLOR.ink, fontSize: TYPE.title + 6, fontFamily: FONT.bold, letterSpacing: -0.5, marginTop: SPACE[1] },
  matchesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    marginTop: SPACE[6],
    paddingVertical: SPACE[3],
    paddingHorizontal: SPACE[4],
    borderRadius: 14,
    backgroundColor: COLOR.surface,
  },
  matchesBtnText: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  section: { marginTop: SPACE[8] },
  sectionLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginBottom: SPACE[2],
  },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
