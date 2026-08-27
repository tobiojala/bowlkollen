import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Delmatch, DelmatchPlayer, DelmatchSerie, DelmatchSummary } from '@/lib/delmatch';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

type Avg = Record<string, number>;

// The 2v2 (or 1v1) bord head-to-head, reconstructed from BITS. Per serie, each
// physical bord shows the home konstellation against the away one, who took the
// delmatch, and the serie pinfall bonus — the real duel, not BITS' dense table.
// Winner is carried by weight + a check icon, never colour alone (senior-legible).
export function DelmatchBoard({
  summary,
  onOpenPlayer,
  avg,
  showDeltas,
}: {
  summary: DelmatchSummary;
  onOpenPlayer: (publicId: string) => void;
  avg?: Avg;                // Pro: per-player season serie-average
  showDeltas?: boolean;     // Pro: each player's score + delta vs snitt
}) {
  if (!summary.hasData) {
    return <Text style={styles.empty}>Bordsdata saknas för den här matchen.</Text>;
  }

  return (
    <View>
      <View style={styles.tally}>
        <Text style={styles.tallyLabel}>BANPOÄNG</Text>
        <View style={styles.tallyRow}>
          <Text style={[styles.tallyNum, side(summary.homeBanp, summary.awayBanp) === 'home' && styles.tallyWin]}>
            {summary.homeBanp}
          </Text>
          <Text style={styles.tallySep}>–</Text>
          <Text style={[styles.tallyNum, side(summary.awayBanp, summary.homeBanp) === 'away' && styles.tallyWin]}>
            {summary.awayBanp}
          </Text>
        </View>
      </View>

      {summary.series.map((s) => (
        <SerieBlock key={s.serie} serie={s} onOpenPlayer={onOpenPlayer} avg={avg} showDeltas={showDeltas} />
      ))}
    </View>
  );
}

function SerieBlock({ serie, onOpenPlayer, avg, showDeltas }: { serie: DelmatchSerie; onOpenPlayer: (id: string) => void; avg?: Avg; showDeltas?: boolean }) {
  return (
    <View style={styles.serie}>
      <View style={styles.serieHead}>
        <Text style={styles.serieLabel}>SERIE {serie.serie}</Text>
        <View style={styles.pinfall}>
          <Text style={[styles.pinNum, serie.pinfallWinner === 'home' && styles.pinWin]}>{serie.homePinfall}</Text>
          <Text style={styles.pinSep}>–</Text>
          <Text style={[styles.pinNum, serie.pinfallWinner === 'away' && styles.pinWin]}>{serie.awayPinfall}</Text>
          <Ionicons name="flame" size={13} color={COLOR.ink3} style={{ marginLeft: 4 }} />
        </View>
      </View>

      {serie.tables.map((d) => (
        <BordRow key={d.tableNo} d={d} onOpenPlayer={onOpenPlayer} avg={avg} showDeltas={showDeltas} />
      ))}
    </View>
  );
}

function BordRow({ d, onOpenPlayer, avg, showDeltas }: { d: Delmatch; onOpenPlayer: (id: string) => void; avg?: Avg; showDeltas?: boolean }) {
  const homeWon = d.winner === 'home';
  const awayWon = d.winner === 'away';
  return (
    <View style={styles.bord}>
      <View style={[styles.namesCol, { alignItems: 'flex-start' }]}>
        {d.home.map((p, i) => (
          <Fragment key={i}>
            <PlayerName p={p} align="left" onOpenPlayer={onOpenPlayer} avg={avg} showDeltas={showDeltas} />
          </Fragment>
        ))}
      </View>

      <View style={styles.scoreCol}>
        <View style={styles.scoreRow}>
          {homeWon && <Ionicons name="checkmark" size={16} color={COLOR.green} />}
          <Text style={[styles.score, homeWon ? styles.scoreWin : awayWon ? styles.scoreLose : styles.scoreTie]}>
            {d.homeTotal}
          </Text>
          <Text style={styles.scoreSep}>–</Text>
          <Text style={[styles.score, awayWon ? styles.scoreWin : homeWon ? styles.scoreLose : styles.scoreTie]}>
            {d.awayTotal}
          </Text>
          {awayWon && <Ionicons name="checkmark" size={16} color={COLOR.green} />}
        </View>
        <Text style={styles.bordLabel}>BORD {d.tableNo}</Text>
      </View>

      <View style={[styles.namesCol, { alignItems: 'flex-end' }]}>
        {d.away.map((p, i) => (
          <Fragment key={i}>
            <PlayerName p={p} align="right" onOpenPlayer={onOpenPlayer} avg={avg} showDeltas={showDeltas} />
          </Fragment>
        ))}
      </View>
    </View>
  );
}

