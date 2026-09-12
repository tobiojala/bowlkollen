import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/PressableScale';
import { SessionLogger } from '@/components/SessionLogger';
import { SparAnalys } from '@/components/SparAnalys';
import { COLOR, FONT, SPACE } from '@/theme';

// Mina spel — log a game via the pin deck (Logga spel) and the Spärranalys it
// feeds. Parity with the web /mina-spel hub.
export default function MinaSpel() {
  const router = useRouter();
  const [tab, setTab] = useState<'log' | 'analys'>('log');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLOR.bg }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.top}>
        <PressableScale onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={COLOR.ink} /></PressableScale>
        <Text style={s.eyebrow}>BOWLKOLLEN</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACE[4], paddingBottom: SPACE[16] }}>
        <Text style={s.h1}>Mina spel</Text>
        <View style={s.tabs}>
          <PressableScale style={[s.tab, tab === 'log' && s.tabOn]} onPress={() => setTab('log')}><Text style={[s.tabT, tab === 'log' && s.tabTOn]}>Logga spel</Text></PressableScale>
          <PressableScale style={[s.tab, tab === 'analys' && s.tabOn]} onPress={() => setTab('analys')}><Text style={[s.tabT, tab === 'analys' && s.tabTOn]}>Spärranalys</Text></PressableScale>
        </View>
        {tab === 'log' ? <SessionLogger onSaved={() => setTab('analys')} /> : <SparAnalys />}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingHorizontal: SPACE[4], paddingVertical: SPACE[2] },
  eyebrow: { fontFamily: FONT.display, fontSize: 13, letterSpacing: 2, color: COLOR.gold },
  h1: { fontFamily: FONT.bold, fontSize: 30, color: COLOR.ink, letterSpacing: -1, marginTop: SPACE[2], marginBottom: SPACE[4] },
  tabs: { flexDirection: 'row', gap: 4, backgroundColor: COLOR.surface, borderRadius: 999, padding: 4, alignSelf: 'flex-start', marginBottom: SPACE[6] },
  tab: { paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999 },
  tabOn: { backgroundColor: COLOR.surface2 },
  tabT: { fontFamily: FONT.bold, fontSize: 14, color: COLOR.ink3 },
  tabTOn: { color: COLOR.ink },
});
