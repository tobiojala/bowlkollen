import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { useCompetitions, useCompetitionSeasons, type CompRow } from '@/lib/competitions';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const MON = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const dateTag = (s: string | null) => { if (!s) return ''; const d = new Date(s + 'T12:00:00'); return `${d.getDate()} ${MON[d.getMonth()]}`; };
const seasonLabel = (y: number) => `${String(y).slice(2)}/${String((y + 1) % 100).padStart(2, '0')}`;

export default function TavlingsResultat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: seasons = [] } = useCompetitionSeasons();
  const [season, setSeason] = useState<number | null>(null);
  const active = season ?? seasons[0] ?? new Date().getFullYear();
  const { data: comps = [] } = useCompetitions(active);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? comps.filter((c) => c.name.toLowerCase().includes(t) || (c.hall_city ?? '').toLowerCase().includes(t)) : comps;
  }, [q, comps]);

  return (
    <View style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => String(c.bits_competition_id)}
        renderItem={({ item }) => <Row c={item} onPress={() => router.push(`/tavlingar/${item.bits_competition_id}`)} />}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 64 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.h1}>Tävlingsresultat</Text>
            <Text style={styles.sub}>Officiella resultat från BITS · {comps.length} tävlingar</Text>
            {seasons.length > 1 && (
              <View style={styles.pills}>
                {seasons.map((y) => (
                  <PressableScale key={y} onPress={() => setSeason(y)} style={[styles.pill, y === active && styles.pillOn]}>
                    <Text style={[styles.pillText, y === active && styles.pillTextOn]}>{seasonLabel(y)}</Text>
                  </PressableScale>
                ))}
              </View>
            )}
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={COLOR.ink3} />
              <TextInput value={q} onChangeText={setQ} placeholder="Sök tävling eller ort" placeholderTextColor={COLOR.ink4}
                style={styles.searchInput} autoCapitalize="none" autoCorrect={false} />
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Inga tävlingar.</Text>}
      />
      <View style={[styles.back, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function Row({ c, onPress }: { c: CompRow; onPress: () => void }) {
  return (
    <PressableScale style={styles.row} onPress={onPress}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[dateTag(c.start_date), c.hall_city].filter(Boolean).join('  ·  ')}{!c.results_synced ? '  ·  resultat kommer' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  list: { paddingHorizontal: SPACE[4], paddingBottom: 120 },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 4, fontFamily: FONT.bold, letterSpacing: -0.5 },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2], marginTop: SPACE[4] },
  pill: { paddingHorizontal: SPACE[4], paddingVertical: SPACE[2], borderRadius: RADIUS.pill, backgroundColor: COLOR.surface },
  pillOn: { backgroundColor: COLOR.gold },
  pillText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.bold },
  pillTextOn: { color: COLOR.bg },
  search: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], backgroundColor: COLOR.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], marginTop: SPACE[4], marginBottom: SPACE[2] },
  searchInput: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.regular },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLOR.hairline },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },
  empty: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', paddingVertical: SPACE[8] },
  back: { position: 'absolute', left: 16 },
});
