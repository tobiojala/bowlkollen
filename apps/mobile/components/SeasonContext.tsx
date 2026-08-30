import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { useMatchContext } from '@/lib/match-context';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const ord = (n: number) => (n <= 2 ? `${n}:a` : `${n}:e`);
const short = (n: string) => n.split(' ').slice(0, 3).join(' ');

// H2H + standings context for a finished match — the season meaning behind the
// scoreline, as small pills that link back into the division. Web parity.
export function SeasonContext({ divisionId, seasonId, homeTeamId, awayTeamId, homeName, awayName, tier }: {
  divisionId: number | null; seasonId: number;
  homeTeamId: number | null; awayTeamId: number | null;
  homeName: string; awayName: string; tier: string;
}) {
  const router = useRouter();
  const { data } = useMatchContext(divisionId, seasonId, homeTeamId, awayTeamId);
  if (!data) return null;

  const { h2h, homeRank, awayRank } = data;
  const h2hText = h2h
    ? h2h.homeWins === h2h.awayWins
      ? `${ord(h2h.meetings)} mötet · lika ${h2h.homeWins}–${h2h.awayWins}`
      : `${ord(h2h.meetings)} mötet · ${short(h2h.homeWins > h2h.awayWins ? homeName : awayName)} leder ${Math.max(h2h.homeWins, h2h.awayWins)}–${Math.min(h2h.homeWins, h2h.awayWins)}`
    : null;
  const hasStandings = !!(homeRank || awayRank);
  if (!h2hText && !hasStandings) return null;

  const standingsText = hasStandings
    ? `${homeRank ? `${short(homeName)} ${ord(homeRank)}` : ''}${homeRank && awayRank ? ' · ' : ''}${awayRank ? `${short(awayName)} ${ord(awayRank)}` : ''} · ${tier}`
    : null;

  return (
    <View style={styles.row}>
      {!!h2hText && (
        <View style={styles.pill}>
          <Text style={styles.pillText} numberOfLines={1}>{h2hText}</Text>
        </View>
      )}
      {!!standingsText && (
        divisionId ? (
          <PressableScale style={styles.pill} onPress={() => router.push(`/division/${divisionId}`)}>
            <Text style={styles.pillText} numberOfLines={1}>{standingsText}</Text>
          </PressableScale>
        ) : (
          <View style={styles.pill}>
            <Text style={styles.pillText} numberOfLines={1}>{standingsText}</Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2], justifyContent: 'center', marginTop: SPACE[4] },
  pill: { maxWidth: '100%', backgroundColor: COLOR.surface, borderRadius: RADIUS.pill, paddingVertical: SPACE[2], paddingHorizontal: SPACE[4] },
  pillText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
});
