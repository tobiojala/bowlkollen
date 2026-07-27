import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { candidateFit, playsDown, type AvailabilityResponse, type LineupCandidate } from '@/lib/team-admin';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, TYPE } from '@/theme';

const AVAIL: Record<AvailabilityResponse, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  yes: { label: 'Ja', icon: 'checkmark-circle', color: COLOR.green },
  maybe: { label: 'Kanske', icon: 'help-circle', color: COLOR.gold },
  no: { label: 'Nej', icon: 'close-circle', color: COLOR.red },
};

// A context-aware candidate row for the laguttagning: avg at THIS center leads
// (falling back to division → overall), plus career highlights (bäst i / squad)
// and the availability answer. Used in the ranked list and the seat picker.
export function CandidateRow({
  c,
  hall,
  matchDivision,
  onPress,
}: {
  c: LineupCandidate;
  hall: string | null;
  matchDivision?: string | null;
  onPress: () => void;
}) {
  const fit = candidateFit(c);
  const a = c.availability ? AVAIL[c.availability] : null;
  const down = playsDown(c.homeDivision, matchDivision ?? null);

  const contextLabel =
    fit.context === 'venue' ? `${(hall ?? 'HÄR').toUpperCase()} · ${c.venueGames} matcher`
    : fit.context === 'division' ? `DIVISIONEN · ${c.divisionGames} matcher`
    : c.overallGames > 0 ? `SNITT · ${c.overallGames} matcher`
    : 'INGEN DATA';

  // Availability as a scannable colour: an accent bar per answered player, and a
  // dimmed card for those who've said no (still pickable — the captain decides).
  const accent = a ? a.color : 'transparent';

  return (
    <PressableScale style={[styles.card, c.availability === 'no' && styles.cardOut]} onPress={onPress}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <IdentityAvatar colors={teamColor(c.name)} initials={teamInitials(c.name)} size={44} />
      <View style={styles.mid}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
          {down && (
            <View style={styles.badge}>
              <Ionicons name="swap-vertical" size={11} color={COLOR.ink2} />
              <Text style={styles.badgeText}>NEDFLYTTAD</Text>
            </View>
          )}
        </View>
        <Text style={styles.context}>{contextLabel}</Text>
        {c.bestVenue && (
          <Text style={styles.insight} numberOfLines={1}>
            <Text style={styles.insightKey}>★ Bäst: </Text>{c.bestVenue.name} {c.bestVenue.avg}
          </Text>
        )}
        {c.bestDivision && (
          <Text style={styles.insight} numberOfLines={1}>
            <Text style={styles.insightKey}>Div: </Text>{c.bestDivision.name} {c.bestDivision.avg}
          </Text>
        )}
        {c.homeTeam && (
          <Text style={styles.insight} numberOfLines={1}>
            <Text style={styles.insightKey}>Mest: </Text>{c.homeTeam}{c.homeDivision ? ` · ${c.homeDivision}` : ''}
          </Text>
        )}
        {down && <Text style={styles.sparrNote} numberOfLines={1}>Kontrollera spärr · § D 306</Text>}
      </View>
      <View style={styles.right}>
        <Text style={styles.lead}>{fit.value != null ? fit.value : '–'}</Text>
        {a ? (
          <View style={styles.avail}>
            <Ionicons name={a.icon} size={14} color={a.color} />
            <Text style={[styles.availText, { color: a.color }]}>{a.label}</Text>
          </View>
        ) : (
          <Text style={styles.availUnknown}>Ej svarat</Text>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  cardOut: { opacity: 0.5 },
  accent: { width: 4, height: 38, borderRadius: 2 },
  mid: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
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
  badgeText: { color: COLOR.ink2, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.5 },
  context: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.8, marginTop: 2 },
  insight: { color: COLOR.ink2, fontSize: TYPE.caption, marginTop: 2 },
  insightKey: { color: COLOR.ink3, fontFamily: FONT.bold },
  sparrNote: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 3, minWidth: 64 },
  lead: { color: COLOR.ink, fontFamily: FONT.display, fontSize: 26, letterSpacing: -0.5 },
  avail: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  availText: { fontSize: TYPE.label, fontFamily: FONT.bold },
  availUnknown: { color: COLOR.ink4, fontSize: TYPE.label, fontFamily: FONT.semibold },
});
