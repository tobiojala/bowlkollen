import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { usePrepMatch } from '@/lib/diary';
import { formatMatchDate, relativeMatchDate } from '@/lib/format';
import { teamColor, teamInitials } from '@/lib/team-identity';
import {
  useMyAvailability,
  useMyTeamRole,
  useSetAvailability,
  useTeamAvailability,
  useTeamMembers,
  type AvailabilityResponse,
  type AvailabilityRow,
} from '@/lib/team-admin';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const OPTIONS: { key: AvailabilityResponse; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'yes', label: 'Ja', icon: 'checkmark-circle', color: COLOR.green },
  { key: 'maybe', label: 'Kanske', icon: 'help-circle', color: COLOR.gold },
  { key: 'no', label: 'Nej', icon: 'close-circle', color: COLOR.red },
];

const GROUPS: { key: AvailabilityResponse; label: string }[] = [
  { key: 'yes', label: 'SPELAR' },
  { key: 'maybe', label: 'KANSKE' },
  { key: 'no', label: 'SPELAR INTE' },
];

export default function MatchAdmin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, mid } = useLocalSearchParams<{ id: string; mid: string }>();
  const teamId = Number(id);
  const matchId = Number(mid);

  const { data: match } = usePrepMatch(matchId);
  const { data: role } = useMyTeamRole(teamId);
  const { data: mine } = useMyAvailability(teamId, matchId);
  const { data: squad = [] } = useTeamAvailability(teamId, matchId, !!role);
  const { data: members = [] } = useTeamMembers(teamId);
  const setAvail = useSetAvailability(teamId, matchId);

  // The nudge: verified members who haven't answered yet.
  const responded = new Set(squad.map((r) => r.userId));
  const noReply = members.filter((m) => !responded.has(m.userId));

  const [note, setNote] = useState('');
  const noteValue = note || mine?.note || '';

  const choose = (response: AvailabilityResponse) =>
    setAvail.mutate({ response, note: (note || mine?.note) ?? null });

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.kicker}>NÄRVARO</Text>
        {match && (
          <>
            <Text style={styles.h1} numberOfLines={2}>
              {match.homeName} <Text style={styles.vs}>–</Text> {match.awayName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaStrong}>{relativeMatchDate(match.date)}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.meta}>{formatMatchDate(match.date)}</Text>
              {!!match.hall && (
                <>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.meta} numberOfLines={1}>{match.hall}</Text>
                </>
              )}
            </View>
          </>
        )}

        {role ? (
          <>
            {/* My answer */}
            <Text style={styles.sectionLabel}>KAN DU SPELA?</Text>
            <View style={styles.options}>
              {OPTIONS.map((o) => {
                const on = mine?.response === o.key;
                return (
                  <PressableScale
                    key={o.key}
                    style={[styles.option, on && { backgroundColor: o.color, borderColor: o.color }]}
                    onPress={() => choose(o.key)}
                  >
                    <Ionicons name={o.icon} size={26} color={on ? COLOR.bg : o.color} />
                    <Text style={[styles.optionText, on && styles.optionTextOn]}>{o.label}</Text>
                  </PressableScale>
                );
              })}
            </View>
            <TextInput
              style={styles.note}
              value={noteValue}
              onChangeText={setNote}
              onBlur={() => (note || '') !== (mine?.note || '') && mine && choose(mine.response)}
              placeholder="Kommentar (valfritt) — t.ex. kommer sent"
              placeholderTextColor={COLOR.ink4}
            />

            {/* Captain: laguttagning (contextual lineup tool) */}
            {role === 'captain' && (
              <PressableScale style={styles.lineupBtn} onPress={() => router.push(`/lag/${teamId}/laguttagning/${matchId}`)}>
                <Ionicons name="clipboard" size={22} color={COLOR.gold} />
                <View style={styles.lineupText}>
                  <Text style={styles.lineupTitle}>Laguttagning</Text>
                  <Text style={styles.lineupBody}>Se vem som presterar bäst här — och sätt laget.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLOR.ink3} />
              </PressableScale>
            )}

            {/* The squad */}
            {GROUPS.map((g) => {
              const rows = squad.filter((r) => r.response === g.key);
              if (rows.length === 0) return null;
              return (
                <View key={g.key} style={styles.group}>
                  <Text style={styles.groupLabel}>{g.label} · {rows.length}</Text>
                  {rows.map((r) => (
                    <SquadRow key={r.userId} row={r} onPress={() => r.publicId && router.push(`/player/${r.publicId}`)} />
                  ))}
                </View>
              );
            })}
            {noReply.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>HAR INTE SVARAT · {noReply.length}</Text>
                {noReply.map((m) => (
                  <PressableScale
                    key={m.userId}
                    style={styles.squadRow}
                    onPress={() => m.publicId && router.push(`/player/${m.publicId}`)}
                    disabled={!m.publicId}
                  >
                    <IdentityAvatar colors={teamColor(m.displayName)} initials={teamInitials(m.displayName)} size={36} />
                    <Text style={[styles.squadName, { flex: 1 }]} numberOfLines={1}>{m.displayName}{m.isMe ? ' (du)' : ''}</Text>
                  </PressableScale>
                ))}
              </View>
            )}
            {squad.length === 0 && noReply.length === 0 && <Text style={styles.empty}>Ingen har svarat än. Bli först!</Text>}
          </>
        ) : (
          <Text style={styles.empty}>Bara lagets medlemmar kan svara på närvaro.</Text>
        )}
      </ScrollView>

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function SquadRow({ row, onPress }: { row: AvailabilityRow; onPress: () => void }) {
  return (
    <PressableScale style={styles.squadRow} onPress={onPress} disabled={!row.publicId}>
      <IdentityAvatar colors={teamColor(row.displayName)} initials={teamInitials(row.displayName)} size={36} />
      <View style={styles.squadText}>
        <Text style={styles.squadName} numberOfLines={1}>{row.displayName}</Text>
        {!!row.note && <Text style={styles.squadNote} numberOfLines={1}>{row.note}</Text>}
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

  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginTop: SPACE[8], marginBottom: SPACE[3] },
  options: { flexDirection: 'row', gap: SPACE[3] },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACE[4],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLOR.hairline,
    backgroundColor: COLOR.surface,
  },
  optionText: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.bold },
  optionTextOn: { color: COLOR.bg },
  note: { marginTop: SPACE[3], backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[4], color: COLOR.ink, fontSize: TYPE.body },

  lineupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    marginTop: SPACE[8],
    padding: SPACE[4],
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(245,194,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.24)',
  },
  lineupText: { flex: 1, minWidth: 0, gap: 2 },
  lineupTitle: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  lineupBody: { color: COLOR.ink3, fontSize: TYPE.caption, lineHeight: 18 },

  group: { marginTop: SPACE[8] },
  groupLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.2, marginBottom: SPACE[2] },
  squadRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  squadText: { flex: 1, minWidth: 0 },
  squadName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  squadNote: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
