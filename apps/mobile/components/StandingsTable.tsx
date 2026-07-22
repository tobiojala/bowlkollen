import { shortName, type TeamStanding } from '@bowlkollen/core';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// The full division table — reused inside the glass table sheet (team page) and
// available for the division page. Rows are doorways to each team.
export function StandingsTable({
  standings,
  highlightTeamId,
  onOpenTeam,
  animate = false,
}: {
  standings: TeamStanding[];
  highlightTeamId?: number;
  onOpenTeam: (teamId: number) => void;
  animate?: boolean;
}) {
  return (
    <View>
      <View style={styles.head}>
        <Text style={[styles.h, styles.pos]}>#</Text>
        <Text style={[styles.h, styles.team]}>LAG</Text>
        <Text style={[styles.h, styles.num]}>M</Text>
        <Text style={[styles.h, styles.record]}>V-O-F</Text>
        <Text style={[styles.h, styles.ptsCol]}>P</Text>
      </View>
      {standings.map((s, i) => {
        const leader = i === 0;
        const mine = s.teamId === highlightTeamId;
        const row = (
          <PressableScale
            style={[styles.row, mine && styles.rowMine]}
            onPress={() => onOpenTeam(s.teamId)}
          >
            <Text style={[styles.pos, styles.numTxt, (leader || mine) && styles.gold]}>{i + 1}</Text>
            <Text style={[styles.team, styles.teamTxt, (leader || mine) && styles.teamStrong]} numberOfLines={1}>
              {shortName(s.teamName)}
            </Text>
            <Text style={[styles.num, styles.numTxt]}>{s.played}</Text>
            <Text style={[styles.record, styles.numTxt]}>
              {s.won}-{s.drawn}-{s.lost}
            </Text>
            <Text style={[styles.ptsCol, styles.pts, (leader || mine) && styles.gold]}>{s.points}</Text>
          </PressableScale>
        );
        return animate ? (
          <Animated.View key={s.teamId} entering={FadeInDown.duration(240).delay(Math.min(i, 12) * 26)}>
            {row}
          </Animated.View>
        ) : (
          <View key={s.teamId}>{row}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingBottom: SPACE[2] },
  h: { fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.5, color: COLOR.ink3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE[3],
    paddingHorizontal: SPACE[2],
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
    borderRadius: 8,
  },
  rowMine: { backgroundColor: 'rgba(245,194,0,0.08)' },
  pos: { width: 26, textAlign: 'left' },
  team: { flex: 1, paddingRight: SPACE[2] },
  num: { width: 28, textAlign: 'right' },
  record: { width: 60, textAlign: 'right' },
  ptsCol: { width: 36, textAlign: 'right' },
  numTxt: { fontFamily: FONT.display, fontSize: 15, color: COLOR.ink2, fontVariant: ['tabular-nums'] },
  teamTxt: { fontFamily: FONT.semibold, fontSize: TYPE.body, color: COLOR.ink },
  teamStrong: { fontFamily: FONT.bold },
  pts: { fontFamily: FONT.display, fontSize: 17, color: COLOR.ink, fontVariant: ['tabular-nums'] },
  gold: { color: COLOR.gold },
});
