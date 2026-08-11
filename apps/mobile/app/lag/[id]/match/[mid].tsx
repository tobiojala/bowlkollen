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

const OPTIONS: { key: AvailabilityResponse; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; tint: string }[] = [
  { key: 'yes', label: 'Ja', icon: 'checkmark', color: COLOR.green, tint: 'rgba(48,212,126,0.14)' },
  { key: 'maybe', label: 'Kanske', icon: 'help', color: COLOR.gold, tint: 'rgba(245,194,0,0.14)' },
  { key: 'no', label: 'Nej', icon: 'close', color: COLOR.red, tint: 'rgba(224,85,85,0.14)' },
];

type Filter = 'alla' | AvailabilityResponse | 'noreply';

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

  const responded = new Set(squad.map((r) => r.userId));
  const noReply = members.filter((m) => !responded.has(m.userId));

  // Comment: draft = null means "untouched, show the saved note"; '' means "cleared".
  const [draft, setDraft] = useState<string | null>(null);
  const noteShown = draft ?? mine?.note ?? '';

  const save = (response: AvailabilityResponse, noteText: string) =>
    setAvail.mutate({ response, note: noteText.trim() ? noteText.trim() : null });

  const choose = (response: AvailabilityResponse) => save(response, noteShown);
  const saveNote = () => {
    if (!mine || (draft ?? '') === (mine.note ?? '')) return;
    save(mine.response, draft ?? '');
  };
  const clearNote = () => {
    setDraft('');
    if (mine) save(mine.response, '');
  };

  const [filter, setFilter] = useState<Filter>('alla');
  const countOf = (k: AvailabilityResponse) => squad.filter((r) => r.response === k).length;
  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'alla', label: 'Alla', count: squad.length + noReply.length },
    { key: 'yes', label: 'Ja', count: countOf('yes') },
    { key: 'maybe', label: 'Kanske', count: countOf('maybe') },
    { key: 'no', label: 'Nej', count: countOf('no') },
    { key: 'noreply', label: 'Väntar', count: noReply.length },
  ];

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]} keyboardShouldPersistTaps="handled">
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
              {!!match.hall && (<><Text style={styles.metaDot}>·</Text><Text style={styles.meta} numberOfLines={1}>{match.hall}</Text></>)}
            </View>
          </>
        )}

        {role ? (
          <>
            <Text style={styles.sectionLabel}>KAN DU SPELA?</Text>
            <View style={styles.answerRow}>
              {OPTIONS.map((o) => (
                <AnswerCircle key={o.key} opt={o} on={mine?.response === o.key} onPress={() => choose(o.key)} />
              ))}
            </View>

            <View style={styles.noteWrap}>
              <TextInput
                style={styles.note}
                value={noteShown}
                onChangeText={setDraft}
                onBlur={saveNote}
                placeholder="Lägg till en kommentar — t.ex. kommer sent"
                placeholderTextColor={COLOR.ink4}
                editable={!!mine}
              />
              {noteShown.length > 0 && (
                <PressableScale style={styles.noteClear} onPress={clearNote} hitSlop={8} accessibilityLabel="Ta bort kommentar">
                  <Ionicons name="close" size={18} color={COLOR.ink3} />
                </PressableScale>
              )}
            </View>
            {!mine && <Text style={styles.noteHint}>Svara först för att lägga till en kommentar.</Text>}

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

            {/* Squad, filtered */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersInner}>
              {FILTERS.map((f) => {
                const on = filter === f.key;
                return (
                  <PressableScale key={f.key} style={[styles.chip, on && styles.chipOn]} onPress={() => setFilter(f.key)}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
                    <Text style={[styles.chipCount, on && styles.chipTextOn]}>{f.count}</Text>
                  </PressableScale>
                );
              })}
            </ScrollView>

            <SquadList filter={filter} squad={squad} noReply={noReply} onOpen={(pid) => router.push(`/player/${pid}`)} />

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

function AnswerCircle({ opt, on, onPress }: { opt: (typeof OPTIONS)[number]; on: boolean; onPress: () => void }) {
  return (
    <PressableScale style={styles.opt} onPress={onPress} accessibilityLabel={opt.label} accessibilityState={{ selected: on }}>
      <View style={[styles.ring, { borderColor: on ? opt.color : COLOR.surface2, backgroundColor: on ? opt.tint : COLOR.surface }]}>
        <Ionicons name={opt.icon} size={30} color={on ? opt.color : COLOR.ink3} />
      </View>
      <Text style={[styles.optLabel, on && styles.optLabelOn]}>{opt.label}</Text>
    </PressableScale>
  );
}

function SquadList({ filter, squad, noReply, onOpen }: {
  filter: Filter;
  squad: AvailabilityRow[];
  noReply: { userId: string; publicId: string | null; displayName: string; isMe?: boolean }[];
  onOpen: (publicId: string) => void;
}) {
  const person = (name: string, pid: string | null, note: string | null, suffix: string) => (
    <PressableScale key={pid ?? name} style={styles.squadRow} onPress={() => pid && onOpen(pid)} disabled={!pid}>
      <IdentityAvatar colors={teamColor(name)} initials={teamInitials(name)} size={36} />
      <View style={styles.squadText}>
        <Text style={styles.squadName} numberOfLines={1}>{name}{suffix}</Text>
        {!!note && <Text style={styles.squadNote} numberOfLines={1}>{note}</Text>}
      </View>
    </PressableScale>
  );

  if (filter === 'noreply') return <View style={styles.group}>{noReply.map((m) => person(m.displayName, m.publicId, null, m.isMe ? ' (du)' : ''))}</View>;
  if (filter !== 'alla') return <View style={styles.group}>{squad.filter((r) => r.response === filter).map((r) => person(r.displayName, r.publicId, r.note, ''))}</View>;

  // Alla → grouped
  return (
    <>
      {OPTIONS.map((o) => {
        const rows = squad.filter((r) => r.response === o.key);
        if (!rows.length) return null;
        return (
          <View key={o.key} style={styles.group}>
            <Text style={[styles.groupLabel, { color: o.color }]}>{o.label.toUpperCase()} · {rows.length}</Text>
            {rows.map((r) => person(r.displayName, r.publicId, r.note, ''))}
          </View>
        );
      })}
      {noReply.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>VÄNTAR · {noReply.length}</Text>
          {noReply.map((m) => person(m.displayName, m.publicId, null, m.isMe ? ' (du)' : ''))}
        </View>
      )}
    </>
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

  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginTop: SPACE[8], marginBottom: SPACE[4] },
  answerRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACE[8] },
  opt: { alignItems: 'center', gap: SPACE[2] },
  ring: { width: 66, height: 66, borderRadius: 33, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  optLabel: { color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.bold },
  optLabelOn: { color: COLOR.ink },

  noteWrap: { flexDirection: 'row', alignItems: 'center', marginTop: SPACE[4], backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4] },
  note: { flex: 1, paddingVertical: SPACE[4], color: COLOR.ink, fontSize: TYPE.body },
  noteClear: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  noteHint: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: SPACE[2] },

  lineupBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[8], padding: SPACE[4], borderRadius: RADIUS.lg, backgroundColor: 'rgba(245,194,0,0.08)', borderWidth: 1, borderColor: 'rgba(245,194,0,0.24)' },
  lineupText: { flex: 1, minWidth: 0, gap: 2 },
  lineupTitle: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  lineupBody: { color: COLOR.ink3, fontSize: TYPE.caption, lineHeight: 18 },

  filters: { marginTop: SPACE[8], marginHorizontal: -SPACE[6] },
  filtersInner: { paddingHorizontal: SPACE[6], gap: SPACE[2] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], borderRadius: RADIUS.md, backgroundColor: COLOR.surface },
  chipOn: { backgroundColor: COLOR.surface2 },
  chipText: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.bold },
  chipTextOn: { color: COLOR.ink },
  chipCount: { color: COLOR.ink4, fontSize: TYPE.caption, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },

  group: { marginTop: SPACE[4] },
  groupLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.2, marginBottom: SPACE[2] },
  squadRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLOR.surface2 },
  squadText: { flex: 1, minWidth: 0 },
  squadName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  squadNote: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
