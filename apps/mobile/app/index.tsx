import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLOR, RADIUS, SPACE, TYPE } from '@/theme';

const PILLARS = ['Förbered', 'Spela', 'Förbättra', 'Minns'] as const;

export default function Home() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>BOWLKOLLEN</Text>
        <Text style={styles.h1}>
          Hela ditt{'\n'}bowlingliv.
        </Text>
        <View style={styles.rule} />
        <View style={styles.pillars}>
          {PILLARS.map((p) => (
            <View key={p} style={styles.pillar}>
              <Text style={styles.pillarText}>{p}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footer}>Native · v0.1</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLOR.bg,
    paddingHorizontal: SPACE[6],
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACE[6],
  },
  kicker: {
    color: COLOR.gold,
    fontSize: TYPE.label,
    letterSpacing: 3,
    fontWeight: '700',
  },
  h1: {
    color: COLOR.ink,
    fontSize: TYPE.hero,
    lineHeight: TYPE.hero * 1.02,
    fontWeight: '800',
    letterSpacing: -1,
  },
  rule: {
    height: 2,
    width: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLOR.gold,
  },
  pillars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE[2],
  },
  pillar: {
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACE[2],
    paddingHorizontal: SPACE[4],
  },
  pillarText: {
    color: COLOR.ink2,
    fontSize: TYPE.caption,
    fontWeight: '600',
  },
  footer: {
    color: COLOR.ink4,
    fontSize: TYPE.micro,
    textAlign: 'center',
    paddingBottom: SPACE[4],
    letterSpacing: 1,
  },
});
