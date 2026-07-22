import { Ionicons } from '@expo/vector-icons';
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

import { FollowButton } from '@/components/FollowButton';
import { useFollowCount } from '@/lib/follows';
import { formatMatchDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

function usePlayer(publicId: string) {
  return useQuery({
    queryKey: ['player', publicId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_identity', { p_public_id: publicId });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

function usePlayerHistory(publicId: string) {
  return useQuery({
    queryKey: ['player-history', publicId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_match_history', { p_public_id: publicId });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function PlayerPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: player, isLoading } = usePlayer(id);
  const { data: history = [] } = usePlayerHistory(id);
  const { data: followers = 0 } = useFollowCount('player', id);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PressableScale style={styles.back} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={COLOR.ink2} />
      </PressableScale>

      {isLoading ? (
        <ListSkeleton />
      ) : !player ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Spelaren hittades inte.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.name}>{player.name}</Text>
              {!!player.club_name && <Text style={styles.club}>{player.club_name}</Text>}
            </View>
            <FollowButton entityType="player" entityId={id} />
          </View>

          <View style={styles.stats}>
            <Stat label="SNITT" value={player.licence_average ? String(player.licence_average) : '–'} />
            <Stat label="NIVÅ" value={player.licence_skill_lvl ? String(player.licence_skill_lvl) : '–'} />
            <Stat label="FÖLJARE" value={String(followers)} />
          </View>

          {history.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MATCHER</Text>
              {history.map((h, i) => (
                <View key={i} style={styles.matchRow}>
                  <View style={styles.matchText}>
                    <Text style={styles.opponent} numberOfLines={1}>
                      {h.is_home_team ? '' : '@ '}
                      {h.opponent_name}
                    </Text>
                    <Text style={styles.matchMeta} numberOfLines={1}>
                      {[formatMatchDate(h.match_date), h.division_name].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Text style={styles.result}>{h.total_result}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  back: { paddingHorizontal: SPACE[4], paddingTop: SPACE[2], paddingBottom: SPACE[1] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: COLOR.ink3, fontSize: TYPE.body },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[2] },
  headerText: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.bold, letterSpacing: -0.5 },
  club: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: 2 },
  stats: {
    flexDirection: 'row',
    gap: SPACE[3],
    marginTop: SPACE[6],
  },
  stat: {
    flex: 1,
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[4],
    alignItems: 'center',
  },
  statValue: { color: COLOR.ink, fontSize: TYPE.title + 4, fontFamily: FONT.display },
  statLabel: { color: COLOR.ink3, fontSize: TYPE.micro, fontFamily: FONT.bold, letterSpacing: 1, marginTop: 2 },
  section: { marginTop: SPACE[8] },
  sectionLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginBottom: SPACE[2],
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE[3],
    paddingVertical: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  matchText: { flex: 1, minWidth: 0 },
  opponent: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  matchMeta: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  result: { color: COLOR.ink, fontSize: TYPE.body + 2, fontFamily: FONT.bold },
});
