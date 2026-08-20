import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { supabase } from '@/lib/supabase';
import { useTeam } from '@/lib/team-data';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

type Hit = { bits_team_id: number; name: string; club_name: string | null };

function useTeamSearch(query: string) {
  const q = query.trim();
  return useQuery<Hit[]>({
    queryKey: ['team-compare-search', q],
    enabled: q.length >= 2,
    queryFn: async () => {
      const { data } = await supabase.from('bits_teams')
        .select('bits_team_id, name, club_name')
        .or(`name.ilike.%${q}%,club_name.ilike.%${q}%`)
        .limit(20);
      return (data as Hit[]) ?? [];
    },
  });
}

export default function TeamComparePicker() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { a } = useLocalSearchParams<{ a: string }>();
  const idA = Number(a);
  const { data: teamA } = useTeam(idA);

  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { const t = setTimeout(() => setQ(text), 220); return () => clearTimeout(t); }, [text]);
  const { data: results = [], isFetching } = useTeamSearch(q);

  return (
    <View style={styles.safe}>
      <FlatList
        data={results.filter((r) => r.bits_team_id !== idA)}
        keyExtractor={(r) => String(r.bits_team_id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}
        ListHeaderComponent={
          <View>
            <Text style={styles.kicker}>JÄMFÖR LAG</Text>
            <Text style={styles.h1} numberOfLines={2}>{teamA?.name ?? 'Laget'} mot…</Text>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={COLOR.ink3} />
              <TextInput value={text} onChangeText={setText} placeholder="Sök lag att jämföra med…"
                placeholderTextColor={COLOR.ink4} style={styles.searchInput} autoCorrect={false} autoFocus />
            </View>
            {isFetching && <Text style={styles.hint}>Söker…</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <PressableScale style={styles.row} onPress={() => router.push(`/compare/teams/${idA}/${item.bits_team_id}` as never)}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
              {!!item.club_name && item.club_name !== item.name && <Text style={styles.rowClub} numberOfLines={1}>{item.club_name}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLOR.ink3} />
          </PressableScale>
        )}
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  scroll: { paddingHorizontal: SPACE[4], paddingBottom: 120, gap: SPACE[2] },
  chromeLeft: { position: 'absolute', left: 16 },
  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  h1: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, letterSpacing: -0.4, marginTop: 2, marginBottom: SPACE[4] },
  search: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], marginBottom: SPACE[2] },
  searchInput: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.regular, padding: 0 },
  hint: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', paddingVertical: SPACE[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: COLOR.hairline, padding: SPACE[3] },
  rowName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  rowClub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 2 },
});
