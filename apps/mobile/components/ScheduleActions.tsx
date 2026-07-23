import { Ionicons } from '@expo/vector-icons';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { FollowButton } from '@/components/FollowButton';
import { PressableScale } from '@/components/PressableScale';
import type { FollowEntityType } from '@/lib/follows';
import { addToCalendar, type ExportMatch, shareCSV, sharePDF } from '@/lib/team-export';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Shared action row for a schedule (team or division): follow, add upcoming to
// the calendar, and export the season as Excel/PDF.
export function ScheduleActions({
  followType,
  followId,
  name,
  upcoming,
  matches,
}: {
  followType: FollowEntityType;
  followId: string;
  name: string;
  upcoming: ExportMatch[];
  matches: ExportMatch[];
}) {
  const onCalendar = async () => {
    const res = await addToCalendar(upcoming);
    if (res.ok) {
      Alert.alert('Tillagt i kalendern', `${res.added} ${res.added === 1 ? 'match' : 'matcher'} tillagda.`);
    } else if (res.reason === 'permission') {
      Alert.alert('Kalender', 'Ge Bowlkollen åtkomst till kalendern i Inställningar för att lägga till matcher.');
    } else {
      Alert.alert('Kalender', 'Kunde inte lägga till i kalendern.');
    }
  };

  return (
    <View style={styles.row}>
      <FollowButton entityType={followType} entityId={followId} />
      <Action icon="calendar-outline" label="Kalender" onPress={onCalendar} disabled={upcoming.length === 0} />
      <Action icon="grid-outline" label="Excel" onPress={() => shareCSV(name, matches)} disabled={matches.length === 0} />
      <Action icon="document-outline" label="PDF" onPress={() => sharePDF(name, matches)} disabled={matches.length === 0} />
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <PressableScale style={[styles.action, disabled && styles.actionOff]} onPress={onPress} disabled={disabled}>
      <Ionicons name={icon} size={20} color={disabled ? COLOR.ink4 : COLOR.ink} />
      <Text style={[styles.actionText, disabled && styles.actionTextOff]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], marginTop: SPACE[6] },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: SPACE[1],
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.md,
    backgroundColor: COLOR.surface,
  },
  actionOff: { opacity: 0.5 },
  actionText: { color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  actionTextOff: { color: COLOR.ink4 },
});
