import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlayerDelmatchRecord } from '@/lib/delmatch';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// The "Delmatch" section on a player profile: their head-to-head duel record,
// milestones, fiercest rivalries and best partners — reconstructed from BITS bord
// data. Never renders for a player with no delmatch history. Records are shown as
// numbers (win first), so meaning never rides on colour alone.
export function PlayerDelmatchCard({
  record,
  firstName,
  onOpenPlayer,
  onShare,
}: {
  record: PlayerDelmatchRecord;
  firstName: string;
  onOpenPlayer: (publicId: string) => void;
  onShare?: () => void;
}) {
  if (!record.hasData) return null;
  const { record: r, milestones: m, rivalries, partners, recent } = record;
  const has2v2 = partners.length > 0;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionLabel}>BORD</Text>
        {onShare && (
          <Pressable style={styles.share} onPress={onShare} hitSlop={8} accessibilityLabel="Dela delmatchfacit">
            <Ionicons name="share-outline" size={18} color={COLOR.ink2} />
            <Text style={styles.shareText}>Dela</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.hero}>
        <View style={styles.recordRow}>
          <Text style={styles.recWin}>{r.wins}</Text>
          <Text style={styles.recSep}>–</Text>
          <Text style={styles.recLoss}>{r.losses}</Text>
          {r.ties > 0 && <Text style={styles.recTies}>  ({r.ties} oavgj)</Text>}
        </View>
        <Text style={styles.heroSub}>
          {Math.round(r.winRate * 100)}% vinst · {r.played} bord
        </Text>
      </View>

      {recent.length > 0 && (
        <View style={styles.form}>
          <Text style={styles.blockLabel}>BORDFORM</Text>
          <View style={styles.formRow}>
            {recent.slice(0, 12).map((d, i) => {
              const kind = d.outcome === 'home' ? 'V' : d.outcome === 'away' ? 'F' : 'O';
              return (
                <View
                  key={`${d.matchId}-${i}`}
                  style={[styles.dot, kind === 'V' ? styles.dotWin : kind === 'F' ? styles.dotLoss : styles.dotTie]}
                >
                  <Text style={[styles.dotText, kind === 'V' ? styles.dotTextWin : kind === 'F' ? styles.dotTextLoss : styles.dotTextTie]}>
                    {kind}
                  </Text>
                </View>
              );
            })}
            <Text style={styles.formHint}>senaste</Text>
          </View>
        </View>
      )}

      <View style={styles.milestones}>
        <Milestone label="Bästa serie" value={String(m.bestGame)} gold={m.bestGame >= 300} />
        {m.perfectGames > 0 && <Milestone label="Perfekt spel" value={`${m.perfectGames}× 300`} gold />}
        {has2v2 && <Milestone label="Bästa par" value={String(m.bestPairTotal)} />}
        {m.biggestWinMargin > 0 && <Milestone label="Största seger" value={`+${m.biggestWinMargin}`} />}
      </View>

      {rivalries.length > 0 && (
        <View style={styles.block}>
          <Text style={styles.blockLabel}>RIVALER</Text>
          {rivalries.slice(0, 3).map((riv) => (
            <FaceRow
              key={riv.opponentId}
              name={riv.opponentName}
              publicId={riv.opponentId}
              wins={riv.wins}
              losses={riv.losses}
              meta={`${riv.meetings} möten`}
              onOpenPlayer={onOpenPlayer}
            />
          ))}
        </View>
      )}

      {has2v2 && (
        <View style={styles.block}>
          <Text style={styles.blockLabel}>BÄSTA PARTNER</Text>
          {partners.slice(0, 2).map((p) => (
            <FaceRow
              key={p.partnerId}
              name={p.partnerName}
              publicId={p.partnerId}
              wins={p.wins}
              losses={p.losses}
              meta={`${p.together} ihop`}
              onOpenPlayer={onOpenPlayer}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function Milestone({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <View style={styles.mTile}>
      <Text style={[styles.mValue, gold && styles.mValueGold]}>{value}</Text>
      <Text style={styles.mLabel}>{label}</Text>
    </View>
  );
}

function FaceRow({
  name,
  publicId,
  wins,
  losses,
  meta,
  onOpenPlayer,
}: {
  name: string;
  publicId: string;
  wins: number;
  losses: number;
  meta: string;
  onOpenPlayer: (publicId: string) => void;
}) {
  const lead = wins > losses ? styles.recLead : wins < losses ? styles.recTrail : styles.recEven;
  return (
    <Pressable style={styles.faceRow} onPress={() => onOpenPlayer(publicId)} hitSlop={6}>
      <Text style={styles.faceName} numberOfLines={1}>{name}</Text>
      <Text style={styles.faceMeta}>{meta}</Text>
      <Text style={[styles.faceRec, lead]}>{wins}–{losses}</Text>
      <Ionicons name="chevron-forward" size={16} color={COLOR.ink4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACE[8] },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[3] },
  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  share: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  shareText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.bold },

  hero: { alignItems: 'center', marginBottom: SPACE[4] },
  recordRow: { flexDirection: 'row', alignItems: 'baseline' },
  recWin: { color: COLOR.ink, fontSize: TYPE.hero - 6, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  recSep: { color: COLOR.ink4, fontSize: TYPE.title, fontFamily: FONT.score, marginHorizontal: SPACE[2] },
  recLoss: { color: COLOR.ink3, fontSize: TYPE.hero - 6, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  recTies: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  heroSub: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold, marginTop: 2 },

  form: { marginBottom: SPACE[4] },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[1], flexWrap: 'wrap' },
  dot: {
    width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  dotWin: { backgroundColor: 'rgba(48,212,126,0.14)', borderColor: 'rgba(48,212,126,0.45)' },
  dotLoss: { backgroundColor: 'rgba(224,85,85,0.14)', borderColor: 'rgba(224,85,85,0.45)' },
  dotTie: { backgroundColor: COLOR.surface, borderColor: COLOR.surface2 },
  dotText: { fontSize: TYPE.caption, fontFamily: FONT.bold },
  dotTextWin: { color: COLOR.green },
  dotTextLoss: { color: COLOR.red },
  dotTextTie: { color: COLOR.ink2 },
  formHint: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginLeft: SPACE[1] },

  milestones: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2], marginBottom: SPACE[4] },
  mTile: {
    flexGrow: 1, minWidth: 76, alignItems: 'center',
    backgroundColor: COLOR.surface, borderRadius: RADIUS.md,
    paddingVertical: SPACE[3], paddingHorizontal: SPACE[2],
  },
  mValue: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  mValueGold: { color: COLOR.gold },
  mLabel: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 1, textAlign: 'center' },

  block: { marginTop: SPACE[2] },
  blockLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, marginBottom: SPACE[1], marginTop: SPACE[3] },
  faceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3] },
  faceName: { flex: 1, minWidth: 0, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  faceMeta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  faceRec: { fontSize: TYPE.body, fontFamily: FONT.bold, fontVariant: ['tabular-nums'], minWidth: 44, textAlign: 'right' },
  recLead: { color: COLOR.green },
  recTrail: { color: COLOR.red },
  recEven: { color: COLOR.ink2 },
});
