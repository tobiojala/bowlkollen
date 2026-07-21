import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut, useAuth } from '@/lib/auth';
import { COLOR, RADIUS, SPACE, TYPE } from '@/theme';

export default function Profile() {
  const { session } = useAuth();
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

      <View style={{ flex: 1 }} />

      <Pressable style={styles.signout} onPress={signOut}>
        <Text style={styles.signoutText}>Logga ut</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg, paddingHorizontal: SPACE[6] },
  header: { paddingTop: SPACE[6], paddingBottom: SPACE[4] },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 3, fontWeight: '700' },
  title: { color: COLOR.ink, fontSize: TYPE.title + 8, fontWeight: '800', letterSpacing: -0.5 },
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
  avatarText: { color: COLOR.gold, fontSize: TYPE.title, fontWeight: '800' },
  identity: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.body + 2, fontWeight: '700' },
  email: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 2 },
  signout: {
    borderWidth: 1,
    borderColor: COLOR.hairline,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[4],
    alignItems: 'center',
    marginBottom: SPACE[6],
  },
  signoutText: { color: COLOR.red, fontSize: TYPE.body, fontWeight: '700' },
});
