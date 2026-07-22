import { StyleSheet, Text, View } from 'react-native';

import { MatchRow, type MatchRowData } from '@/components/MatchRow';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

export type RoundMatch = MatchRowData & { round_id: number | null };

// Matches grouped under their omgång (round), numbered by chronological order —
// used inside the "all upcoming" / "whole season" glass sheets.
export function RoundGroups({
  matches,
  onOpenMatch,
}: {
  matches: RoundMatch[];
  onOpenMatch: (id: number) => void;
}) {
  const minDate = new Map<number, string>();
  for (const m of matches) {
    if (m.round_id == null) continue;
    const cur = minDate.get(m.round_id);
    if (!cur || m.match_date < cur) minDate.set(m.round_id, m.match_date);
  }
  const ordinal = new Map<number, number>();
  [...minDate.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .forEach(([rid], i) => ordinal.set(rid, i + 1));

  // matches arrive already sorted by the caller — group consecutive rounds.
  const groups: { key: number | null; items: RoundMatch[] }[] = [];
  let cur: { key: number | null; items: RoundMatch[] } | null = null;
  for (const m of matches) {
    if (!cur || cur.key !== m.round_id) {
      cur = { key: m.round_id, items: [] };
      groups.push(cur);
    }
    cur.items.push(m);
  }

  return (
    <View>
      {groups.map((g, gi) => (
        <View key={g.key ?? `g${gi}`} style={styles.group}>
          <Text style={styles.h}>
            {g.key != null ? `OMGÅNG ${ordinal.get(g.key)}` : 'MATCHER'}
          </Text>
          {g.items.map((m) => (
            <MatchRow
              key={m.bits_match_id}
              m={m}
              showDivision={false}
              onPress={() => onOpenMatch(m.bits_match_id)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: SPACE[4] },
  h: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginBottom: SPACE[2],
  },
});
