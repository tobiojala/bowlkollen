import { Ionicons } from '@expo/vector-icons';
import { shortName } from '@bowlkollen/core';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
import { POST_AVATAR, PostHeader } from '@/components/feed/PostHeader';
import { PostMeta } from '@/components/feed/PostMeta';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import type { FeedStanding } from '@/lib/feed-standings';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// A team's achievement, told with the standings as context: what they did
// (headline) up top, then the tight ladder around them. Opens the division;
// rows open the team.
export const StandingsCard = memo(function StandingsCard({
  standing,
  onOpen,
  onOpenTeam,
}: {
  standing: FeedStanding;
  onOpen: () => void;
  onOpenTeam: (teamId: number) => void;
}) {
  // Climb → chip (the headline never restates the number). Streak lives in the
  // headline, so no streak chip — each fact appears once.
  const chip = standing.delta > 0 ? { text: `+${standing.delta}`, color: COLOR.green } : null;

  return (
    <FeedCard onPress={onOpen}>
      <View style={styles.top}>
        <PostMeta left={<Text style={styles.badge}>{standing.badge}</Text>} division={standing.division} />
        <PostHeader
          avatar={<IdentityAvatar colors={teamColor(standing.teamName)} initials={teamInitials(standing.teamName)} size={POST_AVATAR} />}
          name={standing.teamName}
          right={
            chip ? (
              <View style={[styles.chip, { borderColor: chip.color }]}>
                <Ionicons name="arrow-up" size={13} color={chip.color} />
                <Text style={[styles.chipText, { color: chip.color }]}>{chip.text}</Text>
              </View>
            ) : undefined
          }
        />
        <Text style={styles.headline}>{standing.headline}</Text>
      </View>

      <View style={styles.ladder}>
        {standing.ladder.map((r) => (
          <Pressable key={r.teamId} style={[styles.row, r.subject && styles.rowSubject]} onPress={() => onOpenTeam(r.teamId)}>
            <Text style={[styles.rank, r.subject && styles.gold]}>{r.rank}</Text>
            <Text style={[styles.name, r.subject && styles.nameSubject]} numberOfLines={1}>{shortName(r.teamName)}</Text>
            <Text style={[styles.points, r.subject && styles.gold]}>{r.points}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.footer}>Hela tabellen →</Text>
    </FeedCard>
  );
});

const styles = StyleSheet.create({
  top: { gap: SPACE[3] },
  badge: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACE[3],
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: TYPE.caption, fontFamily: FONT.bold },
  headline: { color: COLOR.ink, fontSize: TYPE.body + 3, fontFamily: FONT.bold, letterSpacing: -0.3, lineHeight: 24 },

  ladder: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], paddingHorizontal: SPACE[2], borderRadius: 8 },
  rowSubject: { backgroundColor: 'rgba(245,194,0,0.08)' },
  rank: { width: 22, color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.bold },
  name: { flex: 1, color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold },
  nameSubject: { color: COLOR.ink, fontFamily: FONT.bold },
  points: { width: 34, textAlign: 'right', color: COLOR.ink, fontSize: TYPE.body + 1, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  gold: { color: COLOR.gold },
  footer: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
});