function PlayerName({
  p,
  align,
  onOpenPlayer,
  avg,
  showDeltas,
}: {
  p: DelmatchPlayer;
  align: 'left' | 'right';
  onOpenPlayer: (id: string) => void;
  avg?: Avg;
  showDeltas?: boolean;
}) {
  const tappable = !!p.publicId;
  const a = showDeltas && p.publicId ? avg?.[p.publicId] : undefined;
  const delta = a != null ? Math.round(p.score - a) : null;
  return (
    <Pressable disabled={!tappable} onPress={() => p.publicId && onOpenPlayer(p.publicId)} hitSlop={6}>
      <Text style={[styles.name, { textAlign: align }, tappable && styles.nameLink]} numberOfLines={1}>
        {p.name}
      </Text>
      {showDeltas && (
        <View style={[styles.scoreLine, align === 'right' && styles.scoreLineRight]}>
          <Text style={styles.playerScore}>{p.score}</Text>
          {delta != null && (
            <Text style={[styles.playerDelta, delta >= 0 ? styles.deltaUp : styles.deltaFlat]}>
              {delta >= 0 ? '+' : '−'}{Math.abs(delta)}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const side = (a: number, b: number): 'home' | 'away' | 'tie' => (a > b ? 'home' : b > a ? 'away' : 'tie');

const styles = StyleSheet.create({
  empty: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', paddingVertical: SPACE[8] },

  tally: { alignItems: 'center', marginBottom: SPACE[6] },
  tallyLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  tallyRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE[3], marginTop: 2 },
  tallyNum: { color: COLOR.ink3, fontSize: TYPE.hero - 8, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  tallyWin: { color: COLOR.ink },
  tallySep: { color: COLOR.ink4, fontSize: TYPE.title, fontFamily: FONT.score },

  serie: { marginBottom: SPACE[6] },
  serieHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACE[3], paddingBottom: SPACE[2],
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLOR.surface2,
  },
  serieLabel: { color: COLOR.ink2, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  pinfall: { flexDirection: 'row', alignItems: 'center' },
  pinNum: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold, fontVariant: ['tabular-nums'] },
  pinWin: { color: COLOR.ink2 },
  pinSep: { color: COLOR.ink4, fontSize: TYPE.caption, marginHorizontal: 3 },

  bord: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE[3], gap: SPACE[2] },
  namesCol: { flex: 1, minWidth: 0, gap: 2 },
  name: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  nameLink: { color: COLOR.ink },
  scoreLine: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 1 },
  scoreLineRight: { justifyContent: 'flex-end' },
  playerScore: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  playerDelta: { fontSize: 10, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  deltaUp: { color: COLOR.green },
  deltaFlat: { color: COLOR.ink3 },

  scoreCol: { alignItems: 'center', minWidth: 116 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  score: { fontSize: TYPE.title, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  scoreWin: { color: COLOR.green },
  scoreLose: { color: COLOR.ink3 },
  scoreTie: { color: COLOR.ink2 },
  scoreSep: { color: COLOR.ink4, fontSize: TYPE.body, fontFamily: FONT.score },
  bordLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, marginTop: 1 },
});
