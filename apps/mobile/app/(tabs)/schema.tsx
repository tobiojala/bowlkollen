import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { ListSkeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavScroll } from '@/lib/nav-scroll';
import { supabase } from '@/lib/supabase';
import { groupByTier, type Tier } from '@/lib/tiers';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const SEASON_ID = 2026; // 2026/27 season, per the data-source convention
const SEARCH_MIN = 2;

type Division = { bits_division_id: number; name: string; season_id: number };
type TeamHit = { bits_team_id: number; name: string; club_name: string | null };

function useDivisions() {
  return useQuery({
    queryKey: ['divisions', SEASON_ID],
    queryFn: async (): Promise<Division[]> => {
      const { data, error } = await supabase
        .from('bits_divisions')
        .select('bits_division_id, name, season_id')
        .eq('season_id', SEASON_ID)
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useTeamSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['schema-teams', q],
    enabled: q.length >= SEARCH_MIN,
    queryFn: async (): Promise<TeamHit[]> => {
      const { data } = await supabase
        .from('bits_teams')
        .select('bits_team_id, name, club_name')
        .ilike('name', `%${q}%`)
        .limit(25);
      return data ?? [];
    },
  });
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onScroll } = useNavScroll();
  const { data = [], isLoading } = useDivisions();

  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 220);
    return () => clearTimeout(t);
  }, [text]);

  const q = debounced.trim().toLowerCase();
  const searching = q.length >= 1;
  const divisionHits = useMemo(
    () => (searching ? data.filter((d) => d.name.toLowerCase().includes(q)) : []),
    [data, q, searching],
  );
  const { data: teamHits = [], isFetching } = useTeamSearch(debounced);
  const sections = useMemo(
    () => groupByTier(data).map((g) => ({ title: g.tier as Tier, data: g.items })),
    [data],
  );

  const noHits =
    searching && divisionHits.length === 0 && teamHits.length === 0 && !isFetching && q.length >= SEARCH_MIN;

  return (
    <View style={styles.safe}>
      <View style={[styles.top, { paddingTop: insets.top + SPACE[2] }]}>
        <Text style={styles.title}>Schema</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={COLOR.ink3} />
          <TextInput
            style={styles.search}
            value={text}
            onChangeText={setText}
            placeholder="Sök lag eller division…"
            placeholderTextColor={COLOR.ink4}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {text.length > 0 && (
            <PressableScale onPress={() => setText('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={COLOR.ink3} />
            </PressableScale>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.body}>
          <ListSkeleton />
        </View>
      ) : searching ? (
        <ScrollView
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {divisionHits.length > 0 && (
            <>
              <Text style={styles.tierText}>DIVISIONER</Text>
              {divisionHits.map((d) => (
                <PressableScale key={d.bits_division_id} style={styles.row} onPress={() => router.push(`/division/${d.bits_division_id}`)}>
                  <Text style={styles.rowName} numberOfLines={1}>{d.name}</Text>
                  <Text style={styles.chevron}>›</Text>
                </PressableScale>
              ))}
            </>
          )}
          {teamHits.length > 0 && (
            <>
              <Text style={styles.tierText}>LAG</Text>
              {teamHits.map((t) => (
                <PressableScale key={t.bits_team_id} style={styles.row} onPress={() => router.push(`/lag/${t.bits_team_id}`)}>
                  <View style={styles.teamText}>
                    <Text style={styles.rowName} numberOfLines={1}>{t.name}</Text>
                    {!!t.club_name && t.club_name !== t.name && (
                      <Text style={styles.rowSub} numberOfLines={1}>{t.club_name}</Text>
                    )}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </PressableScale>
              ))}
            </>
          )}
          {noHits && <Text style={styles.hint}>Inga träffar.</Text>}
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(d) => String(d.bits_division_id)}
          contentContainerStyle={styles.list}
          onScroll={onScroll}
          scrollEventThrottle={16}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.tierText, section.title === 'Elitserien' && styles.tierTop]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <PressableScale style={styles.row} onPress={() => router.push(`/division/${item.bits_division_id}`)}>
              <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.chevron}>›</Text>
            </PressableScale>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  top: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[3], gap: SPACE[3] },
  title: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.bold, letterSpacing: -0.5 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    backgroundColor: COLOR.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLOR.hairline,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
  },
  search: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.regular, padding: 0 },
  body: { paddingHorizontal: SPACE[6] },
  list: { paddingHorizontal: SPACE[6], paddingBottom: 120 },
  tierText: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginTop: SPACE[6],
    marginBottom: SPACE[1],
  },
  tierTop: { color: COLOR.gold },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    paddingVertical: SPACE[4],
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
  },
  teamText: { flex: 1, minWidth: 0 },
  rowName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  rowSub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  chevron: { color: COLOR.ink4, fontSize: TYPE.title, fontFamily: FONT.regular },
  hint: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', paddingVertical: SPACE[8] },
});
