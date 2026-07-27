import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { candidateFit, playsDown, type AvailabilityResponse, type LineupCandidate } from '@/lib/team-admin';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, TYPE } from '@/theme';

const AVAIL: Record<AvailabilityResponse, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  yes: { label: 'Kan spela', icon: 'checkmark-circle', color: COLOR.green },
  maybe: { label: 'Kanske', icon: 'help-circle', color: COLOR.gold },
  no: { label: 'Kan inte', icon: 'close-circle', color: COLOR.red },
};

// One clearly-labelled headline number ("SNITT HÄR" at this centre, falling back to the
// division / total), a big availability pill, and plain-Swedish supporting lines. Built
// for older eyes: nothing meaningful below 14px, generous sizes, meaning never colour-only.
export function CandidateRow({
  c,
  onPress,
  matchDivision,
}: {
  c: LineupCandidate;
  onPress: () => void;
  hall?: string | null;
  matchDivision?: string | null;
}) {
  const fit = candidateFit(c);
  const a = c.availability ? AVAIL[c.availability] : null;
  const down = playsDown(c.homeDivision, matchDivision ?? null);

  const headLabel =
    fit.value == null ? 'Ingen data'
    : fit.context === 'venue' ? 'Snitt här'
    : fit.context === 'division' ? 'I divisionen'
    : 'Snitt totalt';
  // Show the overall snitt as a second line only when the headline isn't already it.
  const showTotal = fit.context !== 'overall' && c.overallAvg != null;

  return (
    <PressableScale style={styles.card} onPress={onPress}>
      <IdentityAvatar colors={teamColor(c.name)} initials={teamInitials(c.name)} size={48} />

      <View style={styles.mid}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
          {down && (
            <View style={styles.badge}>
              <Ionicons name="swap-vertical" size={13} color={COLOR.ink2} />
              <Text style={styles.badgeText}>NEDFLYTTAD</Text>
            </View>
          )}
        </View>

        <View style={[styles.pill, a ? { backgroundColor: a.color } : styles.pillUnknown]}>
          <Ionicons name={a ? a.icon : 'ellipse-outline'} size={16} color={a ? COLOR.bg : COLOR.ink3} />
          <Text style={[styles.pillText, a ? { color: COLOR.bg } : { color: COLOR.ink2 }]}>
            {a ? a.label : 'Ej svarat'}
          </Text>
        </View>

        {!!c.homeTeam && <Text style={styles.sub} numberOfLines={1}>Spelar mest i {c.homeTeam}</Text>}
        {showTotal && <Text style={styles.sub} numberOfLines={1}>Snitt totalt {c.overallAvg}</Text>}
        {down && <Text style={styles.sub} numberOfLines={1}>Kontrollera spärr · § D 306</Text>}
      </View>

      <View style={styles.stat}>
        <Text style={styles.statValue}>{fit.value != null ? fit.value : '–'}</Text>
        <Text style={styles.statLabel} numberOfLines={2}>{headLabel}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  mid: { flex: 1, minWidth: 0, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, color: COLOR.ink, fontSize: 18, fontFamily: FONT.bold },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLOR.ink4,
    backgroundColor: COLOR.surface2,
  },
  badgeText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.bold, letterSpacing: 0.4 },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  pillUnknown: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLOR.ink4 },
  pillText: { fontSize: TYPE.caption, fontFamily: FONT.bold },

  sub: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.medium },

  stat: { alignItems: 'center', width: 78 },
  statValue: { color: COLOR.ink, fontFamily: FONT.display, fontSize: 32, letterSpacing: -0.5 },
  statLabel: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold, textAlign: 'center', marginTop: 1 },
});
