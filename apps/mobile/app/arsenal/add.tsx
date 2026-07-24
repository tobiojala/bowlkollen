import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BallOrb } from '@/components/BallOrb';
import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { useAddBall, useCatalogSearch, type CatalogBall } from '@/lib/balls';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const WEIGHTS = [12, 13, 14, 15, 16];

type Picked =
  | { kind: 'catalog'; ball: CatalogBall }
  | { kind: 'custom'; name: string; brand: string };

export default function AddBall() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const add = useAddBall();

  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 220);
    return () => clearTimeout(t);
  }, [text]);
  const { data: results = [], isFetching } = useCatalogSearch(debounced);

  const [picked, setPicked] = useState<Picked | null>(null);
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState<number | null>(15);
  const [surface, setSurface] = useState('');
  const [layout, setLayout] = useState('');
  const [notes, setNotes] = useState('');

  const chooseCustom = () => {
    setPicked({ kind: 'custom', name: text.trim(), brand: '' });
    setName(text.trim());
    setBrand('');
    setText('');
  };

  const displayLabel =
    picked?.kind === 'catalog'
      ? `${picked.ball.brand} ${picked.ball.name}`
      : `${brand} ${name}`;

  const canSave =
    picked != null && (picked.kind === 'catalog' || name.trim().length > 0) && !add.isPending;

  const save = () => {
    if (!picked) return;
    add.mutate(
      {
        ballId: picked.kind === 'catalog' ? picked.ball.id : null,
        customName: picked.kind === 'custom' ? name.trim() : null,
        brand: picked.kind === 'custom' ? brand.trim() || null : null,
        weight,
        surface,
        layout,
        notes,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}
        keyboardShouldPersistTaps="handled"
      >
        {!picked ? (
          <>
            <Text style={styles.h1}>Lägg till klot</Text>
            <Text style={styles.lead}>Sök i klotdatabasen — eller lägg till ditt eget.</Text>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="t.ex. Phaze II, Storm…"
              placeholderTextColor={COLOR.ink4}
              autoFocus
              autoCorrect={false}
            />

            {results.map((b) => (
              <PressableScale key={b.id} style={styles.row} onPress={() => setPicked({ kind: 'catalog', ball: b })}>
                <BallOrb label={`${b.brand} ${b.name}`} imageUrl={b.imageUrl} size={40} />
                <View style={styles.rowText}>
                  <Text style={styles.rowName} numberOfLines={1}>{b.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {[b.brand, b.releaseYear].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
              </PressableScale>
            ))}

            {debounced.trim().length >= 2 && !isFetching && (
              <PressableScale style={styles.customRow} onPress={chooseCustom}>
                <Ionicons name="add-circle-outline" size={22} color={COLOR.gold} />
                <Text style={styles.customText}>
                  Lägg till <Text style={styles.customStrong}>”{debounced.trim()}”</Text> manuellt
                </Text>
              </PressableScale>
            )}
          </>
        ) : (
          <>
            <Text style={styles.h1}>Detaljer</Text>

            <View style={styles.selected}>
              <BallOrb label={displayLabel} imageUrl={picked.kind === 'catalog' ? picked.ball.imageUrl : null} size={56} />
              <View style={styles.rowText}>
                {picked.kind === 'catalog' ? (
                  <>
                    <Text style={styles.rowName} numberOfLines={1}>{picked.ball.name}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>{picked.ball.brand}</Text>
                  </>
                ) : (
                  <Text style={styles.rowSub}>Eget klot</Text>
                )}
              </View>
              <PressableScale onPress={() => setPicked(null)} hitSlop={8}>
                <Text style={styles.change}>Byt</Text>
              </PressableScale>
            </View>

            {picked.kind === 'custom' && (
              <>
                <Text style={styles.label}>MÄRKE</Text>
                <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="t.ex. Storm" placeholderTextColor={COLOR.ink4} />
                <Text style={styles.label}>NAMN</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Klotets namn" placeholderTextColor={COLOR.ink4} />
              </>
            )}

            <Text style={styles.label}>VIKT</Text>
            <View style={styles.chips}>
              {WEIGHTS.map((w) => (
                <PressableScale
                  key={w}
                  style={[styles.chip, weight === w && styles.chipOn]}
                  onPress={() => setWeight(w)}
                >
                  <Text style={[styles.chipText, weight === w && styles.chipTextOn]}>{w}</Text>
                </PressableScale>
              ))}
            </View>

            <Text style={styles.label}>YTA</Text>
            <TextInput style={styles.input} value={surface} onChangeText={setSurface} placeholder="t.ex. 2000 abralon, polerad" placeholderTextColor={COLOR.ink4} />

            <Text style={styles.label}>LAYOUT (VALFRITT)</Text>
            <TextInput style={styles.input} value={layout} onChangeText={setLayout} placeholder="t.ex. 4½ × 4 × 2½" placeholderTextColor={COLOR.ink4} />

            <Text style={styles.label}>ANTECKNING (VALFRITT)</Text>
            <TextInput
              style={[styles.input, styles.notes]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Hur reagerar det? När plockar du fram det?"
              placeholderTextColor={COLOR.ink4}
              multiline
              textAlignVertical="top"
            />

            <PressableScale style={[styles.save, !canSave && styles.saveOff]} onPress={save} disabled={!canSave}>
              {add.isPending ? <ActivityIndicator color={COLOR.bg} /> : <Text style={styles.saveText}>Lägg i väskan</Text>}
            </PressableScale>
          </>
        )}
      </ScrollView>

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[16] },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 4, fontFamily: FONT.bold, letterSpacing: -0.5 },
  lead: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[2], marginBottom: SPACE[4], lineHeight: 22 },

  input: { backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[4], color: COLOR.ink, fontSize: TYPE.body, marginTop: SPACE[2] },
  notes: { minHeight: 88, lineHeight: 22 },

  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderTopWidth: 1, borderTopColor: COLOR.hairline },
  rowText: { flex: 1, minWidth: 0 },
  rowName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  rowSub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },

  customRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[4], marginTop: SPACE[2] },
  customText: { color: COLOR.ink2, fontSize: TYPE.body },
  customStrong: { color: COLOR.ink, fontFamily: FONT.semibold },

  selected: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], marginTop: SPACE[4], padding: SPACE[4], backgroundColor: COLOR.surface, borderRadius: RADIUS.lg },
  change: { color: COLOR.gold, fontSize: TYPE.caption, fontFamily: FONT.bold },

  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginTop: SPACE[6] },

  chips: { flexDirection: 'row', gap: SPACE[2], marginTop: SPACE[3] },
  chip: { minWidth: 48, paddingVertical: SPACE[3], borderRadius: RADIUS.md, backgroundColor: COLOR.surface2, alignItems: 'center' },
  chipOn: { backgroundColor: COLOR.gold },
  chipText: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.bold },
  chipTextOn: { color: COLOR.bg },

  save: { marginTop: SPACE[8], backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingVertical: SPACE[4], alignItems: 'center' },
  saveOff: { opacity: 0.5 },
  saveText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },
});
