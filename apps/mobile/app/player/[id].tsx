import { Ionicons } from '@expo/vector-icons';
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
import { ClaimedBadge } from '@/components/ClaimedBadge';
import { HeaderBand } from '@/components/HeaderBand';
import { HeaderColorSheet } from '@/components/HeaderColorSheet';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { useIsClaimed } from '@/lib/claimed';
import { usePlayerHeader, useSetMyPlayerHeader } from '@/lib/appearance';
import { useMyClaim } from '@/lib/me';
import { PlayerAchievements } from '@/components/PlayerAchievements';
import { PlayerInfoSheet, type PlayerSheetKind } from '@/components/PlayerInfoSheet';
import { MomentShareSheet } from '@/components/MomentShareSheet';
import { PlayerDelmatchCard } from '@/components/PlayerDelmatchCard';
import { PlayerRating } from '@/components/PlayerRating';
import { PlayerSeason } from '@/components/PlayerSeason';
import { ProfileDNA } from '@/components/ProfileDNA';
import { ScrollBlur } from '@/components/ScrollBlur';
import { useFollowCount } from '@/lib/follows';
import { formatMatchDate } from '@/lib/format';
import { usePlayerDelmatchRecord } from '@/lib/player-delmatch';
import type { Moment } from '@/lib/share';
import { computePlayerStats, playerAchievements } from '@/lib/player-stats';
import { usePlayer, usePlayerHistory, usePlayerPercentile } from '@/lib/player-queries';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export default function PlayerPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: player, isLoading } = usePlayer(id);
  const { data: history = [] } = usePlayerHistory(id);
  const { data: followers = 0 } = useFollowCount('player', id);
  const { data: percentile } = usePlayerPercentile(id);
  const { data: delmatchRecord } = usePlayerDelmatchRecord(id);
  const claimed = useIsClaimed(id);
  const { data: headerColor } = usePlayerHeader(id);
  const { data: myClaim } = useMyClaim();
  const isOwn = myClaim?.status === 'verified' && myClaim.publicId === id;
  const setHeader = useSetMyPlayerHeader(id);
  const [headerOpen, setHeaderOpen] = useState(false);

  const stats = computePlayerStats(history);
  const { recentAvg, formDiff, matchAvgs, historyDesc } = stats;
  const topPct = typeof percentile === 'number' ? Math.max(1, 100 - percentile) : null;
  const achievements = playerAchievements(stats);

  const [sheet, setSheet] = useState<PlayerSheetKind>(null);
  const [shareMoment, setShareMoment] = useState<Moment | null>(null);
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
          <HeaderBand color={headerColor ?? teamColor(player.name).ring} />
          <View style={styles.headerRow}>
            <IdentityAvatar colors={teamColor(player.name)} initials={teamInitials(player.name)} size={64} />
            <View style={styles.headerText}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={2}>{player.name}</Text>
                {claimed && <ClaimedBadge size={20} />}
              </View>
              {!!player.club_name && <Text style={styles.club}>{player.club_name}</Text>}
            </View>
            {isOwn ? (
              <PressableScale style={styles.editHeader} onPress={() => setHeaderOpen(true)} hitSlop={8}>
                <Ionicons name="color-palette-outline" size={22} color={COLOR.ink} />
              </PressableScale>
            ) : (
              <View style={styles.headerActions}>
                {myClaim?.status === 'verified' && myClaim.publicId && myClaim.publicId !== id && (
                  <PressableScale
                    style={styles.compareBtn}
                    onPress={() => router.push(`/compare/${id}/${myClaim.publicId}`)}
                    hitSlop={8}
                    accessibilityLabel="Jämför med dig"
                  >
                    <Ionicons name="git-compare-outline" size={22} color={COLOR.ink} />
                  </PressableScale>
                )}
                <FollowButton entityType="player" entityId={id} />
              </View>
            )}
          </View>

          <PlayerRating rating={stats.rating} tier={stats.tier} topPct={topPct} onInfo={() => setSheet('rating')} />

          <View style={styles.stats}>
            <Stat label="SNITT" value={player.licence_average ? String(player.licence_average) : '–'} />
            <Stat label="NIVÅ" value={player.licence_skill_lvl ? String(player.licence_skill_lvl) : '–'} />
            <Stat label="FÖLJARE" value={String(followers)} />
          </View>

          <PlayerAchievements items={achievements} />

          <PlayerSeason firstName={player.name.split(' ')[0]} stats={stats} />

          {delmatchRecord && (
            <PlayerDelmatchCard
              record={delmatchRecord}
              firstName={player.name.split(' ')[0]}
              onOpenPlayer={(pid) => pid !== id && router.push(`/player/${pid}`)}
              onShare={() => setShareMoment({
                kind: 'record',
                name: player.name,
                wins: delmatchRecord.record.wins,
                losses: delmatchRecord.record.losses,
                winRate: delmatchRecord.record.winRate,
                played: delmatchRecord.record.played,
                highlight: delmatchRecord.milestones.perfectGames > 0
                  ? `${delmatchRecord.milestones.perfectGames}× 300 i en delmatch`
                  : delmatchRecord.milestones.bestGame > 0
                    ? `Högsta spel ${delmatchRecord.milestones.bestGame}`
                    : undefined,
              })}
            />
          )}

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
      <MomentShareSheet moment={shareMoment} onClose={() => setShareMoment(null)} />
      <HeaderColorSheet visible={headerOpen} onClose={() => setHeaderOpen(false)} onPick={(c) => setHeader.mutate(c)} />
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  editHeader: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.surface },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  compareBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.surface },
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
