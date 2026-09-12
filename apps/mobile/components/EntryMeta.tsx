import { useRouter } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { useMyBalls } from '@/lib/balls';
import { useOilProfiles, type DiaryType } from '@/lib/diary';
import { COLOR, FONT, RADIUS, SPACE } from '@/theme';

export type EntryMetaValue = { type: DiaryType; hall: string; note: string; ballIds: string[]; oil: string };
const TYPES: { key: DiaryType; label: string }[] = [
  { key: 'traning', label: 'Träning' }, { key: 'tavling', label: 'Tävling' },
  { key: 'match', label: 'Match' }, { key: 'ovrigt', label: 'Övrigt' },
];

// The context around a logged session — type, center, oil, käglor, a note. Shared
// by Mina spel and the loggbok quick entry (parity with web). Balls come from the
// bowler's own arsenal.
export function EntryMeta({ value, onChange }: { value: EntryMetaValue; onChange: (v: EntryMetaValue) => void }) {
  const router = useRouter();
  const set = <K extends keyof EntryMetaValue>(k: K, v: EntryMetaValue[K]) => onChange({ ...value, [k]: v });
  const { data: balls = [] } = useMyBalls();
  const { data: oils = [] } = useOilProfiles();
  const toggleBall = (id: string) =>
    set('ballIds', value.ballIds.includes(id) ? value.ballIds.filter((b) => b !== id) : [...value.ballIds, id]);

  return (
    <View style={{ gap: SPACE[4] }}>
      <View style={s.types}>
        {TYPES.map((t) => {
          const on = value.type === t.key;
          return (
            <PressableScale key={t.key} style={[s.type, on && s.typeOn]} onPress={() => set('type', t.key)}>
              <Text style={[s.typeT, on && s.typeTOn]}>{t.label}</Text>
            </PressableScale>
          );
        })}
      </View>

      <TextInput value={value.hall} onChangeText={(v) => set('hall', v)} placeholder="Center" placeholderTextColor={COLOR.ink4} style={s.input} />

      <View>
        <Text style={s.lbl}>KLOT</Text>
        {balls.length === 0 ? (
          <PressableScale onPress={() => router.push('/arsenal/add' as never)}><Text style={s.link}>Lägg till klot i din arsenal →</Text></PressableScale>
        ) : (
          <View style={s.chips}>
            {balls.map((b) => {
              const on = value.ballIds.includes(b.id);
              return (
                <PressableScale key={b.id} style={[s.chip, on && s.chipOn]} onPress={() => toggleBall(b.id)}>
                  <Text style={[s.chipT, on && s.chipTOn]}>{b.name}</Text>
                </PressableScale>
              );
            })}
          </View>
        )}
      </View>

      <View>
        <Text style={s.lbl}>OLJEPROFIL</Text>
        <TextInput value={value.oil} onChangeText={(v) => set('oil', v)} placeholder="Oljeprofil (valfritt)" placeholderTextColor={COLOR.ink4} style={s.input} />
        {oils.length > 0 && value.oil.trim().length === 0 && (
          <View style={s.chips}>
            {oils.slice(0, 6).map((o) => (
              <PressableScale key={o.name} style={s.chip} onPress={() => set('oil', o.name)}>
                <Text style={s.chipT}>{o.name}{o.lengthFt ? ` · ${o.lengthFt}ft` : ''}</Text>
              </PressableScale>
            ))}
          </View>
        )}
      </View>

      <TextInput value={value.note} onChangeText={(v) => set('note', v)} placeholder="Hur gick det? Vad testade du?" placeholderTextColor={COLOR.ink4}
        multiline style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} />
    </View>
  );
}

const s = StyleSheet.create({
  types: { flexDirection: 'row', gap: SPACE[2] },
  type: { flex: 1, paddingVertical: 9, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLOR.ink4, alignItems: 'center' },
  typeOn: { backgroundColor: COLOR.gold, borderColor: COLOR.gold },
  typeT: { fontSize: 13, fontFamily: FONT.bold, color: COLOR.ink2 },
  typeTOn: { color: COLOR.bg },
  input: { backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], color: COLOR.ink, fontSize: 15, fontFamily: FONT.regular },
  lbl: { fontSize: 12, fontFamily: FONT.bold, letterSpacing: 0.6, color: COLOR.ink3, marginBottom: SPACE[2] },
  link: { fontSize: 14, color: COLOR.ink3, fontFamily: FONT.regular },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] },
  chip: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLOR.hairline },
  chipOn: { backgroundColor: COLOR.ink, borderColor: COLOR.ink },
  chipT: { fontSize: 13, fontFamily: FONT.semibold, color: COLOR.ink2 },
  chipTOn: { color: COLOR.bg },
});
