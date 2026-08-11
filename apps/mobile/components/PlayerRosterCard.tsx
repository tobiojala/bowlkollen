import { StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// A squad member as a card (not a list row): identity avatar, name, and snitt +
// games. Doorway to the full player profile. Long names shrink, never truncate.
export function PlayerRosterCard({
  name,
  average,
  appearances,
  onPress,
}: {
  name: string;
  average: number | null;
  appearances: number;
  onPress?: () => void;
}) {
  return (
    <PressableScale style={styles.card} onPress={onPress} disabled={!onPress}>
      <IdentityAvatar colors={teamColor(name)} initials={teamInitials(name)} size={48} />
      <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
        {name}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.avg}>{average != null ? average : '–'}</Text>
        <Text style={styles.matcher}>
          snitt · {appearances} {appearances === 1 ? 'match' : 'matcher'}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACE[4],
    paddingHorizontal: SPACE[3],
    alignItems: 'center',
    gap: SPACE[2],
  },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold, textAlign: 'center', letterSpacing: -0.2 },
  meta: { alignItems: 'center', gap: 1 },
  avg: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  matcher: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.medium },
});
