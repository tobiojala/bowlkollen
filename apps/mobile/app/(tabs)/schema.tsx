import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ListSkeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const SEASON_ID = 2026; // 2026/27 season, per the data-source convention

function useDivisions() {
  return useQuery({
    queryKey: ['divisions', SEASON_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bits_divisions')
        .select('bits_division_id, name, season_id')
        .eq('season_id', SEASON_ID)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export default function Home() {
  const router = useRouter();
  const { data, isLoading, error } = useDivisions();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Divisioner</Text>
        <Text style={styles.sub}>
          {data ? `${data.length} divisioner · säsong ${SEASON_ID}/27` : 'Live från BITS'}
        </Text>
      </View>

      {isLoading && (
        <ListSkeleton />
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.error}>Kunde inte hämta data.</Text>
          <Text style={styles.errorDetail}>{String(error)}</Text>
        </View>
      )}

      {data && (
        <FlatList
          data={data}
          keyExtractor={(d) => String(d.bits_division_id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <PressableScale
              style={styles.row}
              onPress={() => router.push(`/division/${item.bits_division_id}`)}
            >
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMeta}>›</Text>
            </PressableScale>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  header: {
    paddingHorizontal: SPACE[6],
    paddingTop: SPACE[6],
    paddingBottom: SPACE[4],
    gap: SPACE[1],
  },
  kicker: {
    color: COLOR.gold,
    fontSize: TYPE.label,
    letterSpacing: 3,
    fontFamily: FONT.bold,
  },
  title: {
    color: COLOR.ink,
    fontSize: TYPE.title + 8,
    fontFamily: FONT.bold,
    letterSpacing: -0.5,
  },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE[2] },
  error: { color: COLOR.red, fontSize: TYPE.body, fontFamily: FONT.semibold },
  errorDetail: {
    color: COLOR.ink3,
    fontSize: TYPE.caption,
    paddingHorizontal: SPACE[8],
    textAlign: 'center',
  },
  list: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE[4],
  },
  rowName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold, flex: 1 },
  rowMeta: { color: COLOR.ink4, fontSize: TYPE.title },
  sep: { height: 1, backgroundColor: COLOR.hairline },
});
