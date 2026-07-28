import { GlassSheet } from '@/components/GlassSheet';
import { PressableScale } from '@/components/PressableScale';
import { TEAM_COLORS } from '@/lib/team-admin';
import { StyleSheet, Text, View } from 'react-native';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// Curated cover-colour picker, shared by the player and team headers.
export function HeaderColorSheet({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (color: string | null) => void;
}) {
  const choose = (c: string | null) => {
    onPick(c);
    onClose();
  };
  return (
    <GlassSheet visible={visible} onClose={onClose} title="Omslagsfärg">
      <Text style={styles.label}>VÄLJ FÄRG PÅ DITT OMSLAG</Text>
      <View style={styles.swatches}>
        {TEAM_COLORS.map((c) => (
          <PressableScale key={c} style={[styles.swatch, { backgroundColor: c }]} onPress={() => choose(c)} />
        ))}
      </View>
      <PressableScale style={styles.reset} onPress={() => choose(null)}>
        <Text style={styles.resetText}>Återställ till standard</Text>
      </PressableScale>
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[3] },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3] },
  swatch: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)' },
  reset: { marginTop: SPACE[6], alignItems: 'center', paddingVertical: SPACE[3] },
  resetText: { color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.bold },
});
