import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OnboardingSuggestions from '@/components/OnboardingSuggestions';
import { PressableScale } from '@/components/PressableScale';
import { useToggleFollow } from '@/lib/follows';
import { supabase } from '@/lib/supabase';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const SEARCH_MIN = 2;

type TeamHit = { bits_team_id: number; name: string; club_name: string | null };

function useTeamSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['team-search', q],
    enabled: q.length >= SEARCH_MIN,
    queryFn: async (): Promise<TeamHit[]> => {
      const { data, error } = await supabase
        .from('bits_teams')
        .select('bits_team_id, name, club_name')
        .or(`name.ilike.%${q}%,club_name.ilike.%${q}%`)
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export default function Onboarding() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [picked, setPicked] = useState<{ id: number; name: string } | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 220);
    return () => clearTimeout(t);
  }, [text]);

  const { data: results = [], isFetching } = useTeamSearch(debounced);

  async function finish() {
    setFinishing(true);
    // Completion lives in auth user_metadata; the root navigator redirects home
    // once the session updates. Belt-and-suspenders replace here too.
    await supabase.auth.updateUser({ data: { onboarding_seen: true } });
    router.replace('/');
  }

  const showEmpty =
    !isFetching && debounced.trim().length >= SEARCH_MIN && results.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.kicker}>BOWLKOLLEN</Text>
        <Text style={styles.h1}>Välkommen</Text>
        <Text style={styles.sub}>
          Följ ditt lag för en feed som känns som din egen.
        </Text>

        <Text style={styles.label}>VILKET LAG ÄR DITT?</Text>

        {picked ? (
          <View style={styles.pickedRow}>
            <Text style={styles.pickedName}>✓ {picked.name}</Text>
            <PressableScale onPress={() => setPicked(null)} hitSlop={10}>
              <Text style={styles.change}>Byt</Text>
            </PressableScale>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.search}
              value={text}
              onChangeText={setText}
              placeholder="Sök ditt lag…"
              placeholderTextColor={COLOR.ink4}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isFetching && <Text style={styles.hint}>Söker…</Text>}
            {showEmpty && <Text style={styles.hint}>Inga lag hittades</Text>}
            {results.map((t) => (
              <TeamRow
                key={t.bits_team_id}
                team={t}
                onPick={() => setPicked({ id: t.bits_team_id, name: t.name })}
              />
            ))}
          </>
        )}

        {picked && <OnboardingSuggestions bitsTeamId={picked.id} />}
      </ScrollView>

      <View style={styles.footer}>
        {picked && (
          <PressableScale style={styles.primary} onPress={finish} disabled={finishing} haptic>
            {finishing ? (
              <ActivityIndicator color={COLOR.bg} />
            ) : (
              <Text style={styles.primaryText}>Klar</Text>
            )}
          </PressableScale>
        )}
        <PressableScale onPress={finish} disabled={finishing} hitSlop={8}>
          <Text style={styles.skip}>Hoppa över</Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

function TeamRow({ team, onPick }: { team: TeamHit; onPick: () => void }) {
  const { mutate } = useToggleFollow('team', String(team.bits_team_id));
  return (
    <PressableScale
      style={styles.row}
      onPress={() => {
        mutate();
        onPick();
      }}
    >
      <Text style={styles.rowName}>{team.name}</Text>
      {team.club_name && team.club_name !== team.name && (
        <Text style={styles.rowClub}>{team.club_name}</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  scroll: { paddingHorizontal: SPACE[6], paddingTop: SPACE[8], paddingBottom: SPACE[12] },
  kicker: {
    color: COLOR.gold,
    fontSize: TYPE.label,
    letterSpacing: 3,
    fontFamily: FONT.bold,
  },
  h1: {
    color: COLOR.ink,
    fontSize: TYPE.title + 12,
    fontFamily: FONT.display,
    letterSpacing: -0.5,
    marginTop: SPACE[2],
  },
  sub: { color: COLOR.ink2, fontSize: TYPE.body, marginTop: SPACE[2] },
  label: {
    color: COLOR.ink2,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginTop: SPACE[8],
    marginBottom: SPACE[3],
  },
  search: {
    backgroundColor: COLOR.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[4],
    color: COLOR.ink,
    fontSize: TYPE.body,
  },
  hint: {
    color: COLOR.ink3,
    fontSize: TYPE.caption,
    textAlign: 'center',
    paddingVertical: SPACE[4],
  },
  row: {
    paddingVertical: SPACE[4],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  rowName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  rowClub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 2 },
  pickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOR.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[4],
  },
  pickedName: { color: COLOR.gold, fontSize: TYPE.body, fontFamily: FONT.bold },
  change: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  footer: {
    paddingHorizontal: SPACE[6],
    paddingBottom: SPACE[4],
    paddingTop: SPACE[3],
    gap: SPACE[3],
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
  },
  primary: {
    backgroundColor: COLOR.gold,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[4],
    alignItems: 'center',
  },
  primaryText: { color: COLOR.bg, fontSize: TYPE.body + 1, fontFamily: FONT.bold },
  skip: {
    color: COLOR.ink3,
    fontSize: TYPE.caption,
    fontFamily: FONT.semibold,
    textAlign: 'center',
    paddingVertical: SPACE[2],
  },
});
