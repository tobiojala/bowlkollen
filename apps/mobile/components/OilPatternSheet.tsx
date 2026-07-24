import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassSheet } from '@/components/GlassSheet';
import { PressableScale } from '@/components/PressableScale';
import { OIL_CATEGORY_LABEL, OIL_CATEGORY_ORDER, useOilProfiles, type OilProfile } from '@/lib/diary';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Pick the oil pattern for a match, from the official SvBF profiles (grouped by
// category) — plus Husgärd (house shot), your own, or clear it. The stored value is
// the profile name, so pattern recall keys on it directly.
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
  const { data: profiles = [] } = useOilProfiles();
  const [custom, setCustom] = useState('');

  const groups = useMemo(() => {
    const by = new Map<string, OilProfile[]>();
    for (const p of profiles) {
      const key = OIL_CATEGORY_ORDER.includes(p.category ?? '') ? p.category! : 'other';
      (by.get(key) ?? by.set(key, []).get(key)!).push(p);
    }
    const order = [...OIL_CATEGORY_ORDER, 'other'];
    return order.filter((k) => by.has(k)).map((k) => ({ key: k, label: OIL_CATEGORY_LABEL[k], items: by.get(k)! }));
  }, [profiles]);

  const choose = (p: string | null) => {
    onPick(p);
    setCustom('');
    onClose();
  };

  const sub = (p: OilProfile) =>
    [p.lengthFt != null ? `${p.lengthFt} ft` : null, p.ratio != null ? `${p.ratio.toFixed(2)}:1` : null, p.description]
      .filter(Boolean)
      .join(' · ');

  return (
    <GlassSheet visible={visible} onClose={onClose} title="Oljebild">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[8] }}>
        {/* House shot — the everyday default, always offered */}
        <PressableScale
          style={[styles.house, current === 'Husgärd' && styles.rowOn]}
          onPress={() => choose('Husgärd')}
        >
          <Text style={[styles.name, current === 'Husgärd' && styles.nameOn]}>Husgärd</Text>
          <Text style={[styles.sub, current === 'Husgärd' && styles.subOn]}>Vanlig ligakväll / husets olja</Text>
        </PressableScale>

        {groups.map((g) => (
          <View key={g.key}>
            <Text style={styles.groupLabel}>{g.label}</Text>
            {g.items.map((p) => {
              const on = p.name === current;
              return (
                <PressableScale key={p.name} style={[styles.row, on && styles.rowOn]} onPress={() => choose(p.name)}>
                  <Text style={[styles.name, on && styles.nameOn]} numberOfLines={1}>{p.name}</Text>
                  {!!sub(p) && <Text style={[styles.sub, on && styles.subOn]} numberOfLines={1}>{sub(p)}</Text>}
                </PressableScale>
              );
            })}
          </View>
        ))}

        <Text style={styles.groupLabel}>ANNAN OLJEBILD</Text>
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
  house: { paddingVertical: SPACE[3], paddingHorizontal: SPACE[4], borderRadius: RADIUS.md, backgroundColor: COLOR.surface2, gap: 2 },
  groupLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.2, marginTop: SPACE[6], marginBottom: SPACE[2] },
  row: {
    paddingVertical: SPACE[3],
    paddingHorizontal: SPACE[4],
    borderRadius: RADIUS.md,
    marginBottom: SPACE[2],
    backgroundColor: COLOR.surface,
    gap: 2,
  },
  rowOn: { backgroundColor: COLOR.gold },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  nameOn: { color: COLOR.bg, fontFamily: FONT.bold },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption },
  subOn: { color: 'rgba(11,13,16,0.72)' },

  customRow: { flexDirection: 'row', gap: SPACE[2] },
  input: { flex: 1, backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[4], color: COLOR.ink, fontSize: TYPE.body },
  addBtn: { paddingHorizontal: SPACE[4], borderRadius: RADIUS.md, backgroundColor: COLOR.gold, alignItems: 'center', justifyContent: 'center' },
  addOff: { opacity: 0.4 },
  addText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },

  clear: { marginTop: SPACE[6], alignItems: 'center', paddingVertical: SPACE[3] },
  clearText: { color: COLOR.red, fontSize: TYPE.caption, fontFamily: FONT.bold },
});
