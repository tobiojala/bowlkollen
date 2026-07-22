import { Pressable, StyleSheet, Text, View } from 'react-native';

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

// Face-off row shared by the home feed and team page (list design language:
// two teams across a centre — score if played, date if upcoming).
export function MatchRow({
  m,
  showDivision = true,
  onPress,
}: {
  m: MatchRowData;
  showDivision?: boolean;
  onPress?: () => void;
}) {
  const meta = [
    showDivision ? m.division_name : null,
    m.is_finished ? formatMatchDate(m.match_date) : null,
    m.hall_name,
  ].filter(Boolean);

  return (
    <Pressable style={styles.match} onPress={onPress} disabled={!onPress}>
      <View style={styles.faceoff}>
        <Text style={styles.team} numberOfLines={1}>
          {m.home_team_name}
        </Text>
        <View style={styles.centerCol}>
          {m.is_finished ? (
            <Text style={styles.score}>
              {m.home_result ?? 0}–{m.away_result ?? 0}
            </Text>
          ) : (
            <Text style={styles.date}>{formatMatchDate(m.match_date)}</Text>
          )}
        </View>
        <Text style={[styles.team, styles.teamRight]} numberOfLines={1}>
          {m.away_team_name}
        </Text>
      </View>
      {meta.length > 0 && (
        <Text style={styles.meta} numberOfLines={1}>
          {meta.join(' · ')}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  match: {
    paddingVertical: SPACE[4],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
    gap: SPACE[2],
  },
  faceoff: { flexDirection: 'row', alignItems: 'center' },
  team: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  teamRight: { textAlign: 'right' },
  centerCol: { paddingHorizontal: SPACE[3], minWidth: 64, alignItems: 'center' },
  score: { color: COLOR.ink, fontSize: TYPE.body + 8, fontFamily: FONT.display, letterSpacing: 0.5 },
  date: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.regular },
});
