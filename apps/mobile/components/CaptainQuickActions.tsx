import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { relativeMatchDate } from '@/lib/format';
import { useTeamShortcuts, type TeamShortcut } from '@/lib/team-admin';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Captain/member shortcuts on Profil — one tap to the lineup or availability for each
// team's next match, instead of digging through the team page → Mitt lag → match.
export function CaptainQuickActions() {
  const teams = useTeamShortcuts();
  if (teams.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>DINA LAG — SNABBVAL</Text>
      {teams.map((t) => (
        <TeamCard key={t.teamId} t={t} />
      ))}
    </View>
  );
}

function TeamCard({ t }: { t: TeamShortcut }) {
  const router = useRouter();
  const isCaptain = t.role === 'captain';

  return (
    <View style={styles.card}>
      <PressableScale style={styles.head} onPress={() => router.push(`/lag/${t.teamId}/laget`)}>
        <View style={styles.headText}>
          <Text style={styles.name} numberOfLines={1}>{t.name}</Text>
          <Text style={styles.next} numberOfLines={1}>
            {t.next
              ? `Nästa: ${relativeMatchDate(t.next.date)} · ${t.next.isHome ? 'hemma mot' : 'borta mot'} ${t.next.opponent}`
              : 'Inga kommande matcher'}
          </Text>
        </View>
        {isCaptain && <Text style={styles.roleTag}>KAPTEN</Text>}
        <Ionicons name="chevron-forward" size={20} color={COLOR.ink3} />
      </PressableScale>

      <View style={styles.actions}>
        <Action
          icon="people-outline"
          label="Närvaro"
          onPress={() => t.next && router.push(`/lag/${t.teamId}/match/${t.next.matchId}`)}
          disabled={!t.next}
        />
        {isCaptain && (
          <Action
            icon="clipboard-outline"
            label="Laguttagning"
            onPress={() => t.next && router.push(`/lag/${t.teamId}/laguttagning/${t.next.matchId}`)}
            disabled={!t.next}
          />
        )}
        <Action icon="person-add-outline" label="Bjud in" onPress={() => router.push(`/lag/${t.teamId}/laget`)} />
      </View>
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
      <Ionicons name={icon} size={22} color={disabled ? COLOR.ink4 : COLOR.gold} />
      <Text style={[styles.actionText, disabled && { color: COLOR.ink4 }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[3] },
  card: { backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[4], marginBottom: SPACE[3] },
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  headText: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.body + 1, fontFamily: FONT.bold, letterSpacing: -0.2 },
  next: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },
  roleTag: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },

  actions: { flexDirection: 'row', gap: SPACE[2], marginTop: SPACE[4] },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.md,
    backgroundColor: COLOR.surface2,
  },
  actionOff: { opacity: 0.5 },
  actionText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.bold },
});
