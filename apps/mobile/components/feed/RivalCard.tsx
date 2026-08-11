import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { useNextMatch } from '@/lib/diary';
import { relativeMatchDate } from '@/lib/format';
import { usePlayerScouting } from '@/lib/scouting';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const MIN_MEETINGS = 2;

// Pre-match rivalry: for your next fixture, the opponent you most need to watch —
// your career head-to-head vs them. Renders nothing unless you're a claimed player
// facing a team where you've got real history. Tap → the prep sheet (full scouting).
export function RivalCard() {
  const router = useRouter();
  const { data: next } = useNextMatch();

  const matchTeams = next
    ? {
        homeTeamId: next.isHome ? next.myTeamId : next.opponentId,
        awayTeamId: next.isHome ? next.opponentId : next.myTeamId,
        homeName: next.isHome ? next.myTeamName : next.opponentName,
        awayName: next.isHome ? next.opponentName : next.myTeamName,
      }
    : null;
  const { data: scouting } = usePlayerScouting(matchTeams);

  if (!next || !scouting) return null;
  const rival = scouting.opponents.find((o) => o.meetings >= MIN_MEETINGS);
  if (!rival) return null;

  const lead = rival.myWins > rival.myLosses;
  const trail = rival.myWins < rival.myLosses;
  const standing = lead ? 'Du leder' : trail ? 'Du ligger under' : 'Helt jämnt';

  return (
    <PressableScale style={styles.card} onPress={() => router.push(`/prep/${next.matchId}`)}>
      <View style={styles.head}>
        <Text style={styles.kicker}>RIVALITET</Text>
        <Text style={styles.when}>{relativeMatchDate(next.date)}</Text>
      </View>
      <View style={styles.row}>
        <IdentityAvatar colors={teamColor(rival.name)} initials={teamInitials(rival.name)} size={40} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>Du möter {rival.name}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {standing} <Text style={[styles.rec, lead ? styles.recLead : trail ? styles.recTrail : styles.recEven]}>{rival.myWins}–{rival.myLosses}</Text> · {rival.meetings} möten
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACE[4], padding: SPACE[4], borderRadius: RADIUS.lg, backgroundColor: COLOR.surface,
    borderLeftWidth: 2, borderLeftColor: COLOR.gold, gap: SPACE[3],
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  when: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.bold },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  info: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },
  rec: { fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  recLead: { color: COLOR.green },
  recTrail: { color: COLOR.red },
  recEven: { color: COLOR.ink2 },
});
