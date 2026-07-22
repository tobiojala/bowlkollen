import { shortName, standingsNeighbors, type TeamStanding } from '@bowlkollen/core';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// Who's chasing, who's being chased — a compact ±2 window around this team's
// spot, not the full table (that's one tap away on the division page). Mirrors
// the web StandingsLadder.
export function StandingsLadder({
  standings,
  teamId,
  onOpenTeam,
  onOpenDivision,
  historical = false,
}: {
  standings: TeamStanding[];
  teamId: number;
  onOpenTeam: (teamId: number) => void;
  onOpenDivision?: () => void;
  historical?: boolean;
}) {
  const rows = standingsNeighbors(standings, teamId, 2);
  if (rows.length === 0) return null;
  const startRank = standings.findIndex((s) => s.teamId === rows[0].teamId) + 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {historical ? 'TABELLEN — FÖRRA SÄSONGEN' : 'TABELLEN'}
        </Text>
        {onOpenDivision && (
          <PressableScale onPress={onOpenDivision} hitSlop={8}>
            <Text style={styles.link}>Hela tabellen →</Text>
          </PressableScale>
        )}
      </View>

      {rows.map((s, i) => {
        const isTeam = s.teamId === teamId;
        return (
          <PressableScale
            key={s.teamId}
            style={[styles.row, isTeam && styles.rowActive]}
            onPress={() => onOpenTeam(s.teamId)}
          >
            <Text style={[styles.rank, isTeam && styles.textGold]}>{startRank + i}</Text>
            <Text
              style={[styles.name, isTeam ? styles.nameActive : null]}
              numberOfLines={1}
            >
              {shortName(s.teamName)}
            </Text>
            <Text style={styles.played}>{s.played} sp</Text>
            <Text style={[styles.points, isTeam ? styles.textGold : styles.pointsInk]}>
              {s.points}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACE[8] },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: SPACE[2],
  },
  title: { color: COLOR.ink2, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  link: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    paddingVertical: SPACE[3],
    paddingHorizontal: SPACE[2],
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
    borderRadius: 8,
  },
  rowActive: { backgroundColor: 'rgba(245,194,0,0.08)' },
  rank: { width: 22, fontSize: TYPE.caption, fontFamily: FONT.bold, color: COLOR.ink3 },
  name: { flex: 1, minWidth: 0, fontSize: TYPE.body, fontFamily: FONT.semibold, color: COLOR.ink2 },
  nameActive: { color: COLOR.ink, fontFamily: FONT.bold },
  played: { fontSize: TYPE.caption, color: COLOR.ink3 },
  points: { width: 30, textAlign: 'right', fontSize: TYPE.body, fontFamily: FONT.bold },
  pointsInk: { color: COLOR.ink },
  textGold: { color: COLOR.gold },
});
