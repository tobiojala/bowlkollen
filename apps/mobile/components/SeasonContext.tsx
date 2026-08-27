import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { useMatchContext } from '@/lib/match-context';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const ord = (n: number) => (n <= 2 ? `${n}:a` : `${n}:e`);
const short = (n: string) => n.split(' ').slice(0, 3).join(' ');

// H2H + standings context for a finished match — the season meaning behind the
// scoreline, linking back into the division. Web parity (SeasonContext).
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

  const body = (
    <View style={styles.wrap}>
      {!!h2hText && <Text style={styles.h2h}>{h2hText}</Text>}
      {hasStandings && (
        <Text style={styles.standings}>
          {homeRank ? `${short(homeName)} ${ord(homeRank)}` : ''}{homeRank && awayRank ? ' · ' : ''}{awayRank ? `${short(awayName)} ${ord(awayRank)}` : ''} i {tier}
        </Text>
      )}
    </View>
  );

  return divisionId ? <PressableScale onPress={() => router.push(`/division/${divisionId}`)}>{body}</PressableScale> : body;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 3, marginTop: SPACE[3] },
  h2h: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold, textAlign: 'center' },
  standings: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center' },
});
