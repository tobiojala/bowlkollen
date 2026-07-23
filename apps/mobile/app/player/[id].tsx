import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ListSkeleton } from '@/components/Skeleton';
import { PressableScale } from '@/components/PressableScale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FollowButton } from '@/components/FollowButton';
import { GlassCircle } from '@/components/GlassButtons';
import { AmbientGlow, IdentityAvatar } from '@/components/IdentityAvatar';
import { PlayerAchievements } from '@/components/PlayerAchievements';
import { PlayerInfoSheet, type PlayerSheetKind } from '@/components/PlayerInfoSheet';
import { PlayerRating } from '@/components/PlayerRating';
import { PlayerSeason } from '@/components/PlayerSeason';
import { ProfileDNA } from '@/components/ProfileDNA';
import { ScrollBlur } from '@/components/ScrollBlur';
import { useFollowCount } from '@/lib/follows';
import { formatMatchDate } from '@/lib/format';
import { computePlayerStats, playerAchievements } from '@/lib/player-stats';
import { supabase } from '@/lib/supabase';
import { teamColor, teamInitials } from '@/lib/team-identity';
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

// Percentile vs the whole field (integer: "better than X%").
function usePlayerPercentile(publicId: string) {
  return useQuery({
    queryKey: ['player-percentile', publicId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_percentile', { p_public_id: publicId });
      if (error) throw error;
      return data;
    },
  });
}

export default function PlayerPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: player, isLoading } = usePlayer(id);
  const { data: history = [] } = usePlayerHistory(id);
  const { data: followers = 0 } = useFollowCount('player', id);
  const { data: percentile } = usePlayerPercentile(id);

  const stats = computePlayerStats(history);
  const { recentAvg, formDiff, matchAvgs, historyDesc } = stats;
  const topPct = typeof percentile === 'number' ? Math.max(1, 100 - percentile) : null;
  const achievements = playerAchievements(stats);

  const [sheet, setSheet] = useState<PlayerSheetKind>(null);
  const bg = useSharedValue(0);
  useEffect(() => {
    bg.value = sheet != null
      ? withSpring(1, { stiffness: 240, damping: 30, mass: 0.9 })
      : withTiming(0, { duration: 220 });
  }, [sheet]);
  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - bg.value * 0.06 }],
    borderRadius: bg.value * 24,
  }));

  return (
    <View style={styles.safe}>
      <Animated.View style={[styles.pageClip, bgStyle]}>
      {isLoading ? (
        <ListSkeleton />
      ) : !player ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Spelaren hittades inte.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}>
          <AmbientGlow color={teamColor(player.name).ring} top={insets.top - 10} />
          <View style={styles.headerRow}>
            <IdentityAvatar colors={teamColor(player.name)} initials={teamInitials(player.name)} size={64} />
            <View style={styles.headerText}>
              <Text style={styles.name} numberOfLines={2}>
                {player.name}
              </Text>
              {!!player.club_name && <Text style={styles.club}>{player.club_name}</Text>}
            </View>
            <FollowButton entityType="player" entityId={id} />
          </View>

          <PlayerRating rating={stats.rating} tier={stats.tier} topPct={topPct} onInfo={() => setSheet('rating')} />

          <View style={styles.stats}>
            <Stat label="SNITT" value={player.licence_average ? String(player.licence_average) : '–'} />
            <Stat label="NIVÅ" value={player.licence_skill_lvl ? String(player.licence_skill_lvl) : '–'} />
            <Stat label="FÖLJARE" value={String(followers)} />
          </View>

          <PlayerAchievements items={achievements} />

          <PlayerSeason firstName={player.name.split(' ')[0]} stats={stats} />

          {matchAvgs.length > 2 && (
            <View style={styles.section}>
              <PressableScale style={styles.sectionHeaderRow} onPress={() => setSheet('dna')} hitSlop={6}>
                <Text style={styles.sectionLabel}>BOWLING-DNA</Text>
                <Text style={styles.infoLink}>Vad är det?</Text>
              </PressableScale>
              <ProfileDNA
                matchAvgs={matchAvgs}
                initials={teamInitials(player.name)}
                ringColor={teamColor(player.name).text}
              />
            </View>
          )}

          {history.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>MATCHER</Text>
                {recentAvg != null && (
                  <Text style={styles.formStat}>
                    Form {recentAvg}
                    {formDiff != null && formDiff !== 0 && (
                      <Text style={{ color: formDiff > 0 ? COLOR.green : COLOR.red }}>
                        {'  '}
                        {formDiff > 0 ? '↑' : '↓'}
                        {Math.abs(formDiff)}
                      </Text>
                    )}
                  </Text>
                )}
              </View>
              {historyDesc.map((h, i) => (
                <View key={i} style={styles.matchRow}>
                  <View style={styles.matchText}>
                    <Text style={styles.opponent} numberOfLines={1}>
                      {h.is_home_team ? '' : '@ '}
                      {h.opponent_name}
                    </Text>
                    <Text style={styles.matchMeta} numberOfLines={1}>
                      {[
                        formatMatchDate(h.match_date),
                        h.division_name,
                        h.series?.length ? h.series.join(' · ') : null,
                      ]
                        .filter(Boolean)
                        .join('  ·  ')}
                    </Text>
                  </View>
                  <Text style={styles.result}>{h.total_result}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
      </Animated.View>

      <PlayerInfoSheet kind={sheet} stats={stats} recentAvg={recentAvg} onClose={() => setSheet(null)} />
    </View>
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
  pageClip: { flex: 1, overflow: 'hidden', backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: COLOR.ink3, fontSize: TYPE.body },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[4] },
  headerText: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.bold, letterSpacing: -0.5 },
  club: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: 2 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE[2],
  },
  infoLink: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  formStat: {
    color: COLOR.ink2,
    fontSize: TYPE.caption,
    fontFamily: FONT.semibold,
    marginBottom: SPACE[2],
  },
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
