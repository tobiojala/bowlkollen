import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Tävlingar is being rebuilt (curated list + BITS results + bowlres.se
// partnership). Until it's ready the tab shows a clean under-construction state
// (parity with web /tavlingar).
export default function Tavlingar() {
  return (
    <View style={styles.safe}>
      <View style={styles.icon}>
        <Ionicons name="construct-outline" size={30} color={COLOR.gold} />
      </View>
      <Text style={styles.h1}>Tävlingar byggs</Text>
      <Text style={styles.sub}>
        Den här delen är under uppbyggnad. Snart kan du följa tävlingar i Sverige och se officiella resultat här.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE[8] },
  icon: { width: 64, height: 64, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE[4],
    backgroundColor: 'rgba(245,194,0,0.12)', borderWidth: 1, borderColor: 'rgba(245,194,0,0.28)' },
  h1: { fontSize: 24, fontFamily: FONT.bold, color: COLOR.ink, letterSpacing: -0.5, marginBottom: SPACE[2] },
  sub: { fontSize: TYPE.body, fontFamily: FONT.regular, color: COLOR.ink3, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
});
