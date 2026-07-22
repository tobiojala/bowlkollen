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

import { MatchRow } from '@/components/MatchRow';
import { supabase } from '@/lib/supabase';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

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
          'bits_match_id, home_team_name, away_team_name, home_result, away_result, division_name, is_finished, match_date, hall_name, home_bits_team_id, away_bits_team_id, round_id',
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

  const standings = computeStandings(matches);

  const recent = matches
    .filter((m) => m.is_finished)
    .sort((a, b) => b.match_date.localeCompare(a.match_date))
    .slice(0, 15);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PressableScale style={styles.back} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={COLOR.ink2} />
      </PressableScale>

      {isLoading ? (
        <ListSkeleton />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.kicker}>DIVISION</Text>
          <Text style={styles.name}>{division?.name ?? matches[0]?.division_name ?? 'Division'}</Text>

          {standings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TABELL</Text>
              <View style={styles.stHead}>
                <Text style={[styles.stH, styles.stPos]}>#</Text>
                <Text style={[styles.stH, styles.stTeamCol]}>LAG</Text>
                <Text style={[styles.stH, styles.stNum]}>M</Text>
                <Text style={[styles.stH, styles.stRecord]}>V-O-F</Text>
                <Text style={[styles.stH, styles.stPtsCol]}>P</Text>
              </View>
              {standings.map((s, i) => {
                const leader = i === 0;
                return (
                  <PressableScale
                    key={s.teamId}
                    style={styles.stRow}
                    onPress={() => router.push(`/lag/${s.teamId}`)}
                  >
                    <Text style={[styles.stPos, styles.stNumTxt, leader && styles.stGold]}>
                      {i + 1}
                    </Text>
                    <Text
                      style={[styles.stTeamCol, styles.stTeamTxt, leader && styles.stTeamLeader]}
                      numberOfLines={1}
                    >
                      {s.teamName}
                    </Text>
                    <Text style={[styles.stNum, styles.stNumTxt]}>{s.played}</Text>
                    <Text style={[styles.stRecord, styles.stNumTxt]}>
                      {s.won}-{s.drawn}-{s.lost}
                    </Text>
                    <Text style={[styles.stPtsCol, styles.stPts, leader && styles.stGold]}>
                      {s.points}
                    </Text>
                  </PressableScale>
                );
              })}
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
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 2, fontFamily: FONT.bold, marginTop: SPACE[2] },
  name: { color: COLOR.ink, fontSize: TYPE.title + 6, fontFamily: FONT.bold, letterSpacing: -0.5, marginTop: SPACE[1] },
  section: { marginTop: SPACE[8] },
  sectionLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginBottom: SPACE[2],
  },
  stHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACE[2],
  },
  stH: { fontSize: 11, fontFamily: FONT.bold, letterSpacing: 0.5, color: COLOR.ink3 },
  stRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE[3],
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
  },
  stPos: { width: 24, textAlign: 'left' },
  stTeamCol: { flex: 1, paddingRight: SPACE[2] },
  stNum: { width: 26, textAlign: 'right' },
  stRecord: { width: 58, textAlign: 'right' },
  stPtsCol: { width: 34, textAlign: 'right' },
  stNumTxt: { fontFamily: FONT.display, fontSize: 14, color: COLOR.ink2, fontVariant: ['tabular-nums'] },
  stTeamTxt: { fontFamily: FONT.semibold, fontSize: TYPE.body, color: COLOR.ink },
  stTeamLeader: { fontFamily: FONT.bold },
  stPts: { fontFamily: FONT.display, fontSize: 16, color: COLOR.ink, fontVariant: ['tabular-nums'] },
  stGold: { color: COLOR.gold },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
