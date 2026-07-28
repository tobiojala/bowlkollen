import { BlurView } from 'expo-blur';
import { Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Tap a team's avatar → the full club crest at a proper size (a ring-sized crest reads
// as a smudge). Shown on a light card so transparent-PNG crests always read; tap to close.
export function CrestViewer({
  uri,
  name,
  visible,
  onClose,
}: {
  uri: string | null;
  name: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.66, 300);
  if (!uri) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.dim} />
        <View style={[styles.card, { width: size, height: size }]}>
          <Image source={{ uri }} style={styles.crest} resizeMode="contain" />
        </View>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.hint}>Tryck för att stänga</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE[6] },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  card: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACE[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  crest: { width: '100%', height: '100%' },
  name: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, letterSpacing: -0.3, textAlign: 'center', paddingHorizontal: SPACE[6] },
  hint: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
});
