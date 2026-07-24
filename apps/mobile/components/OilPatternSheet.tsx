import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassSheet } from '@/components/GlassSheet';
import { PressableScale } from '@/components/PressableScale';
import { OIL_PATTERNS } from '@/lib/diary';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Pick the oil pattern for a match: tap a known one, type your own, or clear it.
export function OilPatternSheet({
  visible,
  onClose,
  current,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  current: string | null;
  onPick: (pattern: string | null) => void;
}) {
  const [custom, setCustom] = useState('');

  const choose = (p: string | null) => {
    onPick(p);
    setCustom('');
    onClose();
  };

  return (
    <GlassSheet visible={visible} onClose={onClose} title="Oljebild">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[8] }}>
        <View style={styles.chips}>
          {OIL_PATTERNS.map((p) => {
            const on = p === current;
            return (
              <PressableScale key={p} style={[styles.chip, on && styles.chipOn]} onPress={() => choose(p)}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{p}</Text>
              </PressableScale>
            );
          })}
        </View>

        <Text style={styles.label}>ANNAN OLJEBILD</Text>
        <View style={styles.customRow}>
          <TextInput
            style={styles.input}
            value={custom}
            onChangeText={setCustom}
            placeholder="Skriv namn eller längd (ft)…"
            placeholderTextColor={COLOR.ink4}
            returnKeyType="done"
            onSubmitEditing={() => custom.trim() && choose(custom.trim())}
          />
          <PressableScale
            style={[styles.addBtn, !custom.trim() && styles.addOff]}
            disabled={!custom.trim()}
            onPress={() => choose(custom.trim())}
          >
            <Text style={styles.addText}>Välj</Text>
          </PressableScale>
        </View>

        {!!current && (
          <PressableScale style={styles.clear} onPress={() => choose(null)}>
            <Text style={styles.clearText}>Ta bort oljebild</Text>
          </PressableScale>
        )}
      </ScrollView>
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] },
  chip: { paddingVertical: SPACE[3], paddingHorizontal: SPACE[4], borderRadius: RADIUS.pill, backgroundColor: COLOR.surface2 },
  chipOn: { backgroundColor: COLOR.gold },
  chipText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  chipTextOn: { color: COLOR.bg, fontFamily: FONT.bold },

  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginTop: SPACE[6], marginBottom: SPACE[2] },
  customRow: { flexDirection: 'row', gap: SPACE[2] },
  input: { flex: 1, backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[4], color: COLOR.ink, fontSize: TYPE.body },
  addBtn: { paddingHorizontal: SPACE[4], borderRadius: RADIUS.md, backgroundColor: COLOR.gold, alignItems: 'center', justifyContent: 'center' },
  addOff: { opacity: 0.4 },
  addText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },

  clear: { marginTop: SPACE[6], alignItems: 'center', paddingVertical: SPACE[3] },
  clearText: { color: COLOR.red, fontSize: TYPE.caption, fontFamily: FONT.bold },
});
