import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { TeamResults, type ResultRow } from '@/components/TeamResults';
import { useLiveMatch, type LiveScores } from '@/lib/use-live-match';
import { COLOR, FONT, RADIUS, SPACE } from '@/theme';

const toRow = (p: LiveScores['players'][number]): ResultRow => ({
  player_name: p.name, total_result: p.total, series: p.games, is_home_team: p.isHomeTeam, public_id: null,
});
const sum = (a: number[]) => a.reduce((t, n) => t + n, 0);
const hhmmss = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch { return ''; }
};

// Live serie board for a match in progress (parity with web) — polls the shared
// web route and shows running pinfall + per-player lines via TeamResults, with a
// pulsing LIVE badge.
export function LiveScoreboard({ matchId, homeName, awayName }: { matchId: number; homeName: string; awayName: string }) {
  const { data, isLoading, isError } = useLiveMatch(matchId, true);
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.25, duration: 750, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const home = data?.series.teamA ?? [];
  const away = data?.series.teamB ?? [];
  const hasData = Math.max(home.length, away.length) > 0;
  const players = data?.players ?? [];
  const topTotal = players.reduce((m, p) => Math.max(m, p.total), 0);

  return (
    <View>
      <View style={s.head}>
        <View style={s.badge}>
          <Animated.View style={[s.dot, { opacity: pulse }]} />
          <Text style={s.badgeT}>LIVE</Text>
        </View>
        {hasData && <Text style={s.score}>{sum(home)} <Text style={s.dash}>–</Text> {sum(away)}</Text>}
        {data ? <Text style={s.upd}>Uppdaterad {hhmmss(data.updatedAt)}</Text> : null}
      </View>

      {!hasData ? (
        <Text style={s.empty}>
          {isLoading ? 'Hämtar live-resultat…'
            : isError ? 'Kunde inte hämta live-resultat just nu — försöker igen.'
            : 'Matchen har börjat — första serien dyker upp här så fort den rullats.'}
        </Text>
      ) : (
        <>
          <TeamResults teamName={homeName} pins={sum(home)} rows={players.filter((p) => p.isHomeTeam).map(toRow)} topTotal={topTotal} />
          <TeamResults teamName={awayName} pins={sum(away)} rows={players.filter((p) => !p.isHomeTeam).map(toRow)} topTotal={topTotal} />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(224,85,85,0.12)', borderWidth: 1, borderColor: COLOR.red, borderRadius: RADIUS.pill, paddingVertical: 4, paddingHorizontal: 11 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLOR.red },
  badgeT: { fontSize: 11, fontFamily: FONT.bold, letterSpacing: 0.8, color: COLOR.red },
  score: { fontFamily: FONT.scoreHeavy, fontSize: 20, color: COLOR.ink },
  dash: { color: COLOR.ink4, fontFamily: FONT.regular },
  upd: { fontSize: 11, color: COLOR.ink4, fontFamily: FONT.regular, marginLeft: 'auto' },
  empty: { paddingVertical: SPACE[8], textAlign: 'center', color: COLOR.ink3, fontSize: 14, fontFamily: FONT.regular, lineHeight: 20 },
});
