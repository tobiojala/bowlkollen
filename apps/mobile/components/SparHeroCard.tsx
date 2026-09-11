import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, RADIUS, SPACE } from '@/theme';

// Owner-only Spärr entry in the profile hero deck. A summary of your spare
// conversion that opens Mina spel (log + full Spärranalys). Parity with web.
export function SparHeroCard({
  has,
  pct,
  nemesis,
  onOpen,
}: {
  has: boolean;
  pct: number;
  nemesis: { name: string; pct: number } | null;
  onOpen: () => void;
}) {
  return (
    <PressableScale style={s.card} onPress={onOpen} accessibilityLabel="Öppna Mina spel">
      <Text style={s.eyebrow}>SPÄRR</Text>
      <View style={s.row}>
        <Text style={[s.big, !has && { color: COLOR.ink4 }]}>{has ? pct : '–'}<Text style={s.unit}>%</Text></Text>
        <Text style={s.cta}>Mina spel →</Text>
      </View>
      {has && nemesis ? (
        <Text style={s.nem}>Nemesis: <Text style={s.b}>{nemesis.name}</Text> · {nemesis.pct}%</Text>
      ) : null}
      <Text style={s.hint}>
        {has
          ? 'Läge-för-läge från dina loggade spel. Tryck för att logga & se hela analysen →'
          : 'Logga ett spel i Mina spel och pricka käglorna som stod — din spärranalys byggs upp här. Tryck för att börja →'}
      </Text>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[6] },
  eyebrow: { fontSize: 11, fontFamily: FONT.bold, color: COLOR.ink3, letterSpacing: 1, marginBottom: SPACE[2] },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  big: { fontFamily: FONT.scoreHeavy, fontSize: 52, color: COLOR.ink, letterSpacing: -1 },
  unit: { fontSize: 24, color: COLOR.ink4 },
  cta: { fontSize: 14, fontFamily: FONT.bold, color: COLOR.ink2 },
  nem: { fontSize: 13, color: COLOR.ink2, marginTop: SPACE[3], fontFamily: FONT.regular },
  b: { color: COLOR.ink, fontFamily: FONT.semibold },
  hint: { fontSize: 13, color: COLOR.ink3, marginTop: SPACE[2], lineHeight: 19, fontFamily: FONT.regular },
});
