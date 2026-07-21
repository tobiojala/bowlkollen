import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { COLOR, RADIUS, SPACE, TYPE } from '@/theme';

type Step = 'email' | 'code';

export default function Login() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setStep('code');
  }

  async function verify() {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    if (error) return setError(error.message);
    // Success: onAuthStateChange in AuthProvider redirects to the app.
  }

  const disabled =
    busy || (step === 'email' ? !email.includes('@') : code.trim().length < 6);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Text style={styles.kicker}>BOWLKOLLEN</Text>
          <Text style={styles.h1}>
            {step === 'email' ? 'Logga in' : 'Ange koden'}
          </Text>
          <Text style={styles.sub}>
            {step === 'email'
              ? 'Vi skickar en engångskod till din e-post.'
              : `Skickad till ${email}`}
          </Text>

          {step === 'email' ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="namn@exempel.se"
              placeholderTextColor={COLOR.ink4}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              inputMode="email"
              autoFocus
            />
          ) : (
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={setCode}
              placeholder="00000000"
              placeholderTextColor={COLOR.ink4}
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, disabled && styles.buttonDisabled]}
            disabled={disabled}
            onPress={step === 'email' ? sendCode : verify}
          >
            {busy ? (
              <ActivityIndicator color={COLOR.bg} />
            ) : (
              <Text style={styles.buttonText}>
                {step === 'email' ? 'Skicka kod' : 'Logga in'}
              </Text>
            )}
          </Pressable>

          {step === 'code' && (
            <Pressable
              onPress={() => {
                setStep('email');
                setCode('');
                setError(null);
              }}
            >
              <Text style={styles.link}>Ändra e-post</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  flex: { flex: 1 },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACE[6],
    gap: SPACE[3],
  },
  kicker: {
    color: COLOR.gold,
    fontSize: TYPE.label,
    letterSpacing: 3,
    fontWeight: '700',
  },
  h1: {
    color: COLOR.ink,
    fontSize: TYPE.title + 12,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sub: { color: COLOR.ink3, fontSize: TYPE.body, marginBottom: SPACE[2] },
  input: {
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[4],
    color: COLOR.ink,
    fontSize: TYPE.body + 2,
  },
  codeInput: {
    fontSize: TYPE.title,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
  error: { color: COLOR.red, fontSize: TYPE.caption },
  button: {
    backgroundColor: COLOR.gold,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[4],
    alignItems: 'center',
    marginTop: SPACE[2],
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: COLOR.bg, fontSize: TYPE.body + 1, fontWeight: '700' },
  link: {
    color: COLOR.ink3,
    fontSize: TYPE.caption,
    textAlign: 'center',
    paddingVertical: SPACE[2],
  },
});
