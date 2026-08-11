import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
import { POST_AVATAR, PostHeader } from '@/components/feed/PostHeader';
import { PostActions } from '@/components/feed/PostActions';
import { PostMeta } from '@/components/feed/PostMeta';
import { SerieBars } from '@/components/feed/SerieBars';
import { FollowButton } from '@/components/FollowButton';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { formatMatchDate } from '@/lib/format';
import { teamColor, teamInitials } from '@/lib/team-identity';
import type { TopScore } from '@/lib/top-scores';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const ELITE = 900;

// Top-series post: player avatar + name header, the total as the hero, an
// adaptive game graph, and a quiet timestamp. memo'd for the virtualized list.
export const TopSerieCard = memo(function TopSerieCard({
  score,
  onPress,
  liked,
  saved,
  likeCount,
  onLike,
  onSave,
}: {
  score: TopScore;
  onPress?: () => void;
  liked: boolean;
  saved: boolean;
  likeCount: number;
  onLike: (key: string, liked: boolean) => void;
  onSave: (key: string, saved: boolean) => void;
}) {
  const gold = score.total >= ELITE;
  const colors = teamColor(score.playerName);
  const postKey = `s${score.matchId}-${score.playerName}`;

  return (
    <FeedCard onPress={onPress}>
      <View style={styles.top}>
        <PostMeta
          left={
            <View style={styles.badge}>
              <Ionicons name="flame" size={13} color={COLOR.gold} />
              <Text style={styles.badgeText}>TOPPSERIE</Text>
            </View>
          }
          division={score.division}
        />
        <PostHeader
          avatar={<IdentityAvatar colors={colors} initials={teamInitials(score.playerName)} size={POST_AVATAR} />}
          name={score.playerName}
          subtitle={`mot ${score.opponent}`}
          right={score.publicId ? <FollowButton entityType="player" entityId={score.publicId} /> : undefined}
        />
      </View>

      <Text style={[styles.total, gold && styles.totalGold]}>{score.total}</Text>

      <View style={styles.bottom}>
        <SerieBars series={score.series} />
        <Text style={styles.date}>{formatMatchDate(score.date)}</Text>
        <PostActions
          postKey={postKey}
          liked={liked}
          saved={saved}
          likeCount={likeCount}
          onLike={onLike}
          onSave={onSave}
          shareMessage={`${score.playerName} · ${score.total} · Bowlkollen`}
        />
      </View>
    </FeedCard>
  );
});

const styles = StyleSheet.create({
  top: { gap: SPACE[3] },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeText: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },

  total: { color: COLOR.ink, fontSize: 72, fontFamily: FONT.scoreHeavy, letterSpacing: -3, fontVariant: ['tabular-nums'] },
  totalGold: { color: COLOR.gold },

  bottom: { gap: SPACE[3] },
  date: { color: COLOR.ink4, fontSize: TYPE.caption, fontFamily: FONT.medium },
});
