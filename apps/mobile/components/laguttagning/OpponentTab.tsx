import { StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/IdentityAvatar';
import { LineupDisplay } from '@/components/LineupDisplay';
import { PressableScale } from '@/components/PressableScale';
import { formatMatchDate } from '@/lib/format';
import { useRoster } from '@/lib/team-data';
import { useHeadToHead } from '@/lib/team-admin';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';
import { useRouter } from 'expo-router';

// Opponent scouting: their published lineup (if any), your recent meetings, and their
// players to watch. Public data — no team-private access needed.
export function OpponentTab({
  teamId,
  opponentId,
  opponentName,
  matchId,
}: {
  teamId: number;
  opponentId: number | null;
  opponentName: string;
  matchId: number;
}) {
  const router = useRouter();
  const { data: h2h = [] } = useHeadToHead(teamId, opponentId);
  const { data: roster = [] } = useRoster(opponentId ?? 0);
  const watch = [...roster].sort((a, b) => (b.licence_average ?? 0) - (a.licence_average ?? 0)).slice(0, 5);

  if (!opponentId) return <Text style={styles.empty}>Ingen motståndardata.</Text>;

  return (
    <View>
      <Text style={styles.oppName}>{opponentName}</Text>

      {/* Their published lineup, if the opponent's captain has set one */}
      <LineupDisplay teamId={opponentId} matchId={matchId} subtitle="Motståndarens lag" />

      {h2h.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>SENASTE MÖTEN</Text>
          {h2h.map((m) => (
            <View key={m.matchId} style={styles.h2hRow}>
              <Text style={styles.h2hDate}>{formatMatchDate(m.date)}</Text>
              <Text style={styles.h2hScore}>{m.ours ?? '–'}–{m.theirs ?? '–'}</Text>
              {m.outcome && (
                <View style={[styles.badge, { backgroundColor: m.outcome === 'W' ? COLOR.green : m.outcome === 'L' ? COLOR.red : COLOR.surface2 }]}>
                  <Text style={[styles.badgeText, m.outcome === 'D' && { color: COLOR.ink2 }]}>
                    {m.outcome === 'W' ? 'Vinst' : m.outcome === 'L' ? 'Förlust' : 'Oavgjort'}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {watch.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>ATT HÅLLA KOLL PÅ</Text>
          {watch.map((p) => (
            <PressableScale key={p.public_id} style={styles.player} onPress={() => router.push(`/player/${p.public_id}`)}>
              <IdentityAvatar colors={teamColor(p.name)} initials={teamInitials(p.name)} size={40} />
              <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
              {p.licence_average != null && <Text style={styles.playerAvg}>{p.licence_average}</Text>}
            </PressableScale>
          ))}
        </View>
      )}

      {h2h.length === 0 && watch.length === 0 && <Text style={styles.empty}>Ingen scouting-data för motståndaren ännu.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  oppName: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, letterSpacing: -0.3, marginTop: SPACE[4] },
  section: { marginTop: SPACE[8] },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[3] },

  h2hRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  h2hDate: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, width: 64 },
  h2hScore: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  badge: { paddingHorizontal: SPACE[3], paddingVertical: 3, borderRadius: RADIUS.pill },
  badgeText: { color: COLOR.bg, fontSize: TYPE.caption, fontFamily: FONT.bold },

  player: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  playerName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  playerAvg: { color: COLOR.ink, fontFamily: FONT.score, fontSize: 22 },

  empty: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', paddingVertical: SPACE[12] },
});
