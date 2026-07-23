import { StyleSheet, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
import { formatMatchDate } from '@/lib/format';
import type { FeedMatch } from '@/lib/feed';
import { teamColor } from '@/lib/team-identity';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// A match as a feed card: division + status label, the face-off with team-colour
// accents (winner emphasised for results), venue. Whole card opens the match.
export function MatchCard({
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
  const hc = teamColor(match.home_team_name);
  const ac = teamColor(match.away_team_name);

  return (
    <FeedCard onPress={onPress}>
      <View style={styles.top}>
        <Text style={styles.division} numberOfLines={1}>{match.division_name}</Text>
        <Text style={[styles.status, upcoming && styles.statusUpcoming]}>
          {upcoming ? 'KOMMANDE' : formatMatchDate(match.match_date)}
        </Text>
      </View>

      <View style={styles.faceoff}>
        <View style={styles.teamL}>
          <View style={[styles.dot, { backgroundColor: hc.ring }]} />
          <Text style={[styles.team, homeWon ? styles.win : finished ? styles.lose : null]} numberOfLines={1}>
            {match.home_team_name}
          </Text>
        </View>

        <View style={styles.centre}>
          {finished ? (
            <Text style={styles.score}>
              <Text style={homeWon ? styles.sWin : styles.sLose}>{match.home_result}</Text>
              <Text style={styles.sSep}> – </Text>
              <Text style={awayWon ? styles.sWin : styles.sLose}>{match.away_result}</Text>
            </Text>
          ) : (
            <Text style={styles.date}>{formatMatchDate(match.match_date)}</Text>
          )}
        </View>

        <View style={styles.teamR}>
          <Text style={[styles.team, styles.teamRight, awayWon ? styles.win : finished ? styles.lose : null]} numberOfLines={1}>
            {match.away_team_name}
          </Text>
          <View style={[styles.dot, { backgroundColor: ac.ring }]} />
        </View>
      </View>

      {!!match.hall_name && <Text style={styles.meta} numberOfLines={1}>{match.hall_name}</Text>}
    </FeedCard>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3] },
  division: { flex: 1, color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  status: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.5 },
  statusUpcoming: { color: COLOR.gold },

  faceoff: { flexDirection: 'row', alignItems: 'center' },
  teamL: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  teamR: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: SPACE[2] },
  dot: { width: 8, height: 8, borderRadius: 4 },
  team: { flex: 1, color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold },
  teamRight: { textAlign: 'right' },
  win: { color: COLOR.ink, fontFamily: FONT.bold },
  lose: { color: COLOR.ink3 },

  centre: { paddingHorizontal: SPACE[3], alignItems: 'center' },
  score: { fontSize: TYPE.title + 4, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  sWin: { color: COLOR.ink },
  sLose: { color: COLOR.ink3 },
  sSep: { color: COLOR.ink4 },
  date: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },

  meta: { color: COLOR.ink3, fontSize: TYPE.caption },
});
