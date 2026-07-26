import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { usePrepMatch } from '@/lib/diary';
import { formatMatchDate, relativeMatchDate } from '@/lib/format';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { candidateFit, useLineupCandidates, type AvailabilityResponse, type LineupCandidate } from '@/lib/team-admin';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const AVAIL: Record<AvailabilityResponse, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  yes: { label: 'Ja', icon: 'checkmark-circle', color: COLOR.green },
  maybe: { label: 'Kanske', icon: 'help-circle', color: COLOR.gold },
  no: { label: 'Nej', icon: 'close-circle', color: COLOR.red },
};

export default function Laguttagning() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, mid } = useLocalSearchParams<{ id: string; mid: string }>();
  const teamId = Number(id);
  const matchId = Number(mid);

  const { data: match } = usePrepMatch(matchId);
  const { data: candidates = [] } = useLineupCandidates(teamId, matchId);

  const hall = match?.hall ?? null;

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}>
        <Text style={styles.kicker}>LAGUTTAGNING</Text>
        {match && (
          <>
            <Text style={styles.h1} numberOfLines={2}>
              {match.homeName} <Text style={styles.vs}>–</Text> {match.awayName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaStrong}>{relativeMatchDate(match.date)}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.meta}>{formatMatchDate(match.date)}</Text>
              {!!hall && (<><Text style={styles.metaDot}>·</Text><Text style={styles.meta} numberOfLines={1}>{hall}</Text></>)}
            </View>
          </>
        )}

        <Text style={styles.explain}>
          Rankad efter tillgänglighet och hur spelarna presterat {hall ? `i ${hall}` : 'i den här divisionen'}.
        </Text>

        {candidates.map((c) => (
          <CandidateRow key={c.publicId} c={c} hall={hall} onPress={() => router.push(`/player/${c.publicId}`)} />
        ))}
        {candidates.length === 0 && <Text style={styles.empty}>Inga spelare hittades för laget.</Text>}
      </ScrollView>

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function CandidateRow({ c, hall, onPress }: { c: LineupCandidate; hall: string | null; onPress: () => void }) {
  const fit = candidateFit(c);
  const a = c.availability ? AVAIL[c.availability] : null;

  // The context line under the big number: which split we're leading with + count.
  const contextLabel =
    fit.context === 'venue' ? `${(hall ?? 'HÄR').toUpperCase()} · ${c.venueGames} matcher`
    : fit.context === 'division' ? `DIVISIONEN · ${c.divisionGames} matcher`
    : c.overallGames > 0 ? `SNITT · ${c.overallGames} matcher`
    : 'INGEN DATA';

  // Secondary splits worth showing beside the lead.
  const secondary = [
    fit.context !== 'division' && c.divisionAvg != null ? `Div ${c.divisionAvg}` : null,
    fit.context !== 'overall' && c.overallAvg != null ? `Snitt ${c.overallAvg}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <PressableScale style={styles.card} onPress={onPress}>
      <IdentityAvatar colors={teamColor(c.name)} initials={teamInitials(c.name)} size={44} />
      <View style={styles.mid}>
        <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
        <Text style={styles.context}>{contextLabel}</Text>
        {!!secondary && <Text style={styles.secondary} numberOfLines={1}>{secondary}</Text>}
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
  safe: { flex: 1, backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[16] },

  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 2, fontFamily: FONT.bold, letterSpacing: -0.4, lineHeight: 30 },
  vs: { color: COLOR.ink3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACE[2], flexWrap: 'wrap' },
  metaStrong: { color: COLOR.gold, fontSize: TYPE.caption, fontFamily: FONT.bold },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, flexShrink: 1 },
  metaDot: { color: COLOR.ink4, fontSize: TYPE.caption },
  explain: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: SPACE[4], marginBottom: SPACE[3], lineHeight: 18 },

  card: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  mid: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  context: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.8, marginTop: 2 },
  secondary: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  right: { alignItems: 'flex-end', gap: 3, minWidth: 64 },
  lead: { color: COLOR.ink, fontFamily: FONT.display, fontSize: 26, letterSpacing: -0.5 },
  avail: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  availText: { fontSize: TYPE.label, fontFamily: FONT.bold },
  availUnknown: { color: COLOR.ink4, fontSize: TYPE.label, fontFamily: FONT.semibold },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
