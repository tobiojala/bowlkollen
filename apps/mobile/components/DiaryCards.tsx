import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BallOrb } from '@/components/BallOrb';
import { PressableScale } from '@/components/PressableScale';
import type { MatchBall, Note } from '@/lib/diary';
import { formatMatchDate } from '@/lib/format';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// A ball orb + its name, as it appears in the prep sheet's recall/usage rows.
export function BallStack({ ball }: { ball: MatchBall }) {
  return (
    <View style={styles.orbCol}>
      <BallOrb label={`${ball.brand ?? ''} ${ball.name}`} imageUrl={ball.imageUrl} size={56} />
      <Text style={styles.orbName} numberOfLines={1}>{ball.name}</Text>
    </View>
  );
}

// A diary note card. `muted` = recalled from an earlier visit (outlined, not filled).
export function NoteCard({ note, onDelete, muted }: { note: Note; onDelete: () => void; muted?: boolean }) {
  return (
    <View style={[styles.note, muted && styles.noteMuted]}>
      <Text style={styles.noteBody}>{note.body}</Text>
      <View style={styles.noteFoot}>
        <Text style={styles.noteDate}>{formatMatchDate(note.createdAt.slice(0, 10))}</Text>
        <PressableScale onPress={onDelete} hitSlop={10}>
          <Ionicons name="trash-outline" size={18} color={COLOR.ink3} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbCol: { alignItems: 'center', width: 64, gap: 6 },
  orbName: { color: COLOR.ink, fontSize: TYPE.label, fontFamily: FONT.semibold, textAlign: 'center', maxWidth: 62 },

  note: { marginTop: SPACE[3], padding: SPACE[4], borderRadius: RADIUS.md, backgroundColor: COLOR.surface },
  noteMuted: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLOR.hairline },
  noteBody: { color: COLOR.ink, fontSize: TYPE.body, lineHeight: 22 },
  noteFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACE[3] },
  noteDate: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
});
