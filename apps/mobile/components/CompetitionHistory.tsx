import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { usePlayerCompetitions } from '@/lib/competitions';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const INITIAL = 6;

// A player's BITS competition history on the profile — placings + competition
// snitt, each tappable to the competition. Renders nothing until there's data.
export function CompetitionHistory({ playerId }: { playerId: string }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const { data = [] } = usePlayerCompetitions(playerId);
  if (!data.length) return null;
  const shown = expanded ? data : data.slice(0, INITIAL);

  return (
    <View style={styles.section}>
      <Text style={styles.label}>TÄVLINGAR · {data.length}</Text>
      {shown.map((r, i) => {
        const snitt = r.total_games > 0 ? Math.round(r.total_pins / r.total_games) : null;
        const gold = r.place === 1;
        const year = r.start_date ? new Date(r.start_date + 'T12:00:00').getFullYear() : null;
        return (
          <PressableScale key={`${r.bits_competition_id}-${i}`} style={styles.row} onPress={() => router.push(`/tavlingar/${r.bits_competition_id}`)}>
            <Text style={[styles.place, gold && styles.placeGold]}>{r.place != null ? `${r.place}:a` : '–'}</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name} numberOfLines={1}>{r.competition_name}</Text>
              {year != null && <Text style={styles.year}>{year}</Text>}
            </View>
            {snitt != null && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.snitt}>{snitt}</Text>
                <Text style={styles.snittLabel}>snitt</Text>
              </View>
            )}
          </PressableScale>
        );
      })}
      {data.length > INITIAL && (
        <PressableScale onPress={() => setExpanded((v) => !v)} hitSlop={8}>
          <Text style={styles.more}>{expanded ? 'Visa färre' : `Visa alla ${data.length}`}</Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLOR.hairline },
  place: { width: 34, textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  placeGold: { color: COLOR.gold, fontFamily: FONT.bold },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  year: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 1 },
  snitt: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  snittLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.medium },
  more: { color: COLOR.gold, fontSize: TYPE.caption, fontFamily: FONT.semibold, marginTop: SPACE[3] },
});
