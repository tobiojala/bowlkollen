import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// BK-rating launch state — the rating engine needs more match data before it can
// score a player against the field. Shown until it's ready. Web parity
// (IdentitySection "Kommer snart"). Tap opens the how-it-works info.
export function BkRatingSoon({ onInfo }: { onInfo?: () => void }) {
  return (
    <PressableScale onPress={onInfo} disabled={!onInfo}>
      <Text style={styles.label}>BK-RATING</Text>
      <View style={styles.row}>
        <Text style={styles.dash}>–</Text>
        <View style={styles.pill}><Text style={styles.pillText}>Kommer snart</Text></View>
      </View>
      <Text style={styles.body}>
        BK-rating öppnar när vi har tillräckligt med matchdata för att mäta dig mot fältet.
        {onInfo ? ' Tryck för att se hur det räknas.' : ''}
      </Text>
      <View style={styles.ghost}>
        <View style={[styles.ghostLine, { top: 26 }]} />
        <View style={[styles.ghostLine, { top: 54 }]} />
      </View>
    </PressableScale>
  );
}

const GREEN = COLOR.green;
const styles = StyleSheet.create({
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, marginBottom: SPACE[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  dash: { color: COLOR.ink4, fontFamily: FONT.scoreHeavy, fontSize: 52, lineHeight: 52 },
  pill: { backgroundColor: `${GREEN}1a`, borderRadius: RADIUS.pill, paddingVertical: 4, paddingHorizontal: SPACE[3] },
  pillText: { color: GREEN, fontSize: TYPE.caption, fontFamily: FONT.bold },
  body: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.regular, lineHeight: 22, marginTop: SPACE[3] },
  ghost: { marginTop: SPACE[4], height: 84, borderRadius: 12, overflow: 'hidden', backgroundColor: COLOR.surface },
  ghostLine: { position: 'absolute', left: 8, right: 8, height: 0, borderTopWidth: 1, borderColor: COLOR.hairline, borderStyle: 'dashed' },
});
