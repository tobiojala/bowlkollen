import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CandidateRow } from '@/components/CandidateRow';
import { GlassCircle } from '@/components/GlassButtons';
import { GlassSheet } from '@/components/GlassSheet';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { usePrepMatch } from '@/lib/diary';
import { formatMatchDate, relativeMatchDate } from '@/lib/format';
import { teamColor, teamInitials } from '@/lib/team-identity';
import {
  useLineupCandidates,
  useRosterSearch,
  useSaveLineup,
  useTeamLineup,
  type LineupSlot,
} from '@/lib/team-admin';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const BOARDS = [1, 2, 3, 4]; // banpar
const STARTERS = 8;

type Target = { bord: number; pos: number; isReserve: boolean };

export default function Laguttagning() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, mid } = useLocalSearchParams<{ id: string; mid: string }>();
  const teamId = Number(id);
  const matchId = Number(mid);

  const { data: match } = usePrepMatch(matchId);
  const { data: candidates = [] } = useLineupCandidates(teamId, matchId);
  const { data: existing } = useTeamLineup(teamId, matchId);
  const save = useSaveLineup(teamId, matchId);

  const hall = match?.hall ?? null;
  const [slots, setSlots] = useState<LineupSlot[]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 220);
    return () => clearTimeout(t);
  }, [query]);
  const { data: searchHits = [] } = useRosterSearch(debounced);
  const seeded = useRef(false);

  // Seed the board from the saved lineup once it arrives.
  useEffect(() => {
    if (!seeded.current && existing) {
      setSlots(existing.slots);
      seeded.current = true;
    }
  }, [existing]);

  const starter = (bord: number, pos: number) => slots.find((s) => !s.isReserve && s.bord === bord && s.pos === pos);
  const reserves = slots.filter((s) => s.isReserve).sort((a, b) => a.pos - b.pos);
  const starterCount = slots.filter((s) => !s.isReserve).length;
  const seated = new Set(slots.map((s) => s.publicId));

  const assign = (publicId: string, name: string) => {
    if (!target) return;
    setSlots((prev) => {
      let next = prev.filter((s) => s.publicId !== publicId); // no dupes across seats
      if (target.isReserve) {
        const pos = Math.max(0, ...next.filter((s) => s.isReserve).map((s) => s.pos)) + 1;
        next.push({ publicId, name, bord: 0, pos, isReserve: true });
      } else {
        next = next.filter((s) => !(!s.isReserve && s.bord === target.bord && s.pos === target.pos));
        next.push({ publicId, name, bord: target.bord, pos: target.pos, isReserve: false });
      }
      return next;
    });
    setTarget(null);
    setQuery('');
  };

  const shareLineup = () => {
    const line = (b: number) => `Banpar ${b}: ${starter(b, 1)?.name ?? '—'} / ${starter(b, 2)?.name ?? '—'}`;
    const head = match ? `Laguppställning – ${match.homeName} mot ${match.awayName}` : 'Laguppställning';
    const when = match ? `${formatMatchDate(match.date)}${hall ? ` · ${hall}` : ''}` : '';
    const body = [head, when, '', ...BOARDS.map(line)];
    if (reserves.length) body.push('', `Reserver: ${reserves.map((r) => r.name).join(', ')}`);
    Share.share({ message: body.filter((l) => l !== undefined).join('\n') }).catch(() => {});
  };

  const remove = (publicId: string) => setSlots((prev) => prev.filter((s) => s.publicId !== publicId));

  const pickList = candidates.filter((c) => !seated.has(c.publicId));

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

        <View style={styles.counterRow}>
          <Text style={styles.counter}>{starterCount}/{STARTERS} placerade</Text>
          {existing?.status === 'published' && <Text style={styles.published}>PUBLICERAD</Text>}
        </View>

        {BOARDS.map((bord) => (
          <View key={bord} style={styles.board}>
            <Text style={styles.boardLabel}>BANPAR {bord}</Text>
            <View style={styles.seatRow}>
              {[1, 2].map((pos) => {
                const s = starter(bord, pos);
                return (
                  <Seat
                    key={pos}
                    slot={s}
                    onAdd={() => setTarget({ bord, pos, isReserve: false })}
                    onRemove={s ? () => remove(s.publicId) : undefined}
                  />
                );
              })}
            </View>
          </View>
        ))}

        <Text style={styles.boardLabel}>RESERVER</Text>
        <View style={styles.reserveWrap}>
          {reserves.map((s) => (
            <Seat key={s.publicId} slot={s} compact onAdd={() => {}} onRemove={() => remove(s.publicId)} />
          ))}
          <Seat compact onAdd={() => setTarget({ bord: 0, pos: 0, isReserve: true })} />
        </View>

        <PressableScale style={styles.draft} onPress={() => save.mutate({ slots, publish: false })} disabled={save.isPending}>
          <Text style={styles.draftText}>Spara utkast</Text>
        </PressableScale>
        <PressableScale
          style={[styles.publish, (starterCount !== STARTERS || save.isPending) && styles.publishOff]}
          onPress={() => save.mutate({ slots, publish: true })}
          disabled={starterCount !== STARTERS || save.isPending}
        >
          {save.isPending ? <ActivityIndicator color={COLOR.bg} /> : <Text style={styles.publishText}>Publicera laguppställning</Text>}
        </PressableScale>
        {starterCount !== STARTERS && (
          <Text style={styles.publishHint}>Fyll alla {STARTERS} platser för att publicera.</Text>
        )}

        {starterCount > 0 && (
          <PressableScale style={styles.share} onPress={shareLineup}>
            <Ionicons name="share-outline" size={20} color={COLOR.ink2} />
            <Text style={styles.shareText}>Dela laguppställning</Text>
          </PressableScale>
        )}
      </ScrollView>

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>

      <GlassSheet
        visible={!!target}
        onClose={() => { setTarget(null); setQuery(''); }}
        title={target?.isReserve ? 'Välj reserv' : `Banpar ${target?.bord} · plats ${target?.pos}`}
      >
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Sök spelare att lägga till…"
          placeholderTextColor={COLOR.ink4}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: SPACE[8] }}>
          {debounced.trim().length >= 2 ? (
            <>
              {searchHits.filter((p) => !seated.has(p.publicId)).map((p) => (
                <PressableScale key={p.publicId} style={styles.hit} onPress={() => assign(p.publicId, p.name)}>
                  <IdentityAvatar colors={teamColor(p.name)} initials={teamInitials(p.name)} size={40} />
                  <View style={styles.hitText}>
                    <Text style={styles.hitName} numberOfLines={1}>{p.name}</Text>
                    {!!p.club && <Text style={styles.hitClub} numberOfLines={1}>{p.club}</Text>}
                  </View>
                  <Ionicons name="add-circle" size={22} color={COLOR.gold} />
                </PressableScale>
              ))}
            </>
          ) : (
            <>
              {pickList.map((c) => (
                <CandidateRow key={c.publicId} c={c} hall={hall} matchDivision={match?.division} onPress={() => assign(c.publicId, c.name)} />
              ))}
              <Text style={styles.pickerHint}>Söker du någon som inte är med i laget i appen? Sök på namn ovan.</Text>
            </>
          )}
        </ScrollView>
      </GlassSheet>
    </View>
  );
}

