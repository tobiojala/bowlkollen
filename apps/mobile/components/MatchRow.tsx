import { StyleSheet, Text, View } from 'react-native';

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
};

// Face-off row: two teams across a centre — the result if played (winner
// emphasised, loser dimmed, so the outcome reads at a glance), the date if
// upcoming. Teams are doorways; the meta line carries division/venue.
export function MatchRow({
  m,
  showDivision = true,
  onPress,
}: {
  m: MatchRowData;
  showDivision?: boolean;
  onPress?: () => void;
}) {
  const finished = !!m.is_finished && m.home_result != null && m.away_result != null;
  const homeWon = finished && (m.home_result ?? 0) > (m.away_result ?? 0);
  const awayWon = finished && (m.away_result ?? 0) > (m.home_result ?? 0);

  const meta = [showDivision ? m.division_name : null, m.hall_name].filter(Boolean);

  return (
    <PressableScale style={styles.row} onPress={onPress} disabled={!onPress} haptic>
      <View style={styles.faceoff}>
        <Text
          style={[styles.team, homeWon ? styles.win : finished ? styles.lose : null]}
          numberOfLines={1}
        >
          {m.home_team_name}
        </Text>

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

        <Text
          style={[styles.team, styles.teamRight, awayWon ? styles.win : finished ? styles.lose : null]}
          numberOfLines={1}
        >
          {m.away_team_name}
        </Text>
      </View>

      {meta.length > 0 && (
        <Text style={styles.meta} numberOfLines={1}>
          {meta.join('  ·  ')}
        </Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: SPACE[4] + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
    gap: SPACE[2],
  },
  faceoff: { flexDirection: 'row', alignItems: 'center' },
  team: { flex: 1, color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold },
  teamRight: { textAlign: 'right' },
  win: { color: COLOR.ink, fontFamily: FONT.bold },
  lose: { color: COLOR.ink3 },

  centre: { paddingHorizontal: SPACE[4], minWidth: 78, alignItems: 'center' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  score: { fontSize: TYPE.body + 10, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  scoreWin: { color: COLOR.ink },
  scoreLose: { color: COLOR.ink3 },
  scoreSep: { color: COLOR.ink4, fontSize: TYPE.body + 4, fontFamily: FONT.display, marginHorizontal: 4 },

  date: { color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.bold },
  vs: { color: COLOR.ink4, fontSize: TYPE.label, fontFamily: FONT.semibold, letterSpacing: 1, marginTop: 1 },

  meta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.regular },
});
