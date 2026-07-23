import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
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
}: {
  match: FeedMatch;
  upcoming: boolean;
  onPress: () => void;
}) {
  const finished = !!match.is_finished;
  const homeWon = finished && match.home_result > match.away_result;
  const awayWon = finished && match.away_result > match.home_result;

  return (
    <FeedCard onPress={onPress}>
      <View style={styles.kicker}>
        <Text style={styles.division} numberOfLines={1}>{match.division_name}</Text>
        <Text style={[styles.status, upcoming && styles.statusUpcoming]}>
          {upcoming ? 'KOMMANDE' : formatMatchDate(match.match_date)}
        </Text>
      </View>

      <View style={styles.teams}>
        <TeamLine name={match.home_team_name} score={match.home_result} won={homeWon} finished={finished} />
        <TeamLine name={match.away_team_name} score={match.away_result} won={awayWon} finished={finished} />
      </View>

      <Text style={styles.footer} numberOfLines={1}>
        {[finished ? 'Banpoäng' : formatMatchDate(match.match_date), match.hall_name].filter(Boolean).join('  ·  ')}
      </Text>
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
  kicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3] },
  division: { flex: 1, color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  status: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.5 },
  statusUpcoming: { color: COLOR.gold },

  teams: { gap: SPACE[4] },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  team: { flex: 1, color: COLOR.ink2, fontSize: TYPE.title, fontFamily: FONT.semibold, letterSpacing: -0.3 },
  win: { color: COLOR.ink, fontFamily: FONT.bold },
  lose: { color: COLOR.ink3 },
  score: { fontSize: TYPE.hero - 8, fontFamily: FONT.display, fontVariant: ['tabular-nums'], minWidth: 44, textAlign: 'right' },
  sWin: { color: COLOR.ink },
  sLose: { color: COLOR.ink3 },

  footer: { color: COLOR.ink3, fontSize: TYPE.caption },
});
