import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { formatMatchDate } from '@/lib/format';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

export type MatchRowData = {
  bits_match_id: number;
  home_team_name: string;
  away_team_name: string;
  // Match points (the league score, e.g. 14-6) — NOT pinfall. Pinfall lives on
  // the match detail screen.
  home_result: number | null;
  away_result: number | null;
  division_name: string | null;
  is_finished: boolean | null;
  match_date: string;
  hall_name: string | null;
  // Present on BITS division/team matches — lets each team name be its own
  // doorway. Absent on the home-feed RPC, where the whole row opens the match.
  home_bits_team_id?: number | null;
  away_bits_team_id?: number | null;
};

// Face-off row: two teams across a centre — the result if played (winner
// emphasised, loser dimmed, so the outcome reads at a glance), the date if
// upcoming. Teams are doorways to their pages (when onOpenTeam + a team id are
// given); tapping the centre/rest opens the match. The meta line carries
// division/venue.
export function MatchRow({
  m,
  showDivision = true,
  onPress,
  onOpenTeam,
}: {
  m: MatchRowData;
  showDivision?: boolean;
  onPress?: () => void;
  onOpenTeam?: (teamId: number) => void;
}) {
  const finished = !!m.is_finished && m.home_result != null && m.away_result != null;
  const homeWon = finished && (m.home_result ?? 0) > (m.away_result ?? 0);
  const awayWon = finished && (m.away_result ?? 0) > (m.home_result ?? 0);

  const meta = [showDivision ? m.division_name : null, m.hall_name].filter(Boolean);
  const nameStyle = (won: boolean) => [styles.team, won ? styles.win : finished ? styles.lose : null];

  return (
    <PressableScale style={styles.row} onPress={onPress} disabled={!onPress} haptic>
      <View style={styles.faceoff}>
        <TeamCell
          name={m.home_team_name}
          teamId={m.home_bits_team_id}
          onOpenTeam={onOpenTeam}
          textStyle={nameStyle(homeWon)}
        />

        <View style={styles.centre}>
          {finished ? (
            <View style={styles.scoreRow}>
              <Text style={[styles.score, homeWon ? styles.scoreWin : styles.scoreLose]}>
                {m.home_result}
              </Text>
              <Text style={styles.scoreSep}>–</Text>
              <Text style={[styles.score, awayWon ? styles.scoreWin : styles.scoreLose]}>
                {m.away_result}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.date}>{formatMatchDate(m.match_date)}</Text>
              <Text style={styles.vs}>vs</Text>
            </>
          )}
        </View>

        <TeamCell
          name={m.away_team_name}
          teamId={m.away_bits_team_id}
          onOpenTeam={onOpenTeam}
          textStyle={[...nameStyle(awayWon), styles.teamRight]}
        />
      </View>

      {meta.length > 0 && (
        <Text style={styles.meta} numberOfLines={1}>
          {meta.join('  ·  ')}
        </Text>
      )}
    </PressableScale>
  );
}

// A team name that's a doorway to its page when we have an id + handler,
// otherwise plain text (home feed). hitSlop keeps the tap target comfortable.
function TeamCell({
  name,
  teamId,
  onOpenTeam,
  textStyle,
}: {
  name: string;
  teamId?: number | null;
  onOpenTeam?: (teamId: number) => void;
  textStyle: (object | null)[];
}) {
  const label = (
    <Text style={textStyle} numberOfLines={1}>
      {name}
    </Text>
  );
  if (!onOpenTeam || teamId == null) return label;
  return (
    <Pressable
      style={styles.cell}
      hitSlop={{ top: 10, bottom: 10 }}
      onPress={() => onOpenTeam(teamId)}
      accessibilityLabel={name}
    >
      {label}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: SPACE[4] + SPACE[2],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
    gap: SPACE[3],
  },
  faceoff: { flexDirection: 'row', alignItems: 'center' },
  cell: { flex: 1 },
  team: { flex: 1, color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold, lineHeight: 21 },
  teamRight: { textAlign: 'right' },
  win: { color: COLOR.ink, fontFamily: FONT.bold },
  lose: { color: COLOR.ink2 },

  centre: { paddingHorizontal: SPACE[4], minWidth: 82, alignItems: 'center' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  score: { fontSize: TYPE.body + 12, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  scoreWin: { color: COLOR.ink },
  scoreLose: { color: COLOR.ink2 },
  scoreSep: { color: COLOR.ink4, fontSize: TYPE.body + 4, fontFamily: FONT.display, marginHorizontal: 5 },

  date: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  vs: { color: COLOR.ink4, fontSize: TYPE.label, fontFamily: FONT.semibold, letterSpacing: 1.5, marginTop: 2 },

  meta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.regular },
});
