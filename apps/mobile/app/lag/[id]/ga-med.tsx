import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { useTeam } from '@/lib/team-data';
import { useJoinTeam } from '@/lib/team-admin';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export default function JoinTeam() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);

  const { data: team } = useTeam(teamId);
  const join = useJoinTeam(teamId);
  const [lic, setLic] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<'verified' | 'pending' | null>(null);

  const name = team?.name ?? 'Laget';

  const submit = () =>
    join.mutate({ licNbr: lic, inviteCode: code.trim() || null }, { onSuccess: (status) => setResult(status) });

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]} keyboardShouldPersistTaps="handled">
        {result ? (
          <View style={styles.done}>
            <Ionicons
              name={result === 'verified' ? 'checkmark-circle' : 'time'}
              size={56}
              color={result === 'verified' ? COLOR.green : COLOR.gold}
            />
            <Text style={styles.doneTitle}>{result === 'verified' ? 'Välkommen i laget!' : 'Skickad för granskning'}</Text>
            <Text style={styles.doneBody}>
              {result === 'verified'
                ? 'Du är nu medlem. Du kan svara på närvaro och se lagets svar under Mitt lag.'
                : 'Vi granskar din koppling manuellt. Du hör av oss när den är godkänd.'}
            </Text>
            <PressableScale style={styles.primary} onPress={() => router.back()}>
              <Text style={styles.primaryText}>Klar</Text>
            </PressableScale>
          </View>
        ) : (
          <>
            <View style={styles.head}>
              <IdentityAvatar colors={teamColor(name)} initials={teamInitials(name)} size={56} />
              <View style={styles.headText}>
                <Text style={styles.kicker}>GÅ MED I LAGET</Text>
                <Text style={styles.h1} numberOfLines={2}>{name}</Text>
              </View>
            </View>
            <Text style={styles.lead}>
              Spelar du i {name}? Har du en inbjudningskod från laget blir du medlem direkt. Annars
              anger du ditt licensnummer och kopplingen granskas först.
            </Text>

            <Text style={styles.label}>INBJUDNINGSKOD (OM DU HAR EN)</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Kod från laget"
              placeholderTextColor={COLOR.ink4}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Text style={styles.label}>LICENSNUMMER</Text>
            <TextInput
              style={styles.input}
              value={lic}
              onChangeText={setLic}
              placeholder="t.ex. M271208ERI01"
              placeholderTextColor={COLOR.ink4}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Med en giltig kod kopplas du direkt (någon i laget har bjudit in dig). Utan kod granskas
              kopplingen manuellt. Alla går med som spelare — roller (kapten m.m.) sätter laget själva efteråt.
            </Text>

            <PressableScale
              style={[styles.primary, (!lic.trim() || join.isPending) && styles.primaryOff]}
              onPress={submit}
              disabled={!lic.trim() || join.isPending}
            >
              {join.isPending ? <ActivityIndicator color={COLOR.bg} /> : <Text style={styles.primaryText}>Gå med</Text>}
            </PressableScale>
            {join.isError && <Text style={styles.error}>Något gick fel. Kontrollera licensnumret och försök igen.</Text>}
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

  head: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4] },
  headText: { flex: 1, minWidth: 0 },
  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: 2 },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 2, fontFamily: FONT.bold, letterSpacing: -0.4 },
  lead: { color: COLOR.ink2, fontSize: TYPE.body, marginTop: SPACE[4], lineHeight: 22 },

  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginTop: SPACE[6] },
  input: { backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[4], color: COLOR.ink, fontSize: TYPE.body, marginTop: SPACE[2] },
  hint: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: SPACE[2], lineHeight: 19 },

  primary: { marginTop: SPACE[6], backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingVertical: SPACE[4], alignItems: 'center' },
  primaryOff: { opacity: 0.5 },
  primaryText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },
  error: { color: COLOR.red, fontSize: TYPE.caption, marginTop: SPACE[3], textAlign: 'center' },

  done: { alignItems: 'center', paddingTop: SPACE[16], gap: SPACE[3] },
  doneTitle: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold },
  doneBody: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', lineHeight: 22, paddingHorizontal: SPACE[4] },
});
