import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { candidateFit, type AvailabilityResponse, type LineupCandidate } from '@/lib/team-admin';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, TYPE } from '@/theme';

const AVAIL: Record<AvailabilityResponse, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  yes: { label: 'Ja', icon: 'checkmark-circle', color: COLOR.green },
  maybe: { label: 'Kanske', icon: 'help-circle', color: COLOR.gold },
  no: { label: 'Nej', icon: 'close-circle', color: COLOR.red },
};

// A context-aware candidate row for the laguttagning: avg at THIS center leads
// (falling back to division → overall), plus career highlights (bäst i / squad)
// and the availability answer. Used in the ranked list and the seat picker.
export function CandidateRow({ c, hall, onPress }: { c: LineupCandidate; hall: string | null; onPress: () => void }) {
  const fit = candidateFit(c);
  const a = c.availability ? AVAIL[c.availability] : null;

  const contextLabel =
    fit.context === 'venue' ? `${(hall ?? 'HÄR').toUpperCase()} · ${c.venueGames} matcher`
    : fit.context === 'division' ? `DIVISIONEN · ${c.divisionGames} matcher`
    : c.overallGames > 0 ? `SNITT · ${c.overallGames} matcher`
    : 'INGEN DATA';

  return (
    <PressableScale style={styles.card} onPress={onPress}>
      <IdentityAvatar colors={teamColor(c.name)} initials={teamInitials(c.name)} size={44} />
      <View style={styles.mid}>
        <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
        <Text style={styles.context}>{contextLabel}</Text>
        {c.bestVenue && (
          <Text style={styles.insight} numberOfLines={1}>
            <Text style={styles.insightKey}>★ Bäst: </Text>{c.bestVenue.name} {c.bestVenue.avg}
          </Text>
        )}
        {c.bestSquad && (
          <Text style={styles.insight} numberOfLines={1}>
            <Text style={styles.insightKey}>Lag: </Text>{c.bestSquad.name} {c.bestSquad.avg}
          </Text>
        )}
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
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  mid: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  context: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.8, marginTop: 2 },
  insight: { color: COLOR.ink2, fontSize: TYPE.caption, marginTop: 2 },
  insightKey: { color: COLOR.ink3, fontFamily: FONT.bold },
  right: { alignItems: 'flex-end', gap: 3, minWidth: 64 },
  lead: { color: COLOR.ink, fontFamily: FONT.display, fontSize: 26, letterSpacing: -0.5 },
  avail: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  availText: { fontSize: TYPE.label, fontFamily: FONT.bold },
  availUnknown: { color: COLOR.ink4, fontSize: TYPE.label, fontFamily: FONT.semibold },
});
