import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/PressableScale';
import { signOut } from '@/lib/auth';
import { messageForRedeemError, useRedeemInvite } from '@/lib/invites';
import { clearPendingInvite, getPendingInvite } from '@/lib/pending-invite';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// The closed-beta gate: no valid invite, no entry. Redeeming a team code makes the
// user a verified member, which flips the parent (useMyTeams) past this screen.
// Shown as the first step of onboarding; there is deliberately no skip.
export function InviteGate() {
  const redeem = useRedeemInvite();
  const [code, setCode] = useState('');

  // A code stashed from a tapped link (before login) auto-redeems here.
  useEffect(() => {
    let active = true;
    getPendingInvite().then((c) => {
      if (active && c) {
        setCode(c);
        redeem.mutate(c);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once we're in, the stashed code has done its job.
  useEffect(() => {
    if (redeem.isSuccess) void clearPendingInvite();
  }, [redeem.isSuccess]);

  const submit = () => code.trim() && redeem.mutate(code);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.badge}>
          <Ionicons name="lock-closed" size={22} color={COLOR.gold} />
        </View>
        <Text style={styles.kicker}>STÄNGD BETA</Text>
        <Text style={styles.h1}>Du behöver en inbjudan</Text>
        <Text style={styles.lead}>
          Bowlkollen är i stängd test just nu. Ange koden från din inbjudningslänk för att komma in
          och gå med i ditt lag.
        </Text>

        {redeem.isSuccess ? (
          <View style={styles.success}>
            <ActivityIndicator color={COLOR.gold} />
            <Text style={styles.successText}>Välkommen! Laddar ditt lag…</Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Klistra in din inbjudningskod"
              placeholderTextColor={COLOR.ink4}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={!code}
            />
            <PressableScale
              style={[styles.primary, (!code.trim() || redeem.isPending) && styles.primaryOff]}
              onPress={submit}
              disabled={!code.trim() || redeem.isPending}
              haptic
            >
              {redeem.isPending ? <ActivityIndicator color={COLOR.bg} /> : <Text style={styles.primaryText}>Lös in</Text>}
            </PressableScale>
            {redeem.isError && <Text style={styles.error}>{messageForRedeemError(redeem.error)}</Text>}
          </>
        )}
      </View>

      <PressableScale style={styles.signout} onPress={signOut} hitSlop={8}>
        <Text style={styles.signoutText}>Logga ut</Text>
      </PressableScale>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg, justifyContent: 'space-between' },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACE[6] },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,194,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.24)',
    marginBottom: SPACE[4],
  },
  kicker: { color: COLOR.gold, fontSize: TYPE.label, letterSpacing: 3, fontFamily: FONT.bold },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.bold, letterSpacing: -0.5, marginTop: SPACE[2] },
  lead: { color: COLOR.ink2, fontSize: TYPE.body, marginTop: SPACE[3], lineHeight: 22 },

  input: {
    backgroundColor: COLOR.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[4],
    color: COLOR.ink,
    fontSize: TYPE.body,
    marginTop: SPACE[8],
  },
  primary: { marginTop: SPACE[4], backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingVertical: SPACE[4], alignItems: 'center' },
  primaryOff: { opacity: 0.5 },
  primaryText: { color: COLOR.bg, fontSize: TYPE.body + 1, fontFamily: FONT.bold },
  error: { color: COLOR.red, fontSize: TYPE.caption, marginTop: SPACE[3], textAlign: 'center' },

  success: { alignItems: 'center', gap: SPACE[3], marginTop: SPACE[8] },
  successText: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold },

  signout: { alignItems: 'center', paddingVertical: SPACE[4] },
  signoutText: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
});
