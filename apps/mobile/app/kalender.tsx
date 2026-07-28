import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { useCalendarSubs, type CalSub, type SubType } from '@/lib/calendar-subs';
import { useMyTeams } from '@/lib/me';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Divisions the user follows, resolved to names (best-effort).
function useFollowedDivisions() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['followed-divisions', uid],
    enabled: !!uid,
    queryFn: async (): Promise<{ id: number; name: string }[]> => {
      const { data: f } = await supabase.from('follows').select('entity_id').eq('user_id', uid!).eq('entity_type', 'division');
      const ids = (f ?? []).map((r) => Number(r.entity_id)).filter((n) => n > 0);
      if (ids.length === 0) return [];
      const { data: d } = await supabase.from('bits_divisions').select('bits_division_id, name').in('bits_division_id', ids);
      return (d ?? []).map((x) => ({ id: x.bits_division_id as number, name: x.name as string }));
    },
  });
}

export default function KalenderPanel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subs, busy, isSubscribed, toggle, refresh } = useCalendarSubs();
  const { data: teams = [] } = useMyTeams();
  const { data: divisions = [] } = useFollowedDivisions();

  const known = new Set([...teams.map((t) => `team:${t.teamId}`), ...divisions.map((d) => `division:${d.id}`)]);
  const orphans = subs.filter((s) => !known.has(`${s.type}:${s.id}`));

  const onToggle = async (sub: CalSub) => {
    const res = await toggle(sub);
    if (!res.ok && res.reason === 'permission') {
      Alert.alert('Kalenderåtkomst nekad', 'Tillåt Bowlkollen att lägga till i din kalender i Inställningar.');
    }
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}>
        <Text style={styles.kicker}>KALENDER</Text>
        <Text style={styles.h1}>Prenumerationer</Text>
        <Text style={styles.lead}>Lägg lags och divisioners matcher i din kalender. Avsluta när du vill.</Text>

        {subs.length > 0 && (
          <PressableScale style={styles.refresh} onPress={refresh} disabled={busy}>
            <Ionicons name="refresh" size={18} color={COLOR.ink2} />
            <Text style={styles.refreshText}>Uppdatera kalender</Text>
          </PressableScale>
        )}

        {teams.length > 0 && (
          <Section label="DINA LAG">
            {teams.map((t) => (
              <Row key={t.teamId} name={t.name} on={isSubscribed('team', t.teamId)} busy={busy} onPress={() => onToggle({ type: 'team', id: t.teamId, name: t.name })} />
            ))}
          </Section>
        )}

        {divisions.length > 0 && (
          <Section label="DIVISIONER DU FÖLJER">
            {divisions.map((d) => (
              <Row key={d.id} name={d.name} on={isSubscribed('division', d.id)} busy={busy} onPress={() => onToggle({ type: 'division', id: d.id, name: d.name })} />
            ))}
          </Section>
        )}

        {orphans.length > 0 && (
          <Section label="ÖVRIGA PRENUMERATIONER">
            {orphans.map((s) => (
              <Row key={`${s.type}-${s.id}`} name={s.name} on busy={busy} onPress={() => onToggle(s)} />
            ))}
          </Section>
        )}

        {teams.length === 0 && divisions.length === 0 && orphans.length === 0 && (
          <Text style={styles.empty}>Gå med i ett lag eller följ en division för att prenumerera.</Text>
        )}
      </ScrollView>

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ name, on, busy, onPress }: { name: string; on: boolean; busy: boolean; onPress: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
      <PressableScale style={[styles.pill, on && styles.pillOn]} onPress={onPress} disabled={busy}>
        <Ionicons name={on ? 'checkmark' : 'add'} size={16} color={on ? COLOR.bg : COLOR.gold} />
        <Text style={[styles.pillText, on && styles.pillTextOn]}>{on ? 'Prenumererar' : 'Prenumerera'}</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[16] },
  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 6, fontFamily: FONT.bold, letterSpacing: -0.5 },
  lead: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[2], lineHeight: 22 },

  refresh: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[2], marginTop: SPACE[6], paddingVertical: SPACE[3], borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLOR.hairline },
  refreshText: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.bold },

  section: { marginTop: SPACE[8] },
  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  rowName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLOR.gold },
  pillOn: { backgroundColor: COLOR.gold },
  pillText: { color: COLOR.gold, fontSize: TYPE.caption, fontFamily: FONT.bold },
  pillTextOn: { color: COLOR.bg },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
