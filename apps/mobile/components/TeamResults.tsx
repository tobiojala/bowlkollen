import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

export type ResultRow = {
  player_name: string;
  total_result: number;
  series: number[];
  is_home_team: boolean;
  public_id: string | null;
};

// One team's player results — ranked, top scorer of the whole match flagged,
// series aligned below each name. Rows are doorways to the player.
export function TeamResults({
  teamName,
  pins,
  rows,
  topTotal,
  avgByPublicId,
  showDeltas,
}: {
  teamName: string;
  pins: number | null;
  rows: ResultRow[];
  topTotal: number;
  avgByPublicId?: Record<string, number>;
  showDeltas?: boolean;   // Pro: each serie's delta vs the player's season snitt
}) {
  const router = useRouter();
  if (rows.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionLabel} numberOfLines={1}>{teamName.toUpperCase()}</Text>
        {pins != null && <Text style={styles.teamPins}>{pins}</Text>}
      </View>
      {rows.map((r, i) => {
        const best = r.total_result === topTotal;
        return (
          <PressableScale
            key={i}
            style={styles.playerRow}
            disabled={!r.public_id}
            onPress={() => r.public_id && router.push(`/player/${r.public_id}`)}
          >
            <View style={styles.playerTop}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Text style={styles.playerName} numberOfLines={1}>{r.player_name}</Text>
              {best && <Ionicons name="trophy" size={14} color={COLOR.gold} style={styles.bestIcon} />}
              <Text style={[styles.total, best && styles.totalBest]}>{r.total_result}</Text>
            </View>
            {r.series?.length > 0 && (
              <View style={styles.seriesRow}>
                {r.series.map((g, gi) => {
                  const avg = r.public_id ? avgByPublicId?.[r.public_id] : undefined;
                  const delta = showDeltas && g > 0 && avg ? Math.round(g - avg) : null;
                  return (
                    <View key={gi} style={styles.serieCol}>
                      <Text style={styles.seriesNum}>{g}</Text>
                      {delta != null && (
                        <Text style={[styles.delta, delta >= 0 ? styles.deltaUp : styles.deltaFlat]}>
                          {delta >= 0 ? '+' : '−'}{Math.abs(delta)}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: SPACE[2] },
  sectionLabel: { flex: 1, color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  teamPins: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  playerRow: { paddingVertical: SPACE[3], borderTopWidth: 1, borderTopColor: COLOR.hairline, gap: 4 },
  playerTop: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  rank: { width: 16, color: COLOR.ink4, fontSize: TYPE.caption, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  playerName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  bestIcon: { marginRight: -2 },
  total: { color: COLOR.ink, fontSize: TYPE.body + 4, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  totalBest: { color: COLOR.gold },
  seriesRow: { flexDirection: 'row', gap: SPACE[3], marginLeft: 28, alignItems: 'flex-start' },
  serieCol: { alignItems: 'center', gap: 2 },
  seriesNum: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.regular, fontVariant: ['tabular-nums'] },
  delta: { fontSize: 11, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  deltaUp: { color: COLOR.green },
  deltaFlat: { color: COLOR.ink3 },
});
