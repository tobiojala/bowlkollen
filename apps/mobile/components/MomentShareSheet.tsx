import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Share, StyleSheet, Text, View } from 'react-native';

import { GlassSheet } from '@/components/GlassSheet';
import { MomentCard } from '@/components/MomentCard';
import { PressableScale } from '@/components/PressableScale';
import { momentShareText, type Moment } from '@/lib/share';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Presents a shareable moment card + the native share action. Text-first today
// (works in Expo Go); the card is screenshot-ready for the image path.
export function MomentShareSheet({ moment, onClose }: { moment: Moment | null; onClose: () => void }) {
  const share = async () => {
    if (!moment) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await Share.share({ message: momentShareText(moment) });
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <GlassSheet visible={!!moment} onClose={onClose} title="Dela">
      {moment && (
        <View style={styles.wrap}>
          <MomentCard moment={moment} />
          <PressableScale style={styles.btn} onPress={share} haptic>
            <Ionicons name="share-outline" size={20} color={COLOR.bg} />
            <Text style={styles.btnText}>Dela</Text>
          </PressableScale>
          <Text style={styles.hint}>Tips: skärmdumpa kortet för att dela bilden i lagchatten.</Text>
        </View>
      )}
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: SPACE[8], gap: SPACE[4] },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[2], paddingVertical: SPACE[4], borderRadius: RADIUS.lg, backgroundColor: COLOR.gold },
  btnText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },
  hint: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, textAlign: 'center' },
});
