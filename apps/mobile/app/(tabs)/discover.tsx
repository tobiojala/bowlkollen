import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FollowButton } from '@/components/FollowButton';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { useNavScroll } from '@/lib/nav-scroll';
import { supabase } from '@/lib/supabase';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { useTopScores } from '@/lib/top-scores';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const SEARCH_MIN = 2;
const TRENDING_MAX = 8;

type Player = { public_id: string; first_name: string | null; sur_name: string | null; club_name: string | null };
type Team = { bits_team_id: number; name: string; club_name: string | null };

// Unified search across players and teams.
function useSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['discover', q],
    enabled: q.length >= SEARCH_MIN,
    queryFn: async () => {
      const [playersRes, teamsRes] = await Promise.all([
        supabase
          .from('bits_players')
          .select('public_id, first_name, sur_name, club_name')
          .or(`first_name.ilike.%${q}%,sur_name.ilike.%${q}%`)
          .limit(20),
        supabase.from('bits_teams').select('bits_team_id, name, club_name').ilike('name', `%${q}%`).limit(12),
      ]);
      return { players: (playersRes.data ?? []) as Player[], teams: (teamsRes.data ?? []) as Team[] };
    },
  });
}

export default function Discover() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onScroll } = useNavScroll();
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 220);
    return () => clearTimeout(t);
  }, [text]);

  const { data, isFetching } = useSearch(debounced);
  const { data: topScores = [] } = useTopScores();
  const hasQuery = debounced.trim().length >= SEARCH_MIN;

  // Trending = the highlight reel, deduped to followable players.
  const trending = useMemo(
    () => topScores.filter((s) => s.publicId).slice(0, TRENDING_MAX),
    [topScores],
  );

  const nothing = hasQuery && !isFetching && data && data.players.length === 0 && data.teams.length === 0;

  return (
    <View style={styles.safe}>
      <View style={[styles.header, { paddingTop: insets.top + SPACE[2] }]}>
        <Text style={styles.title}>Hitta</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={COLOR.ink3} />
        <TextInput
          style={styles.search}
          value={text}
          onChangeText={setText}
          placeholder="Sök spelare eller lag…"
          placeholderTextColor={COLOR.ink4}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {text.length > 0 && (
          <PressableScale onPress={() => setText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={COLOR.ink3} />
          </PressableScale>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {!hasQuery ? (
          <>
            {trending.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>I HETLUFTEN</Text>
                {trending.map((s) => (
                  <Row
                    key={s.publicId}
                    name={s.playerName}
                    sub={`${s.total} · ${s.division}`}
                    onPress={() => router.push(`/player/${s.publicId}`)}
                    right={<FollowButton entityType="player" entityId={s.publicId!} />}
                  />
                ))}
              </>
            )}

            <PressableScale style={styles.explore} onPress={() => router.push('/schema')}>
              <Ionicons name="grid-outline" size={22} color={COLOR.gold} />
              <View style={styles.exploreText}>
                <Text style={styles.exploreTitle}>Utforska divisioner</Text>
                <Text style={styles.exploreBody}>Bläddra alla serier och hitta lag att följa.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLOR.ink3} />
            </PressableScale>
          </>
        ) : (
          <>
            {isFetching && <Text style={styles.hint}>Söker…</Text>}
            {nothing && <Text style={styles.hint}>Inga träffar.</Text>}

            {!!data?.players.length && (
              <>
                <Text style={styles.sectionLabel}>SPELARE</Text>
                {data.players.map((p) => {
                  const name = `${p.first_name ?? ''} ${p.sur_name ?? ''}`.trim();
                  return (
                    <Row
                      key={p.public_id}
                      name={name}
                      sub={p.club_name}
                      onPress={() => router.push(`/player/${p.public_id}`)}
                      right={<FollowButton entityType="player" entityId={p.public_id} />}
                    />
                  );
                })}
              </>
            )}

            {!!data?.teams.length && (
              <>
                <Text style={styles.sectionLabel}>LAG</Text>
                {data.teams.map((t) => (
                  <Row
                    key={t.bits_team_id}
                    name={t.name}
                    sub={t.club_name && t.club_name !== t.name ? t.club_name : null}
                    onPress={() => router.push(`/lag/${t.bits_team_id}`)}
                    right={<FollowButton entityType="team" entityId={String(t.bits_team_id)} />}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Row({
  name,
  sub,
  onPress,
  right,
}: {
  name: string;
  sub?: string | null;
  onPress: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <PressableScale style={styles.rowMain} onPress={onPress}>
        <IdentityAvatar colors={teamColor(name)} initials={teamInitials(name)} size={44} />
        <View style={styles.rowText}>
          <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
          {!!sub && <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>}
        </View>
      </PressableScale>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  header: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[3] },
  title: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.bold, letterSpacing: -0.5 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    marginHorizontal: SPACE[6],
    paddingHorizontal: SPACE[4],
    backgroundColor: COLOR.surface2,
    borderRadius: RADIUS.md,
  },
  search: { flex: 1, paddingVertical: SPACE[4], color: COLOR.ink, fontSize: TYPE.body },
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
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACE[3], minWidth: 0 },
  rowText: { flex: 1, minWidth: 0 },
  rowName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  rowSub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },

  explore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    marginTop: SPACE[8],
    padding: SPACE[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLOR.surface,
  },
  exploreText: { flex: 1, minWidth: 0, gap: 2 },
  exploreTitle: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  exploreBody: { color: COLOR.ink3, fontSize: TYPE.caption, lineHeight: 18 },
});
