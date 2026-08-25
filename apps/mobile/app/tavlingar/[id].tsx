import { useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { useCompetition, type CompResult } from '@/lib/competitions';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const MON = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
function dateRange(from: string | null, to: string | null): string {
  const f = (s: string) => { const d = new Date(s + 'T12:00:00'); return `${d.getDate()} ${MON[d.getMonth()]}`; };
  if (from && to && from !== to) return `${f(from)}–${f(to)} ${new Date(to + 'T12:00:00').getFullYear()}`;
  const one = to ?? from;
  return one ? `${f(one)} ${new Date(one + 'T12:00:00').getFullYear()}` : '';
}

export default function CompetitionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useCompetition(Number(id));
  const comp = data?.comp;
  const results = data?.results ?? [];
  const links = data?.links ?? {};

  const classes = [...new Set(results.map((r) => r.result_row_nbr))].sort((a, b) => a - b);
  const meta = comp ? [comp.hall, comp.hall_city].filter(Boolean).join(', ') : '';

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 64 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>TÄVLING</Text>
        <Text style={styles.h1}>{comp?.name ?? ''}</Text>
        {comp && <Text style={styles.sub}>{[dateRange(comp.start_date, comp.end_date), meta].filter(Boolean).join('  ·  ')}</Text>}

        {results.length === 0 ? (
          <Text style={styles.empty}>Resultat inte inlästa ännu.</Text>
        ) : classes.map((cls) => (
          <View key={cls} style={styles.classBlock}>
            {classes.length > 1 && <Text style={styles.classLabel}>KLASS {cls}</Text>}
            {results.filter((r) => r.result_row_nbr === cls).map((r, i) => (
              <Fragment key={`${cls}-${r.place}-${i}`}>
                <ResultLine r={r} publicId={r.lic_nbr ? links[r.lic_nbr] : undefined} onOpen={(pid) => router.push(`/player/${pid}`)} />
              </Fragment>
            ))}
          </View>
        ))}
      </ScrollView>
      <View style={[styles.back, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function ResultLine({ r, publicId, onOpen }: { r: CompResult; publicId?: string; onOpen: (pid: string) => void }) {
  const snitt = r.total_games > 0 ? Math.round(r.total_pins / r.total_games) : null;
  const gold = r.place === 1;
  return (
    <PressableScale disabled={!publicId} onPress={() => publicId && onOpen(publicId)} style={styles.line}>
      <Text style={[styles.place, gold && styles.placeGold]}>{r.place ?? '–'}</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.name, publicId ? styles.nameLink : null]} numberOfLines={1}>{r.player_name ?? '–'}</Text>
        {!!r.club_name && <Text style={styles.club} numberOfLines={1}>{r.club_name}</Text>}
      </View>
      {snitt != null && (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.snitt}>{snitt}</Text>
          <Text style={styles.snittLabel}>snitt · {r.total_games} sr</Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  scroll: { paddingHorizontal: SPACE[4], paddingBottom: 120 },
  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 2, fontFamily: FONT.bold, letterSpacing: -0.5, marginTop: 4 },
  sub: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: SPACE[2] },
  empty: { color: COLOR.ink3, fontSize: TYPE.caption, textAlign: 'center', paddingVertical: SPACE[8] },
  classBlock: { marginTop: SPACE[6] },
  classLabel: { color: COLOR.ink2, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, marginBottom: SPACE[2] },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLOR.hairline },
  place: { width: 30, textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  placeGold: { color: COLOR.gold, fontFamily: FONT.bold },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  nameLink: { color: COLOR.ink },
  club: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 1 },
  snitt: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  snittLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.medium },
  back: { position: 'absolute', left: 16 },
});
