import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/IdentityAvatar';
import type { MatchRivalry } from '@/lib/match-rivalry';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// "Kvällens hetaste bord" — the finished match's marquee rivalry. The career
// head-to-head is the hero (framed like the match score); a balance bar shows how
// even it is; a footer line says how tonight went. Leader carried by weight + the
// green tint on the ahead side, never colour alone. Tap a name → their profile.
export function RivalryCallout({
  rivalry,
  onOpenPlayer,
  onOpenBord,
}: {
  rivalry: MatchRivalry;
  onOpenPlayer: (publicId: string) => void;
  onOpenBord: () => void;
}) {
  const { a, b, meetings, tonight } = rivalry;
  const aLeads = a.wins > b.wins;
  const bLeads = b.wins > a.wins;
  const decided = a.wins + b.wins;
  const aShare = decided > 0 ? (a.wins / decided) * 100 : 50;

  const tonightText =
    tonight === 'a'
      ? `Ikväll tog ${first(a.name)} bordet`
      : tonight === 'b'
        ? `Ikväll tog ${first(b.name)} bordet`
        : 'Ikväll delade de bordet';

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>KVÄLLENS BORD</Text>
      <Pressable style={styles.card} onPress={onOpenBord} accessibilityLabel="Öppna bordvyn">
        <View style={styles.eyebrow}>
          <Ionicons name="flame" size={14} color={COLOR.gold} />
          <Text style={styles.eyebrowText}>HETASTE BORDET</Text>
        </View>

        <View style={styles.faceoff}>
          <PlayerSide name={a.name} publicId={a.publicId} onOpenPlayer={onOpenPlayer} />
          <View style={styles.rec}>
            <View style={styles.recRow}>
              <Text style={[styles.recNum, aLeads ? styles.recWin : styles.recLose]}>{a.wins}</Text>
              <Text style={styles.recDash}>–</Text>
              <Text style={[styles.recNum, bLeads ? styles.recWin : styles.recLose]}>{b.wins}</Text>
            </View>
            <Text style={styles.recCap}>{meetings} möten</Text>
          </View>
          <PlayerSide name={b.name} publicId={b.publicId} onOpenPlayer={onOpenPlayer} />
        </View>

        <View style={styles.bar}>
          <View style={[styles.barSeg, { width: `${aShare}%` }, aLeads ? styles.barLead : styles.barFaint]} />
          <View style={[styles.barSeg, { width: `${100 - aShare}%` }, bLeads ? styles.barLead : styles.barFaint]} />
        </View>

        <View style={styles.foot}>
          <Text style={styles.footText}>{tonightText}</Text>
          <View style={styles.openBord}>
            <Text style={styles.openBordText}>Bordvyn</Text>
            <Ionicons name="chevron-forward" size={15} color={COLOR.ink3} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function PlayerSide({
  name,
  publicId,
  onOpenPlayer,
}: {
  name: string;
  publicId: string | null;
  onOpenPlayer: (publicId: string) => void;
}) {
  return (
    <Pressable
      style={styles.side}
      disabled={!publicId}
      onPress={() => publicId && onOpenPlayer(publicId)}
      hitSlop={6}
    >
      <IdentityAvatar colors={teamColor(name)} initials={teamInitials(name)} size={44} />
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
    </Pressable>
  );
}

const first = (n: string) => n.split(' ')[0];

const styles = StyleSheet.create({
  wrap: { marginTop: SPACE[6] },
  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[3] },
  card: { backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLOR.surface2, padding: SPACE[4] },

  eyebrow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[1] },
  eyebrowText: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },

  faceoff: { flexDirection: 'row', alignItems: 'center', marginTop: SPACE[4] },
  side: { flex: 1, minWidth: 0, alignItems: 'center', gap: SPACE[2] },
  name: { color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.semibold, textAlign: 'center', lineHeight: 18 },

  rec: { alignItems: 'center', minWidth: 96, paddingHorizontal: SPACE[2] },
  recRow: { flexDirection: 'row', alignItems: 'baseline' },
  recNum: { fontSize: TYPE.hero - 12, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  recWin: { color: COLOR.green },
  recLose: { color: COLOR.ink3 },
  recDash: { color: COLOR.ink4, fontSize: TYPE.title, fontFamily: FONT.display, marginHorizontal: SPACE[2] },
  recCap: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.semibold, marginTop: 2 },

  bar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: SPACE[4], backgroundColor: COLOR.surface2 },
  barSeg: { height: '100%' },
  barLead: { backgroundColor: COLOR.green },
  barFaint: { backgroundColor: COLOR.ink4 },

  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACE[4], paddingTop: SPACE[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLOR.surface2 },
  footText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
  openBord: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  openBordText: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.bold },
});
