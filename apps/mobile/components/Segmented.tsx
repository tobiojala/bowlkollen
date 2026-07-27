import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// A simple, legible segmented control. Active segment is a filled surface with ink
// text; inactive is ink3. Meaning is text, not colour, so it reads for weak sight.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <PressableScale key={o.key} style={[styles.seg, on && styles.segOn]} onPress={() => onChange(o.key)}>
            <Text style={[styles.text, on && styles.textOn]} numberOfLines={1}>{o.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, padding: 3, gap: 3 },
  seg: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACE[3], borderRadius: RADIUS.md - 2 },
  segOn: { backgroundColor: COLOR.surface },
  text: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.bold },
  textOn: { color: COLOR.ink },
});
