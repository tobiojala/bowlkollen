import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToggleFollow, type FollowEntityType } from '@/lib/follows';
import { supabase } from '@/lib/supabase';
import { COLOR, SPACE, TYPE } from '@/theme';

type FollowItem = { type: FollowEntityType; id: string; name: string; sub: string | null };

function useMyFollows() {
  return useQuery({
    queryKey: ['follows', 'detail'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return { teams: [] as FollowItem[], players: [] as FollowItem[] };

      const { data: rows } = await supabase
        .from('follows')
        .select('entity_type, entity_id')
        .eq('user_id', session.user.id);

      const teamIds = (rows ?? []).filter((r) => r.entity_type === 'team').map((r) => Number(r.entity_id));
      const playerIds = (rows ?? []).filter((r) => r.entity_type === 'player').map((r) => r.entity_id);

      const [teamsRes, playersRes] = await Promise.all([
        teamIds.length
          ? supabase.from('bits_teams').select('bits_team_id, name, club_name').in('bits_team_id', teamIds)
          : Promise.resolve({ data: [] }),
        playerIds.length
          ? supabase.from('bits_players').select('public_id, first_name, sur_name').in('public_id', playerIds)
          : Promise.resolve({ data: [] }),
      ]);

      const teams: FollowItem[] = (teamsRes.data ?? []).map((t) => ({
        type: 'team',
        id: String(t.bits_team_id),
        name: t.name,
        sub: t.club_name && t.club_name !== t.name ? t.club_name : null,
      }));
      const players: FollowItem[] = (playersRes.data ?? []).map((p) => ({
        type: 'player',
        id: p.public_id,
        name: `${p.first_name ?? ''} ${p.sur_name ?? ''}`.trim(),
        sub: null,
      }));
      return { teams, players };
    },
  });
}

export default function Following() {
  const router = useRouter();
  const { data, isLoading } = useMyFollows();

  const sections = [
    { title: 'LAG', data: data?.teams ?? [] },
    { title: 'SPELARE', data: data?.players ?? [] },
  ].filter((s) => s.data.length > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={COLOR.ink2} />
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.title}>Följer</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLOR.gold} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Du följer inget än.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          )}
          renderItem={({ item }) => <FollowRow item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function FollowRow({ item }: { item: FollowItem }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { mutate, isPending } = useToggleFollow(item.type, item.id);
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.rowText}
        onPress={() =>
          router.push(item.type === 'team' ? `/lag/${item.id}` : `/player/${item.id}`)
        }
      >
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.sub && <Text style={styles.rowSub}>{item.sub}</Text>}
      </Pressable>
      <Pressable
        disabled={isPending}
        onPress={() => mutate(undefined, { onSuccess: () => qc.invalidateQueries({ queryKey: ['follows', 'detail'] }) })}
        hitSlop={6}
      >
        <Text style={styles.unfollow}>Följer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  back: { paddingHorizontal: SPACE[4], paddingTop: SPACE[2], paddingBottom: SPACE[1] },
  header: { paddingHorizontal: SPACE[6], paddingTop: SPACE[2], paddingBottom: SPACE[4] },
  title: { color: COLOR.ink, fontSize: TYPE.title + 8, fontWeight: '800', letterSpacing: -0.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: COLOR.ink3, fontSize: TYPE.body },
  list: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  sectionLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: SPACE[6],
    marginBottom: SPACE[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE[3],
    paddingVertical: SPACE[4],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowName: { color: COLOR.ink, fontSize: TYPE.body, fontWeight: '600' },
  rowSub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  unfollow: { color: COLOR.ink3, fontSize: TYPE.caption, fontWeight: '700' },
});
