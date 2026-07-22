import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const SEARCH_MIN = 2;

function useSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['discover', q],
    enabled: q.length >= SEARCH_MIN,
    queryFn: async () => {
      const [players, teams] = await Promise.all([
        supabase
          .from('bits_players')
          .select('public_id, first_name, sur_name, club_name')
          .or(`first_name.ilike.%${q}%,sur_name.ilike.%${q}%`)
          .limit(15),
        supabase
          .from('bits_teams')
          .select('bits_team_id, name, club_name')
          .or(`name.ilike.%${q}%,club_name.ilike.%${q}%`)
          .limit(15),
      ]);
      return { players: players.data ?? [], teams: teams.data ?? [] };
    },
  });
}

export default function Discover() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 220);
    return () => clearTimeout(t);
  }, [text]);

  const { data, isFetching } = useSearch(debounced);
  const hasQuery = debounced.trim().length >= SEARCH_MIN;
  const empty = hasQuery && !isFetching && data && data.players.length === 0 && data.teams.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Hitta</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={text}
          onChangeText={setText}
          placeholder="Sök spelare eller lag…"
          placeholderTextColor={COLOR.ink4}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {!hasQuery && <Text style={styles.hint}>Sök efter en spelare eller ett lag.</Text>}
        {isFetching && <Text style={styles.hint}>Söker…</Text>}
        {empty && <Text style={styles.hint}>Inga träffar.</Text>}

        {data && data.players.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>SPELARE</Text>
            {data.players.map((p) => (
              <PressableScale
                key={p.public_id}
                style={styles.row}
                onPress={() => router.push(`/player/${p.public_id}`)}
              >
                <Text style={styles.rowName} numberOfLines={1}>
                  {`${p.first_name ?? ''} ${p.sur_name ?? ''}`.trim()}
                </Text>
                {!!p.club_name && <Text style={styles.rowSub}>{p.club_name}</Text>}
              </PressableScale>
            ))}
          </>
        )}

        {data && data.teams.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>LAG</Text>
            {data.teams.map((t) => (
              <PressableScale
                key={t.bits_team_id}
                style={styles.row}
                onPress={() => router.push(`/lag/${t.bits_team_id}`)}
              >
                <Text style={styles.rowName} numberOfLines={1}>
                  {t.name}
                </Text>
                {!!t.club_name && t.club_name !== t.name && (
                  <Text style={styles.rowSub}>{t.club_name}</Text>
                )}
              </PressableScale>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  header: { paddingHorizontal: SPACE[6], paddingTop: SPACE[6], paddingBottom: SPACE[3] },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 3, fontFamily: FONT.bold },
  title: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.bold, letterSpacing: -0.5 },
  searchWrap: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[2] },
  search: {
    backgroundColor: COLOR.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[4],
    color: COLOR.ink,
    fontSize: TYPE.body,
  },
  list: { paddingHorizontal: SPACE[6], paddingBottom: 120 },
  hint: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', paddingVertical: SPACE[6] },
  sectionLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginTop: SPACE[6],
    marginBottom: SPACE[2],
  },
  row: {
    paddingVertical: SPACE[4],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  rowName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  rowSub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
});
