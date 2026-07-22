import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { ListSkeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavScroll } from '@/lib/nav-scroll';
import { supabase } from '@/lib/supabase';
import { groupByTier, type Tier } from '@/lib/tiers';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const SEASON_ID = 2026; // 2026/27 season, per the data-source convention

type Division = { bits_division_id: number; name: string; season_id: number };

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

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onScroll } = useNavScroll();
  const { data = [], isLoading, error } = useDivisions();

  const sections = useMemo(
    () => groupByTier(data).map((g) => ({ title: g.tier as Tier, data: g.items })),
    [data],
  );

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Divisioner</Text>
      <Text style={styles.sub}>
        {data.length > 0 ? `${data.length} divisioner · säsong ${SEASON_ID}/27` : 'Live från BITS'}
      </Text>
    </View>
  );

  return (
    <View style={styles.safe}>
      {isLoading && (
        <View style={{ paddingTop: insets.top, paddingHorizontal: SPACE[6] }}>
          {header}
          <ListSkeleton />
        </View>
      )}

      {error && (
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <Text style={styles.error}>Kunde inte hämta data.</Text>
        </View>
      )}

      {!isLoading && !error && (
        <SectionList
          sections={sections}
          keyExtractor={(d) => String(d.bits_division_id)}
          contentContainerStyle={[styles.list, { paddingTop: insets.top + SPACE[2] }]}
          ListHeaderComponent={header}
          onScroll={onScroll}
          scrollEventThrottle={16}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text
              style={[
                styles.tierText,
                section.title === 'Elitserien' && styles.tierTop,
              ]}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <PressableScale
              style={styles.row}
              onPress={() => router.push(`/division/${item.bits_division_id}`)}
            >
              <Text style={styles.rowName} numberOfLines={1}>
                {item.name}
              </Text>
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
  header: { paddingTop: SPACE[3], paddingBottom: SPACE[4], gap: SPACE[1] },
  title: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.bold, letterSpacing: -0.5 },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE[2] },
  error: { color: COLOR.red, fontSize: TYPE.body, fontFamily: FONT.semibold },
  list: { paddingHorizontal: SPACE[6], paddingBottom: 120 },
  tierText: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginTop: SPACE[8],
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
  rowName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  chevron: { color: COLOR.ink4, fontSize: TYPE.title, fontFamily: FONT.regular },
});
