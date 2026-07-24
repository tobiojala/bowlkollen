import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { supabase } from '@/lib/supabase';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const SEARCH_MIN = 2;

type Player = { public_id: string; first_name: string | null; sur_name: string | null; club_name: string | null };
const fullName = (p: Player) => `${p.first_name ?? ''} ${p.sur_name ?? ''}`.trim();

function useSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['claim-search', q],
    enabled: q.length >= SEARCH_MIN,
    queryFn: async (): Promise<Player[]> => {
      const { data } = await supabase
        .from('bits_players')
        .select('public_id, first_name, sur_name, club_name')
        .or(`first_name.ilike.%${q}%,sur_name.ilike.%${q}%`)
        .limit(25);
      return data ?? [];
    },
  });
}

export default function ClaimPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 220);
    return () => clearTimeout(t);
  }, [text]);

  const [selected, setSelected] = useState<Player | null>(null);
  const [lic, setLic] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'verified' | 'pending' | null>(null);

  const { data: results = [], isFetching } = useSearch(debounced);

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('submit_player_claim', {
      p_public_id: selected.public_id,
      p_lic_nbr: lic.trim(), // empty -> unmatched -> pending (manual review)
    });
    setBusy(false);
    if (error) return;
    const res = data as { status: 'verified' | 'pending' } | null;
    setResult(res?.status ?? 'pending');
    qc.invalidateQueries({ queryKey: ['my-claim'] });
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]} keyboardShouldPersistTaps="handled">
        {result ? (
          <View style={styles.done}>
            <Ionicons name={result === 'verified' ? 'checkmark-circle' : 'time'} size={56} color={result === 'verified' ? COLOR.green : COLOR.gold} />
            <Text style={styles.doneTitle}>{result === 'verified' ? 'Kopplad!' : 'Skickad för granskning'}</Text>
            <Text style={styles.doneBody}>
              {result === 'verified'
                ? 'Din spelarprofil är nu kopplad till ditt konto.'
                : 'Vi granskar din koppling manuellt. Du hör av oss när den är godkänd.'}
            </Text>
            <PressableScale style={styles.primary} onPress={() => router.back()}>
              <Text style={styles.primaryText}>Klar</Text>
            </PressableScale>
          </View>
        ) : selected ? (
          <>
            <Text style={styles.h1}>Bekräfta din profil</Text>
            <View style={styles.selected}>
              <IdentityAvatar colors={teamColor(fullName(selected))} initials={teamInitials(fullName(selected))} size={56} />
              <View style={styles.who}>
                <Text style={styles.name} numberOfLines={1}>{fullName(selected)}</Text>
                {!!selected.club_name && <Text style={styles.club} numberOfLines={1}>{selected.club_name}</Text>}
              </View>
              <PressableScale onPress={() => setSelected(null)} hitSlop={8}>
                <Text style={styles.change}>Byt</Text>
              </PressableScale>
            </View>

            <Text style={styles.label}>Licensnummer</Text>
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
              Matchar licensen kopplas profilen direkt. Utan licens granskas kopplingen manuellt.
            </Text>

            <PressableScale style={[styles.primary, busy && styles.primaryBusy]} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color={COLOR.bg} /> : <Text style={styles.primaryText}>Koppla profil</Text>}
            </PressableScale>
          </>
        ) : (
          <>
            <Text style={styles.h1}>Koppla din spelare</Text>
            <Text style={styles.lead}>Sök upp dig själv för att koppla din spelarprofil till kontot.</Text>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Sök ditt namn…"
              placeholderTextColor={COLOR.ink4}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {debounced.trim().length >= SEARCH_MIN && !isFetching && results.length === 0 && (
              <Text style={styles.empty}>Inga träffar.</Text>
            )}
            {results.map((p) => (
              <PressableScale key={p.public_id} style={styles.row} onPress={() => { setSelected(p); setText(''); }}>
                <IdentityAvatar colors={teamColor(fullName(p))} initials={teamInitials(fullName(p))} size={38} />
                <View style={styles.who}>
                  <Text style={styles.rowName} numberOfLines={1}>{fullName(p)}</Text>
                  {!!p.club_name && <Text style={styles.rowClub} numberOfLines={1}>{p.club_name}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
              </PressableScale>
            ))}
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
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[12] },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 4, fontFamily: FONT.bold, letterSpacing: -0.5 },
  lead: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[2], marginBottom: SPACE[4], lineHeight: 22 },

  input: {
    backgroundColor: COLOR.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[4],
    color: COLOR.ink,
    fontSize: TYPE.body,
    marginTop: SPACE[2],
  },
  empty: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', paddingVertical: SPACE[6] },

  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderTopWidth: 1, borderTopColor: COLOR.hairline },
  who: { flex: 1, minWidth: 0 },
  rowName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  rowClub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },

  selected: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], marginTop: SPACE[4], padding: SPACE[4], backgroundColor: COLOR.surface, borderRadius: RADIUS.lg },
  name: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, letterSpacing: -0.3 },
  club: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 2 },
  change: { color: COLOR.gold, fontSize: TYPE.caption, fontFamily: FONT.bold },

  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginTop: SPACE[6] },
  hint: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: SPACE[2], lineHeight: 19 },

  primary: { marginTop: SPACE[6], backgroundColor: COLOR.gold, borderRadius: RADIUS.pill, paddingVertical: SPACE[4], alignItems: 'center' },
  primaryBusy: { opacity: 0.7 },
  primaryText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },

  done: { alignItems: 'center', paddingTop: SPACE[16], gap: SPACE[3] },
  doneTitle: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold },
  doneBody: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', lineHeight: 22, paddingHorizontal: SPACE[4] },
});
