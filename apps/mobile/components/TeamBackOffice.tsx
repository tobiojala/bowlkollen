import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';

import { GlassSheet } from '@/components/GlassSheet';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { inviteLink } from '@/lib/invites';
import { teamColor, teamInitials } from '@/lib/team-identity';
import {
  ASSIGNABLE_ROLES,
  ROLE_LABEL,
  useCreateTeamInvite,
  useSetMemberRole,
  useTeamMembers,
  type TeamMember,
  type TeamRole,
} from '@/lib/team-admin';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Invite teammates + (for captains) manage roles. Any verified member can share an
// invite link; only captains can change roles.
export function TeamBackOffice({
  teamId,
  teamName,
  isCaptain,
}: {
  teamId: number;
  teamName: string;
  isCaptain: boolean;
}) {
  const router = useRouter();
  const { data: members = [] } = useTeamMembers(teamId);
  const createInvite = useCreateTeamInvite(teamId);
  const setRole = useSetMemberRole(teamId);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const invite = () =>
    createInvite.mutate(undefined, {
      onSuccess: (code) =>
        Share.share({ message: `Gå med i ${teamName} på Bowlkollen: ${inviteLink(code)}` }).catch(() => {}),
      onError: () => Alert.alert('Kunde inte skapa länk', 'Försök igen om en stund.'),
    });

  const assign = (role: TeamRole) => {
    if (!editing) return;
    const target = editing;
    setEditing(null);
    setRole.mutate(
      { userId: target.userId, role },
      {
        onError: (e) => {
          const msg = (e as { message?: string })?.message ?? '';
          Alert.alert(
            'Gick inte att ändra',
            msg.includes('last_captain')
              ? 'Laget måste ha minst en kapten.'
              : msg.includes('not_captain')
                ? 'Bara kaptener kan ändra roller.'
                : 'Försök igen.',
          );
        },
      },
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.sectionLabel}>MEDLEMMAR{members.length > 0 ? ` · ${members.length}` : ''}</Text>
        <PressableScale style={styles.inviteBtn} onPress={invite} disabled={createInvite.isPending} hitSlop={8}>
          <Ionicons name="person-add" size={16} color={COLOR.gold} />
          <Text style={styles.inviteText}>Bjud in</Text>
        </PressableScale>
      </View>

      {members.map((m) => (
        <PressableScale
          key={m.userId}
          style={styles.row}
          disabled={!isCaptain}
          onPress={() => (isCaptain ? setEditing(m) : m.publicId && router.push(`/player/${m.publicId}`))}
        >
          <IdentityAvatar colors={teamColor(m.displayName)} initials={teamInitials(m.displayName)} size={40} />
          <View style={styles.rowText}>
            <Text style={styles.rowName} numberOfLines={1}>
              {m.displayName}{m.isMe ? ' (du)' : ''}
            </Text>
            <Text style={styles.rowRole}>{ROLE_LABEL[m.role]}</Text>
          </View>
          {isCaptain ? (
            <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
          ) : (
            m.role === 'captain' && <Text style={styles.captainTag}>KAPTEN</Text>
          )}
        </PressableScale>
      ))}
      {members.length === 0 && <Text style={styles.empty}>Inga medlemmar har gått med än. Bjud in laget!</Text>}

      <GlassSheet visible={!!editing} onClose={() => setEditing(null)} title={editing?.displayName}>
        <Text style={styles.pickLabel}>VÄLJ ROLL</Text>
        {ASSIGNABLE_ROLES.map((r) => {
          const on = editing?.role === r;
          return (
            <PressableScale key={r} style={[styles.roleOption, on && styles.roleOptionOn]} onPress={() => assign(r)}>
              <Text style={[styles.roleOptionText, on && styles.roleOptionTextOn]}>{ROLE_LABEL[r]}</Text>
              {on && <Ionicons name="checkmark" size={18} color={COLOR.bg} />}
            </PressableScale>
          );
        })}
      </GlassSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[3] },
  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  inviteText: { color: COLOR.gold, fontSize: TYPE.caption, fontFamily: FONT.bold },

  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  rowText: { flex: 1, minWidth: 0 },
  rowName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  rowRole: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  captainTag: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  empty: { color: COLOR.ink3, fontSize: TYPE.caption, paddingVertical: SPACE[3] },

  pickLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[3] },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE[4],
    paddingHorizontal: SPACE[4],
    borderRadius: RADIUS.md,
    marginBottom: SPACE[2],
    backgroundColor: COLOR.surface,
  },
  roleOptionOn: { backgroundColor: COLOR.gold },
  roleOptionText: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  roleOptionTextOn: { color: COLOR.bg, fontFamily: FONT.bold },
});
