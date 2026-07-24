import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { messageForRedeemError, useRedeemInvite, type RedeemResult } from '@/lib/invites';
import { useTeam } from '@/lib/team-data';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export default function InvitePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Accept a code from a deep link (/invite?code=…) so a tapped link pre-fills it.
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();

  const redeem = useRedeemInvite();
  const [code, setCode] = useState(codeParam ?? '');
  const [result, setResult] = useState<RedeemResult | null>(null);
  const { data: team } = useTeam(result?.teamId ?? 0);

  // Auto-redeem when arriving via a link with a code.
  useEffect(() => {
    if (codeParam && !result && !redeem.isPending) {
      redeem.mutate(codeParam, { onSuccess: setResult });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  const submit = () => code.trim() && redeem.mutate(code, { onSuccess: setResult });

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]} keyboardShouldPersistTaps="handled">
        {result ? (
          <View style={styles.done}>
            <Ionicons name="checkmark-circle" size={56} color={COLOR.green} />
            <Text style={styles.doneTitle}>Välkommen i laget!</Text>
            <Text style={styles.doneBody}>
              Du är nu {result.role === 'captain' ? 'kapten' : 'medlem'} i {team?.name ?? 'laget'}.
              {result.role === 'captain' ? ' Du kan sätta laguppställning och bjuda in lagkamrater.' : ' Du kan svara på närvaro under Mitt lag.'}
            </Text>
            <PressableScale style={styles.primary} onPress={() => router.replace(`/lag/${result.teamId}/laget`)}>
              <Text style={styles.primaryText}>Till Mitt lag</Text>
            </PressableScale>
          </View>
        ) : (
          <>
            <Text style={styles.kicker}>INBJUDNINGSKOD</Text>
            <Text style={styles.h1}>Gå med via inbjudan</Text>
            <Text style={styles.lead}>
              Har du fått en inbjudningskod från ditt lag eller en länk? Lös in den här så blir du
              medlem direkt — ingen licens behövs.
            </Text>

            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Klistra in koden"
              placeholderTextColor={COLOR.ink4}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={!codeParam}
            />

            <PressableScale
              style={[styles.primary, (!code.trim() || redeem.isPending) && styles.primaryOff]}
              onPress={submit}
              disabled={!code.trim() || redeem.isPending}
            >
              {redeem.isPending ? <ActivityIndicator color={COLOR.bg} /> : <Text style={styles.primaryText}>Lös in</Text>}
            </PressableScale>
            {redeem.isError && <Text style={styles.error}>{messageForRedeemError(redeem.error)}</Text>}
          </>
        )}
      </ScrollView>

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[16] },

  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 4, fontFamily: FONT.bold, letterSpacing: -0.5 },
  lead: { color: COLOR.ink2, fontSize: TYPE.body, marginTop: SPACE[3], lineHeight: 22 },

  input: { backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[4], color: COLOR.ink, fontSize: TYPE.body, marginTop: SPACE[6] },
  primary: { marginTop: SPACE[4], backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingVertical: SPACE[4], alignItems: 'center' },
  primaryOff: { opacity: 0.5 },
  primaryText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },
  error: { color: COLOR.red, fontSize: TYPE.caption, marginTop: SPACE[3], textAlign: 'center' },

  done: { alignItems: 'center', paddingTop: SPACE[16], gap: SPACE[3] },
  doneTitle: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold },
  doneBody: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', lineHeight: 22, paddingHorizontal: SPACE[4] },
});
