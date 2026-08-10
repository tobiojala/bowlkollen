import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { momentHeadline, type Moment } from '@/lib/share';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// A screenshot-ready share card for a delmatch "moment". Portrait 4:5 for chats/
// stories, branded, gold accent on the headline. Meaning is text-first so it reads
// the same in a grayscale screenshot.
export function MomentCard({ moment }: { moment: Moment }) {
  return (
    <LinearGradient
      colors={['#141922', '#0b0d10', '#0b0d10']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.top}>
        <Text style={styles.wordmark}>BOWLKOLLEN</Text>
        <View style={styles.eyebrow}>
          <View style={styles.dot} />
          <Text style={styles.eyebrowText}>{momentHeadline(moment)}</Text>
        </View>
      </View>

      <View style={styles.body}>{renderBody(moment)}</View>

      <Text style={styles.footer}>Bord · rivaliteter · din historik</Text>
    </LinearGradient>
  );
}

function renderBody(m: Moment) {
  if (m.kind === 'rivalry') {
    const aLead = m.aWins > m.bWins;
    const bLead = m.bWins > m.aWins;
    return (
      <>
        <Text style={styles.names} numberOfLines={2}>{m.aName}</Text>
        <View style={styles.recRow}>
          <Text style={[styles.recNum, aLead && styles.recWin]}>{m.aWins}</Text>
          <Text style={styles.recDash}>–</Text>
          <Text style={[styles.recNum, bLead && styles.recWin]}>{m.bWins}</Text>
        </View>
        <Text style={styles.names} numberOfLines={2}>{m.bName}</Text>
        <Text style={styles.sub}>{m.meetings} möten vid bordet</Text>
      </>
    );
  }
  if (m.kind === 'record') {
    return (
      <>
        <Text style={styles.name} numberOfLines={2}>{m.name}</Text>
        <View style={styles.recRow}>
          <Text style={[styles.recNum, styles.recWin]}>{m.wins}</Text>
          <Text style={styles.recDash}>–</Text>
          <Text style={styles.recNum}>{m.losses}</Text>
        </View>
        <Text style={styles.sub}>{Math.round(m.winRate * 100)}% vinst · {m.played} bord</Text>
        {!!m.highlight && <Text style={styles.highlight}>{m.highlight}</Text>}
      </>
    );
  }
  return (
    <>
      <Text style={styles.bigValue}>{m.value}</Text>
      <Text style={styles.name} numberOfLines={2}>{m.who}</Text>
      {!!m.sub && <Text style={styles.sub}>{m.sub}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', aspectRatio: 4 / 5, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: 'rgba(245,194,0,0.22)', padding: SPACE[6], justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.display, letterSpacing: 1 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[1] },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLOR.gold },
  eyebrowText: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE[2] },
  names: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, textAlign: 'center', lineHeight: 26 },
  name: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, textAlign: 'center', lineHeight: 28 },
  recRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: SPACE[1] },
  recNum: { color: COLOR.ink2, fontSize: TYPE.hero, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  recWin: { color: COLOR.gold },
  recDash: { color: COLOR.ink4, fontSize: TYPE.hero - 12, fontFamily: FONT.display, marginHorizontal: SPACE[3] },
  bigValue: { color: COLOR.gold, fontSize: TYPE.hero + 16, fontFamily: FONT.display, fontVariant: ['tabular-nums'], lineHeight: TYPE.hero + 18 },
  sub: { color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.semibold, textAlign: 'center', marginTop: SPACE[1] },
  highlight: { color: COLOR.green, fontSize: TYPE.caption, fontFamily: FONT.bold, textAlign: 'center', marginTop: SPACE[1] },

  footer: { color: COLOR.ink4, fontSize: TYPE.caption, fontFamily: FONT.medium, textAlign: 'center', letterSpacing: 0.5 },
});
