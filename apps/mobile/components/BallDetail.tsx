import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BallOrb } from '@/components/BallOrb';
import { PressableScale } from '@/components/PressableScale';
import { useDeleteBall, useUpdateBall, type BagBall } from '@/lib/balls';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// The tap-through sheet for one ball: catalog specs (read-only) + the player's own
// facts (surface, notes) which they can edit inline, plus retire / remove.
export function BallDetail({ ball, onClose }: { ball: BagBall; onClose: () => void }) {
  const update = useUpdateBall();
  const del = useDeleteBall();

  const [notes, setNotes] = useState(ball.notes ?? '');
  const [surface, setSurface] = useState(ball.surface ?? '');
  const dirty = notes !== (ball.notes ?? '') || surface !== (ball.surface ?? '');

  const save = () =>
    update.mutate({
      id: ball.id,
      patch: { notes: notes.trim() || null, surface: surface.trim() || null },
    });

  const specs = [
    ball.weight != null && { k: 'VIKT', v: `${ball.weight} lb` },
    ball.rg != null && { k: 'RG', v: ball.rg.toFixed(2) },
    ball.differential != null && { k: 'DIFF', v: ball.differential.toFixed(3) },
    ball.coverstock && { k: 'COVERSTOCK', v: ball.coverstock },
    ball.core && { k: 'KÄRNA', v: ball.core },
    ball.layout && { k: 'LAYOUT', v: ball.layout },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[8] }}>
      <View style={styles.head}>
        <BallOrb label={`${ball.brand ?? ''} ${ball.name}`} imageUrl={ball.imageUrl} size={88} />
        <View style={styles.who}>
          {!!ball.brand && <Text style={styles.brand} numberOfLines={1}>{ball.brand.toUpperCase()}</Text>}
          <Text style={styles.name} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
            {ball.name}
          </Text>
          {!ball.inBag && <Text style={styles.retired}>PENSIONERAT</Text>}
        </View>
      </View>

      {specs.length > 0 && (
        <View style={styles.specGrid}>
          {specs.map((s) => (
            <View key={s.k} style={styles.spec}>
              <Text style={styles.specV}>{s.v}</Text>
              <Text style={styles.specK}>{s.k}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.label}>YTA JUST NU</Text>
      <TextInput
        style={styles.input}
        value={surface}
        onChangeText={setSurface}
        placeholder="t.ex. 2000 abralon, polerad"
        placeholderTextColor={COLOR.ink4}
      />

      <Text style={styles.label}>DINA ANTECKNINGAR</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Hur reagerar det? När plockar du fram det?"
        placeholderTextColor={COLOR.ink4}
        multiline
        textAlignVertical="top"
      />

      {dirty && (
        <PressableScale style={styles.save} onPress={save} disabled={update.isPending}>
          <Text style={styles.saveText}>Spara ändringar</Text>
        </PressableScale>
      )}

      <View style={styles.actions}>
        <PressableScale
          style={styles.action}
          onPress={() => update.mutate({ id: ball.id, patch: { in_bag: !ball.inBag } })}
        >
          <Ionicons name={ball.inBag ? 'archive-outline' : 'bag-add-outline'} size={20} color={COLOR.ink2} />
          <Text style={styles.actionText}>{ball.inBag ? 'Pensionera' : 'Tillbaka i väskan'}</Text>
        </PressableScale>
        <PressableScale style={styles.action} onPress={() => del.mutate(ball.id, { onSuccess: onClose })}>
          <Ionicons name="trash-outline" size={20} color={COLOR.red} />
          <Text style={[styles.actionText, { color: COLOR.red }]}>Ta bort</Text>
        </PressableScale>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4] },
  who: { flex: 1, minWidth: 0 },
  brand: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: 2 },
  name: { color: COLOR.ink, fontSize: TYPE.title + 2, fontFamily: FONT.bold, letterSpacing: -0.4 },
  retired: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, marginTop: 4 },

  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2], marginTop: SPACE[6] },
  spec: {
    minWidth: 88,
    flexGrow: 1,
    backgroundColor: COLOR.surface2,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[3],
    paddingHorizontal: SPACE[3],
    alignItems: 'center',
    gap: 4,
  },
  specV: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  specK: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },

  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginTop: SPACE[6], marginBottom: SPACE[2] },
  input: { backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, padding: SPACE[4], color: COLOR.ink, fontSize: TYPE.body },
  notes: { minHeight: 88, lineHeight: 22 },

  save: { marginTop: SPACE[4], backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingVertical: SPACE[4], alignItems: 'center' },
  saveText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },

  actions: { flexDirection: 'row', gap: SPACE[3], marginTop: SPACE[8] },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACE[4],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLOR.hairline,
  },
  actionText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.bold },
});
