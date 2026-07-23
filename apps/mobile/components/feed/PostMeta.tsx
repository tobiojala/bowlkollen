import { StyleSheet, Text, View } from 'react-native';

import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// The top strip every feed card shares: a category / status on the left, the
// division on the right. Keeps mixed content scannable in a sports feed.
export function PostMeta({ left, division }: { left: React.ReactNode; division?: string | null }) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>{typeof left === 'string' ? <Text style={styles.leftText}>{left}</Text> : left}</View>
      {!!division && <Text style={styles.division} numberOfLines={1}>{division}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3] },
  left: { flexShrink: 0 },
  leftText: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  division: { flexShrink: 1, color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold, textAlign: 'right' },
});
