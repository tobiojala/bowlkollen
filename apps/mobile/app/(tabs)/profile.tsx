import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut, useAuth } from '@/lib/auth';
import { useMyFollowCount } from '@/lib/follows';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export default function Profile() {
  const router = useRouter();
  const { session } = useAuth();
  const { data: followCount = 0 } = useMyFollowCount();
  const email = session?.user?.email ?? '';
  const meta = session?.user?.user_metadata ?? {};
  const name = (typeof meta.full_name === 'string' && meta.full_name) || email || 'Bowlare';
  const initial = (name.trim()[0] ?? '?').toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.kicker}>BOWLKOLLEN</Text>
        <Text style={styles.title}>Profil</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {!!email && (
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
          )}
        </View>
      </View>

      <PressableScale style={styles.menuRow} onPress={() => router.push('/following')}>
        <Text style={styles.menuText}>Följer</Text>
        <View style={styles.menuRight}>
          <Text style={styles.menuCount}>{followCount}</Text>
          <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
        </View>
      </PressableScale>

      <View style={{ flex: 1 }} />

      <PressableScale style={styles.signout} onPress={signOut}>
        <Text style={styles.signoutText}>Logga ut</Text>
      </PressableScale>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg, paddingHorizontal: SPACE[6] },
  header: { paddingTop: SPACE[6], paddingBottom: SPACE[4] },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 3, fontFamily: FONT.bold },
  title: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.display, letterSpacing: -0.5 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[4],
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.lg,
    padding: SPACE[4],
    marginTop: SPACE[2],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLOR.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLOR.gold, fontSize: TYPE.title, fontFamily: FONT.bold },
  identity: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.body + 2, fontFamily: FONT.display },
  email: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 2 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE[4],
    marginTop: SPACE[4],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLOR.hairline,
  },
  menuText: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  menuCount: { color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.bold },
  signout: {
    borderWidth: 1,
    borderColor: COLOR.hairline,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[4],
    alignItems: 'center',
    marginBottom: SPACE[6],
  },
  signoutText: { color: COLOR.red, fontSize: TYPE.body, fontFamily: FONT.bold },
});
