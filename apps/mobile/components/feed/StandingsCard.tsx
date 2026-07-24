import { shortName } from '@bowlkollen/core';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
import { PostMeta } from '@/components/feed/PostMeta';
import type { FeedStanding } from '@/lib/feed-standings';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// A standings snapshot post: a division's top teams, leader in gold. The card
// opens the division; each row is a doorway to that team.
export const StandingsCard = memo(function StandingsCard({
  standing,
  onOpen,
  onOpenTeam,
}: {
  standing: FeedStanding;
  onOpen: () => void;
  onOpenTeam: (teamId: number) => void;
}) {
  return (
    <FeedCard onPress={onOpen}>
      <PostMeta
        left={<Text style={styles.badge}>TABELL</Text>}
        division={standing.historical ? `${standing.division} · förra säsongen` : standing.division}
      />

      <View style={styles.table}>
        {standing.rows.map((r, i) => {
          const leader = i === 0;
          return (
            <Pressable key={r.teamId} style={styles.row} onPress={() => onOpenTeam(r.teamId)}>
              <Text style={[styles.rank, leader && styles.gold]}>{i + 1}</Text>
              <Text style={[styles.name, leader && styles.nameLeader]} numberOfLines={1}>
                {shortName(r.teamName)}
              </Text>
              <Text style={styles.played}>{r.played} sp</Text>
              <Text style={[styles.points, leader && styles.gold]}>{r.points}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.footer}>Hela tabellen →</Text>
    </FeedCard>
  );
});

const styles = StyleSheet.create({
  badge: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  table: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    paddingVertical: SPACE[3],
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
  },
  rank: { width: 22, color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.bold },
  name: { flex: 1, color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold },
  nameLeader: { color: COLOR.ink, fontFamily: FONT.bold },
  played: { color: COLOR.ink3, fontSize: TYPE.caption },
  points: { width: 34, textAlign: 'right', color: COLOR.ink, fontSize: TYPE.body + 1, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  gold: { color: COLOR.gold },
  footer: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
});
