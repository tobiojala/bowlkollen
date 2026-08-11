import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { playerChallenges, streaks, type Challenge, type PlayerMatch, type PlayerStats } from '@/lib/player-stats';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const R = 26;
const C = 2 * Math.PI * R;

// Utmaningar — challenges derived from the player's own stats, each an arc ring
// counting toward the next milestone. Gold only for a nearly-finished one.
export function ProfileChallenges({ history, stats, prevAvg }: { history: PlayerMatch[]; stats: PlayerStats; prevAvg?: number | null }) {
  const games = history.flatMap((h) => (h.series ?? []).filter((g) => g > 0));
  const challenges = playerChallenges(stats, { prevAvg, streak200Best: streaks(games, 200).best });
  if (challenges.length === 0) return null;
  const done = challenges.filter((c) => c.done).length;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>UTMANINGAR</Text>
        <Text style={styles.count}>{done} av {challenges.length} klara</Text>
      </View>
      <View style={styles.card}>
        {challenges.map((c, i) => (
          <ChallengeRow key={c.id} c={c} first={i === 0} />
        ))}
      </View>
    </View>
  );
}

function ChallengeRow({ c, first }: { c: Challenge; first: boolean }) {
  const near = !c.done && c.progress >= 85;
  const color = c.done ? COLOR.green : near ? COLOR.gold : COLOR.ink2;
  return (
    <View style={[styles.row, !first && styles.rowBorder]}>
      <View style={styles.ring}>
        <Svg width={60} height={60}>
          <Circle cx={30} cy={30} r={R} fill="none" stroke={COLOR.hairline} strokeWidth={5} />
          <Circle cx={30} cy={30} r={R} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={`${C}`} strokeDashoffset={c.done ? 0 : C * (1 - c.progress / 100)}
            transform="rotate(-90 30 30)" />
        </Svg>
        <View style={styles.ringCenter}>
          {c.done ? (
            <Ionicons name="checkmark" size={24} color={COLOR.green} />
          ) : (
            <Text style={[styles.ringPct, near && { color: COLOR.gold }]}>{c.progress}<Text style={styles.ringSign}>%</Text></Text>
          )}
        </View>
      </View>

      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, c.done && { color: COLOR.green }]} numberOfLines={1}>{c.title}</Text>
          {near && <Text style={styles.nara}>Nära</Text>}
        </View>
        <Text style={styles.desc} numberOfLines={1}>{c.desc}</Text>
        <Text style={styles.cur}>{c.cur}</Text>
      </View>

      {c.done && <Text style={styles.klar}>Klar</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SPACE[3] },
  header: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  count: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  card: { backgroundColor: COLOR.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4] },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], paddingVertical: SPACE[4] },
  rowBorder: { borderTopWidth: 1, borderTopColor: COLOR.hairline },
  ring: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringPct: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.scoreHeavy, fontVariant: ['tabular-nums'] },
  ringSign: { fontSize: TYPE.caption, color: COLOR.ink3 },
  text: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  title: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold, flexShrink: 1 },
  nara: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, backgroundColor: 'rgba(245,194,0,0.12)', paddingHorizontal: SPACE[2], paddingVertical: 2, borderRadius: RADIUS.pill, overflow: 'hidden' },
  desc: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },
  cur: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold, fontVariant: ['tabular-nums'], marginTop: 2 },
  klar: { color: COLOR.green, fontSize: TYPE.caption, fontFamily: FONT.bold },
});
