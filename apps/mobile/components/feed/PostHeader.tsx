import { StyleSheet, Text, View } from 'react-native';

import { COLOR, FONT, TYPE } from '@/theme';

export const POST_AVATAR = 44; // shared avatar size for every feed card header

// The one header every feed card shares: avatar + name + subtitle, with an
// optional right slot (badge, menu). Long names shrink to fit the line rather
// than truncating with "…" — the full name always shows.
export function PostHeader({
  avatar,
  name,
  subtitle,
  right,
}: {
  avatar: React.ReactNode;
  name: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      {avatar}
      <View style={styles.who}>
        <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {name}
        </Text>
        {!!subtitle && (
          <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  who: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold, letterSpacing: -0.2 },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 1 },
});
