import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { useTeamLineup, type LineupSlot } from '@/lib/team-admin';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const BOARDS = [1, 2, 3, 4];

// The published laguppställning for a match, read-only — what fans and opponents see
// on the public team page. Renders nothing unless a lineup has been published.
export function LineupDisplay({
  teamId,
  matchId,
  subtitle,
}: {
  teamId: number;
  matchId: number;
  subtitle?: string;
}) {
  const router = useRouter();
  const { data } = useTeamLineup(teamId, matchId);

  if (!data || data.status !== 'published' || data.slots.length === 0) return null;

  const starter = (bord: number, pos: number) =>
    data.slots.find((s) => !s.isReserve && s.bord === bord && s.pos === pos);
  const reserves = data.slots.filter((s) => s.isReserve).sort((a, b) => a.pos - b.pos);

  const open = (s?: LineupSlot) => s && router.push(`/player/${s.publicId}`);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.label}>LAGUPPSTÄLLNING</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>

      {BOARDS.map((bord) => (
        <View key={bord} style={styles.board}>
          <Text style={styles.bordLabel}>{bord}</Text>
          <View style={styles.pair}>
            {[1, 2].map((pos) => {
              const s = starter(bord, pos);
              return (
                <PressableScale key={pos} style={styles.player} onPress={() => open(s)} disabled={!s}>
                  {s ? (
                    <>
                      <IdentityAvatar colors={teamColor(s.name)} initials={teamInitials(s.name)} size={30} />
                      <Text style={styles.name} numberOfLines={1}>{s.name}</Text>
                    </>
                  ) : (
                    <Text style={styles.tbd}>—</Text>
                  )}
                </PressableScale>
              );
            })}
          </View>
        </View>
      ))}

      {reserves.length > 0 && (
        <Text style={styles.reserves} numberOfLines={2}>
          <Text style={styles.reservesKey}>Reserver: </Text>
          {reserves.map((r) => r.name).join(', ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: SPACE[3] },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  subtitle: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, flexShrink: 1, marginLeft: SPACE[3] },

  board: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginBottom: SPACE[2] },
  bordLabel: { width: 20, color: COLOR.ink4, fontFamily: FONT.display, fontSize: 18, textAlign: 'center' },
  pair: { flex: 1, flexDirection: 'row', gap: SPACE[3] },
  player: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[2],
    minHeight: 46,
  },
  name: { flex: 1, color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  tbd: { color: COLOR.ink4, fontSize: TYPE.body },
  reserves: { color: COLOR.ink2, fontSize: TYPE.caption, marginTop: SPACE[2], lineHeight: 19 },
  reservesKey: { color: COLOR.ink3, fontFamily: FONT.bold },
});
