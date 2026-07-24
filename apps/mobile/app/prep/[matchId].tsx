import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BallOrb } from '@/components/BallOrb';
import { GlassCircle } from '@/components/GlassButtons';
import { MatchBallPicker } from '@/components/MatchBallPicker';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import {
  useDeleteNote,
  useHallBalls,
  useHallNotes,
  useMatchBalls,
  useMatchNotes,
  usePrepMatch,
  useSaveNote,
  type MatchBall,
  type Note,
} from '@/lib/diary';
import { formatMatchDate, relativeMatchDate } from '@/lib/format';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export default function PrepPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matchId: raw } = useLocalSearchParams<{ matchId: string }>();
  const matchId = Number(raw);

  const { data: match } = usePrepMatch(matchId);
  const { data: matchNotes = [] } = useMatchNotes(matchId);
  const { data: hallNotes = [] } = useHallNotes(match?.hall);
  const { data: matchBalls = [] } = useMatchBalls(matchId);
  const { data: recallBalls = [] } = useHallBalls(match?.hall, matchId);
  const save = useSaveNote();
  const del = useDeleteNote();

  const [draft, setDraft] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  // Recall = notes from earlier visits to this center, not this match.
  const recall = hallNotes.filter((n) => n.matchId !== matchId);

  const submit = () => {
    const body = draft.trim();
    if (!body || !match) return;
    save.mutate(
      { body, matchId, hall: match.hall },
      { onSuccess: () => setDraft('') },
    );
  };

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.kicker}>MATCHFÖRBEREDELSE</Text>
        {match ? (
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
        ) : (
          <ActivityIndicator color={COLOR.ink3} style={{ marginTop: SPACE[6] }} />
        )}

        {/* Recall — the "served up" memory from earlier visits to this center */}
        {(recall.length > 0 || recallBalls.length > 0) && (
          <View style={styles.section}>
            <View style={styles.recallHead}>
              <Ionicons name="bookmark" size={16} color={COLOR.gold} />
              <Text style={styles.recallLabel}>SENAST PÅ {match?.hall?.toUpperCase()}</Text>
            </View>
            {recallBalls.length > 0 && (
              <View style={styles.recallBalls}>
                <Text style={styles.subLabel}>KLOT DU SPELAT HÄR</Text>
                <View style={styles.orbRow}>
                  {recallBalls.map((b) => (
                    <BallStack key={b.playerBallId} ball={b} />
                  ))}
                </View>
              </View>
            )}
            {recall.map((n) => (
              <NoteCard key={n.id} note={n} onDelete={() => del.mutate(n.id)} muted />
            ))}
          </View>
        )}

        {/* What I threw this match */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>KLOT DENNA MATCH</Text>
          <View style={styles.orbRow}>
            {matchBalls.map((b) => (
              <PressableScale key={b.rowId} onPress={() => setPickerOpen(true)}>
                <BallStack ball={b} />
              </PressableScale>
            ))}
            <PressableScale style={styles.orbCol} onPress={() => setPickerOpen(true)}>
              <View style={styles.addTile}>
                <Ionicons name="add" size={26} color={COLOR.ink3} />
              </View>
              <Text style={styles.orbName}>{matchBalls.length > 0 ? 'Ändra' : 'Lägg till'}</Text>
            </PressableScale>
          </View>
        </View>

        {/* Write a note for this match */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DINA ANTECKNINGAR</Text>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Vad vill du minnas? Banor, klot, oljebild, taktik…"
            placeholderTextColor={COLOR.ink4}
            multiline
            textAlignVertical="top"
          />
          <PressableScale
            style={[styles.save, (!draft.trim() || save.isPending) && styles.saveOff]}
            onPress={submit}
            disabled={!draft.trim() || save.isPending}
          >
            {save.isPending ? (
              <ActivityIndicator color={COLOR.bg} />
            ) : (
              <Text style={styles.saveText}>Spara anteckning</Text>
            )}
          </PressableScale>

          {matchNotes.map((n) => (
            <NoteCard key={n.id} note={n} onDelete={() => del.mutate(n.id)} />
          ))}
          {matchNotes.length === 0 && (
            <Text style={styles.empty}>Inga anteckningar för den här matchen än.</Text>
          )}
        </View>
      </ScrollView>

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>

      <MatchBallPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        matchId={matchId}
        hall={match?.hall ?? null}
      />
    </View>
  );
}

function BallStack({ ball }: { ball: MatchBall }) {
  return (
    <View style={styles.orbCol}>
      <BallOrb label={`${ball.brand ?? ''} ${ball.name}`} imageUrl={ball.imageUrl} size={56} />
      <Text style={styles.orbName} numberOfLines={1}>{ball.name}</Text>
    </View>
  );
}

function NoteCard({ note, onDelete, muted }: { note: Note; onDelete: () => void; muted?: boolean }) {
  return (
    <View style={[styles.note, muted && styles.noteMuted]}>
      <Text style={styles.noteBody}>{note.body}</Text>
      <View style={styles.noteFoot}>
        <Text style={styles.noteDate}>{formatMatchDate(note.createdAt.slice(0, 10))}</Text>
        <PressableScale onPress={onDelete} hitSlop={10}>
          <Ionicons name="trash-outline" size={18} color={COLOR.ink3} />
        </PressableScale>
      </View>
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

  section: { marginTop: SPACE[8] },
  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[3] },
  recallHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACE[3] },
  recallLabel: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.2, flexShrink: 1 },
  recallBalls: { marginBottom: SPACE[4] },
  subLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, marginBottom: SPACE[3] },

  orbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[4] },
  orbCol: { alignItems: 'center', width: 64, gap: 6 },
  orbName: { color: COLOR.ink, fontSize: TYPE.label, fontFamily: FONT.semibold, textAlign: 'center', maxWidth: 62 },
  addTile: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLOR.hairline,
    backgroundColor: COLOR.surface,
  },

  input: {
    backgroundColor: COLOR.surface2,
    borderRadius: RADIUS.md,
    padding: SPACE[4],
    minHeight: 96,
    color: COLOR.ink,
    fontSize: TYPE.body,
    lineHeight: 22,
  },
  save: { marginTop: SPACE[3], backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingVertical: SPACE[4], alignItems: 'center' },
  saveOff: { opacity: 0.5 },
  saveText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },
  empty: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: SPACE[4] },

  note: { marginTop: SPACE[3], padding: SPACE[4], borderRadius: RADIUS.md, backgroundColor: COLOR.surface },
  noteMuted: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLOR.hairline },
  noteBody: { color: COLOR.ink, fontSize: TYPE.body, lineHeight: 22 },
  noteFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACE[3] },
  noteDate: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
});