function Seat({
  slot,
  onAdd,
  onRemove,
  compact,
}: {
  slot?: LineupSlot;
  onAdd?: () => void;
  onRemove?: () => void;
  compact?: boolean;
}) {
  if (!slot) {
    return (
      <PressableScale style={[styles.seat, styles.seatEmpty, compact && styles.seatCompact]} onPress={onAdd}>
        <Ionicons name="add" size={compact ? 22 : 26} color={COLOR.ink3} />
      </PressableScale>
    );
  }
  return (
    <View style={[styles.seat, styles.seatFilled, compact && styles.seatCompact]}>
      <IdentityAvatar colors={teamColor(slot.name)} initials={teamInitials(slot.name)} size={compact ? 30 : 34} />
      <Text style={styles.seatName} numberOfLines={1}>{slot.name}</Text>
      <PressableScale onPress={onRemove} hitSlop={8}>
        <Ionicons name="close-circle" size={20} color={COLOR.ink4} />
      </PressableScale>
    </View>
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

  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACE[6], marginBottom: SPACE[3] },
  counter: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  published: { color: COLOR.green, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },

  board: { marginBottom: SPACE[3] },
  boardLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.2, marginBottom: SPACE[2], marginTop: SPACE[2] },
  seatRow: { flexDirection: 'row', gap: SPACE[3] },
  seat: { flex: 1, borderRadius: RADIUS.md, minHeight: 60, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: SPACE[2], paddingHorizontal: SPACE[3] },
  seatCompact: { flex: 0, minWidth: 150, minHeight: 52 },
  seatEmpty: { borderWidth: 1, borderStyle: 'dashed', borderColor: COLOR.hairline, backgroundColor: COLOR.surface },
  seatFilled: { backgroundColor: COLOR.surface },
  seatName: { flex: 1, color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.semibold },

  reserveWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3], marginBottom: SPACE[4] },

  draft: { marginTop: SPACE[6], borderWidth: 1, borderColor: COLOR.hairline, borderRadius: RADIUS.md, paddingVertical: SPACE[4], alignItems: 'center' },
  draftText: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.bold },
  publish: { marginTop: SPACE[3], backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingVertical: SPACE[4], alignItems: 'center' },
  publishOff: { opacity: 0.4 },
  publishText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },
  publishHint: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', marginTop: SPACE[2] },
  share: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[2], marginTop: SPACE[4], paddingVertical: SPACE[3] },
  shareText: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.bold },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', paddingVertical: SPACE[6] },

  search: { backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], color: COLOR.ink, fontSize: TYPE.body, marginBottom: SPACE[3] },
  hit: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  hitText: { flex: 1, minWidth: 0 },
  hitName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  hitClub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  pickerHint: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', paddingVertical: SPACE[6], lineHeight: 18 },
});
