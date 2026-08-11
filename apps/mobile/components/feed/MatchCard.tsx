import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
import { PostActions } from '@/components/feed/PostActions';
import { PostMeta } from '@/components/feed/PostMeta';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { formatMatchDate } from '@/lib/format';
import type { FeedMatch } from '@/lib/feed';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// Match post: a division kicker, then a clean two-team scoreboard (avatar + name
// + score per line, winner lit), then a quiet footer. Whole post opens the match.
// memo'd so it doesn't re-render while the virtualized list scrolls.
export const MatchCard = memo(function MatchCard({
  match,
  upcoming,
  onPress,
  liked,
  saved,
  likeCount,
  onLike,
  onSave,
}: {
  match: FeedMatch;
  upcoming: boolean;
  onPress: () => void;
  liked: boolean;
  saved: boolean;
  likeCount: number;
  onLike: (key: string, liked: boolean) => void;
  onSave: (key: string, saved: boolean) => void;
}) {
  const finished = !!match.is_finished;
  const homeWon = finished && match.home_result > match.away_result;
  const awayWon = finished && match.away_result > match.home_result;

  return (
    <FeedCard onPress={onPress}>
      <PostMeta
        left={
          <Text style={[styles.status, upcoming && styles.statusUpcoming]}>
            {upcoming ? 'KOMMANDE' : 'RESULTAT'}
          </Text>
        }
        division={match.division_name}
      />

      <View style={styles.teams}>
        <TeamLine name={match.home_team_name} score={match.home_result} won={homeWon} finished={finished} />
        <TeamLine name={match.away_team_name} score={match.away_result} won={awayWon} finished={finished} />
      </View>

      <View style={styles.bottom}>
        <Text style={styles.footer} numberOfLines={1}>
          {[finished ? 'Banpoäng' : formatMatchDate(match.match_date), match.hall_name].filter(Boolean).join('  ·  ')}
        </Text>
        <PostActions
          postKey={`m${match.bits_match_id}`}
          liked={liked}
          saved={saved}
          likeCount={likeCount}
          onLike={onLike}
          onSave={onSave}
          shareMessage={`${match.home_team_name} – ${match.away_team_name} · Bowlkollen`}
        />
      </View>
    </FeedCard>
  );
});

function TeamLine({
  name,
  score,
  won,
  finished,
}: {
  name: string;
  score: number;
  won: boolean;
  finished: boolean;
}) {
  return (
    <View style={styles.line}>
      <IdentityAvatar colors={teamColor(name)} initials={teamInitials(name)} size={40} />
      <Text
        style={[styles.team, won ? styles.win : finished ? styles.lose : null]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {name}
      </Text>
      {finished && <Text style={[styles.score, won ? styles.sWin : styles.sLose]}>{score}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  status: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  statusUpcoming: { color: COLOR.gold },

  teams: { gap: SPACE[4] },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  team: { flex: 1, color: COLOR.ink2, fontSize: TYPE.title, fontFamily: FONT.semibold, letterSpacing: -0.3 },
  win: { color: COLOR.ink, fontFamily: FONT.bold },
  lose: { color: COLOR.ink3 },
  score: { fontSize: TYPE.hero - 8, fontFamily: FONT.score, fontVariant: ['tabular-nums'], minWidth: 44, textAlign: 'right' },
  sWin: { color: COLOR.ink },
  sLose: { color: COLOR.ink3 },

  bottom: { gap: SPACE[3] },
  footer: { color: COLOR.ink3, fontSize: TYPE.caption },
});
