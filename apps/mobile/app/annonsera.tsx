import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// The house-promo's destination — an honest pitch to bowling businesses about
// advertising in the feed (mirrors web /annonsera). Contact email is a
// placeholder; swap for the real inbox/alias.
const CONTACT = 'annons@bowlkollen.se';

const AUDIENCE = [
  { h: 'Hallar', b: 'Fyll banorna. Nå spelare som redan letar match, träning och tävling.' },
  { h: 'Proshops', b: 'Klot, borrning, utrustning — visa upp er för spelare som utvecklar sitt spel.' },
  { h: 'Varumärken', b: 'Möt en engagerad bowlingpublik i hela landet, från elit till division.' },
  { h: 'Tävlingar', b: 'Sprid er inbjudan direkt i flödet, framför rätt spelare i rätt region.' },
];

export default function Annonsera() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PressableScale style={styles.back} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={COLOR.ink2} />
      </PressableScale>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>ANNONSPLATS</Text>
        <Text style={styles.h1}>Nå Sveriges bowlare</Text>
        <Text style={styles.lede}>
          Bowlkollen samlar spelare, lag och klubbar kring seriespel, statistik och tävlingar.
          Er annons sitter mitt i flödet — där bowlingintresset redan finns.
        </Text>

        <View style={styles.grid}>
          {AUDIENCE.map(({ h, b }) => (
            <View key={h} style={styles.card}>
              <Text style={styles.cardH}>{h}</Text>
              <Text style={styles.cardB}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={styles.contact}>
          <Text style={styles.contactH}>Vill ni synas här?</Text>
          <Text style={styles.contactB}>Hör av er så tar vi fram ett upplägg som passar er — format, räckvidd och pris.</Text>
          <PressableScale
            style={styles.cta}
            onPress={() => Linking.openURL(`mailto:${CONTACT}?subject=${encodeURIComponent('Annonsering på Bowlkollen')}`)}
          >
            <Text style={styles.ctaText}>Kontakta oss</Text>
            <Ionicons name="arrow-forward" size={16} color={COLOR.bg} />
          </PressableScale>
          <Text style={styles.email}>{CONTACT}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  back: { paddingHorizontal: SPACE[3], paddingVertical: SPACE[2] },
  list: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[16], gap: SPACE[3] },
  eyebrow: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginTop: SPACE[2] },
  h1: { color: COLOR.ink, fontSize: TYPE.hero - 12, fontFamily: FONT.bold, letterSpacing: -0.8, lineHeight: TYPE.hero - 10 },
  lede: { color: COLOR.ink2, fontSize: TYPE.body, lineHeight: 24, marginTop: SPACE[2] },
  grid: { gap: SPACE[3], marginTop: SPACE[6] },
  card: { backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[4] },
  cardH: { color: COLOR.ink, fontSize: TYPE.body + 1, fontFamily: FONT.bold },
  cardB: { color: COLOR.ink2, fontSize: TYPE.caption, lineHeight: 21, marginTop: SPACE[2] },
  contact: { backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[6], marginTop: SPACE[6], gap: SPACE[3], alignItems: 'flex-start' },
  contactH: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, letterSpacing: -0.4 },
  contactB: { color: COLOR.ink2, fontSize: TYPE.body, lineHeight: 23 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLOR.gold, borderRadius: RADIUS.pill, paddingVertical: SPACE[3], paddingHorizontal: SPACE[6], marginTop: SPACE[2] },
  ctaText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },
  email: { color: COLOR.ink3, fontSize: TYPE.caption },
});
