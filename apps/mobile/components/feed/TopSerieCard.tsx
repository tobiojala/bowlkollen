import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
import { POST_AVATAR, PostHeader } from '@/components/feed/PostHeader';
import { PostMeta } from '@/components/feed/PostMeta';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { teamColor, teamInitials } from '@/lib/team-identity';
import type { TopScore } from '@/lib/top-scores';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const ELITE = 900;
const BAR_H = 48;
const GAME_GOLD = 250;

// Top-series post: player avatar + name header, the total as the hero, game bars.
// memo'd so it stays cheap while the virtualized list scrolls.
export const TopSerieCard = memo(function TopSerieCard({ score, onPress }: { score: TopScore; onPress?: () => void }) {
  const gold = score.total >= ELITE;
  const max = Math.max(...score.series, 1);
  const colors = teamColor(score.playerName);

  return (
    <FeedCard onPress={onPress}>
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
      />

      <Text style={[styles.total, gold && styles.totalGold]}>{score.total}</Text>

      {score.series.length > 0 && (
        <View style={styles.bars}>
          {score.series.map((g, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={{
                    width: '100%',
                    height: Math.max(5, (g / max) * BAR_H),
                    borderRadius: 4,
                    backgroundColor: g >= GAME_GOLD ? COLOR.gold : COLOR.surface2,
                  }}
                />
              </View>
              <Text style={styles.barVal}>{g}</Text>
            </View>
          ))}
        </View>
      )}
    </FeedCard>
  );
});

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeText: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },

  total: { color: COLOR.ink, fontSize: 68, fontFamily: FONT.display, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  totalGold: { color: COLOR.gold },

  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACE[4] },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: '100%', height: BAR_H, justifyContent: 'flex-end' },
  barVal: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
});
