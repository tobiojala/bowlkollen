import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { signOut, useAuth } from '@/lib/auth';
import { useMyFollowCount } from '@/lib/follows';
import { useMyClaim, useMyTeams } from '@/lib/me';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { data: followCount = 0 } = useMyFollowCount();
  const { data: claim } = useMyClaim();
  const { data: teams = [] } = useMyTeams();

  const email = session?.user?.email ?? '';
  const meta = session?.user?.user_metadata ?? {};
  const accountName = (typeof meta.full_name === 'string' && meta.full_name) || email || 'Bowlare';
  const verified = claim?.status === 'verified';
  const displayName = verified ? claim!.name : accountName;

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACE[2] }]}>
        <Text style={styles.title}>Profil</Text>

        {/* Identity — your claimed player if verified, otherwise the account */}
        <PressableScale
          style={styles.identity}
          disabled={!verified}
          onPress={() => verified && router.push(`/player/${claim!.publicId}`)}
        >
          <IdentityAvatar colors={teamColor(displayName)} initials={teamInitials(displayName)} size={60} />
          <View style={styles.who}>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.sub} numberOfLines={1}>{verified ? (claim!.club ?? 'Min spelarprofil') : email}</Text>
          </View>
          {verified && <Ionicons name="chevron-forward" size={20} color={COLOR.ink3} />}
        </PressableScale>

        {/* Claim CTA / pending state */}
        {!claim && (
          <PressableScale style={styles.cta} onPress={() => router.push('/discover')}>
            <Ionicons name="person-circle-outline" size={24} color={COLOR.gold} />
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>Koppla din spelarprofil</Text>
              <Text style={styles.ctaBody}>Hitta dig själv för att se din statistik och rating.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLOR.ink3} />
          </PressableScale>
        )}
        {claim?.status === 'pending' && (
          <View style={styles.pending}>
            <Ionicons name="time-outline" size={18} color={COLOR.ink3} />
            <Text style={styles.pendingText}>Din spelarkoppling väntar på granskning.</Text>
          </View>
        )}

        {teams.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DINA LAG</Text>
            {teams.map((t) => (
              <PressableScale key={t.teamId} style={styles.row} onPress={() => router.push(`/lag/${t.teamId}`)}>
                <IdentityAvatar colors={teamColor(t.name)} initials={teamInitials(t.name)} size={36} />
                <Text style={styles.rowName} numberOfLines={1}>{t.name}</Text>
                {t.role === 'captain' && <Text style={styles.roleTag}>KAPTEN</Text>}
                <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
              </PressableScale>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>KONTO</Text>
          <PressableScale style={styles.row} onPress={() => router.push('/following')}>
            <Ionicons name="people-outline" size={22} color={COLOR.ink2} />
            <Text style={styles.rowName}>Följer</Text>
            <Text style={styles.count}>{followCount}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
          </PressableScale>
        </View>

        <PressableScale style={styles.signout} onPress={signOut}>
          <Text style={styles.signoutText}>Logga ut</Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: 120 },
  title: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.bold, letterSpacing: -0.5, paddingTop: SPACE[3], paddingBottom: SPACE[4] },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[4],
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.lg,
    padding: SPACE[4],
  },
  who: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, letterSpacing: -0.3 },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    marginTop: SPACE[3],
    padding: SPACE[4],
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(245,194,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.24)',
  },
  ctaText: { flex: 1, minWidth: 0, gap: 2 },
  ctaTitle: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  ctaBody: { color: COLOR.ink3, fontSize: TYPE.caption },
  pending: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], marginTop: SPACE[3], paddingHorizontal: SPACE[2] },
  pendingText: { color: COLOR.ink3, fontSize: TYPE.caption },

  section: { marginTop: SPACE[8] },
  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    paddingVertical: SPACE[3],
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
  },
  rowName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  roleTag: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  count: { color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.bold },

  signout: {
    marginTop: SPACE[12],
    borderWidth: 1,
    borderColor: COLOR.hairline,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[4],
    alignItems: 'center',
  },
  signoutText: { color: COLOR.red, fontSize: TYPE.body, fontFamily: FONT.bold },
});
