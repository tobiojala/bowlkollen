import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/IdentityAvatar';
import { usePlayerScouting, useTeamForm, type ScoutForm, type ScoutOpponent } from '@/lib/scouting';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const MIN_MEETINGS = 2; // one meeting isn't a rivalry
const MAX_ROWS = 6;

type MatchTeams = { homeTeamId: number | null; awayTeamId: number | null; homeName: string; awayName: string };

// "Inför matchen" scouting: the opponent's form plus the viewer's career head-to-head
// vs their roster — bogeys first. Only for a claimed player whose team is in the match;
// otherwise renders nothing. Tap an opponent → their profile.
export function ScoutingCard({ match, onOpenPlayer }: { match: MatchTeams | null; onOpenPlayer: (publicId: string) => void }) {
  const { data: scouting } = usePlayerScouting(match);
  const { data: form = [] } = useTeamForm(scouting?.opponentTeamId);

  if (!scouting) return null;
  const rows = scouting.opponents.filter((o) => o.meetings >= MIN_MEETINGS).slice(0, MAX_ROWS);
  if (!rows.length) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Inför mötet med {scouting.opponentName}</Text>
        {form.length > 0 && (
          <View style={styles.formRow}>
            {form.map((f, i) => <FormDot key={i} kind={f} small />)}
          </View>
        )}
      </View>

      <View style={styles.summary}>
        <Text style={styles.sumNum}>{scouting.leadCount} / {scouting.total}</Text>
        <Text style={styles.sumLbl}>möten du leder genom åren</Text>
      </View>

      {rows.map((o) => <OpponentRow key={o.publicId ?? o.name} o={o} onOpenPlayer={onOpenPlayer} />)}
    </View>
  );
}

function OpponentRow({ o, onOpenPlayer }: { o: ScoutOpponent; onOpenPlayer: (publicId: string) => void }) {
  const lead = o.myWins > o.myLosses;
  const trail = o.myWins < o.myLosses;
  return (
    <Pressable
      style={styles.row}
      disabled={!o.publicId}
      onPress={() => o.publicId && onOpenPlayer(o.publicId)}
      hitSlop={4}
    >
      <IdentityAvatar colors={teamColor(o.name)} initials={teamInitials(o.name)} size={40} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{o.name}</Text>
        <View style={styles.recentRow}>
          {o.recent.map((f, i) => <FormDot key={i} kind={f} small />)}
          <Text style={styles.meetings}>{o.meetings} möten</Text>
        </View>
      </View>
      <Tag tag={o.tag} />
      <Text style={[styles.rec, lead ? styles.recLead : trail ? styles.recTrail : styles.recEven]}>
        {o.myWins}–{o.myLosses}
      </Text>
    </Pressable>
  );
}

function Tag({ tag }: { tag: ScoutOpponent['tag'] }) {
  const label = tag === 'bogey' ? 'BOGEY' : tag === 'favorit' ? 'FAVORIT' : 'JÄMNT';
  return <Text style={[styles.tag, tag === 'bogey' ? styles.tagBogey : tag === 'favorit' ? styles.tagFav : styles.tagEven]}>{label}</Text>;
}

function FormDot({ kind, small }: { kind: ScoutForm; small?: boolean }) {
  const s = small ? styles.dotSm : styles.dot;
  return (
    <View style={[s, kind === 'V' ? styles.dV : kind === 'F' ? styles.dF : styles.dO]}>
      <Text style={[styles.dotText, kind === 'V' ? styles.tV : kind === 'F' ? styles.tF : styles.tO]}>{kind}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: SPACE[4], padding: SPACE[4], borderRadius: RADIUS.lg, backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.surface2 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[2] },
  title: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  formRow: { flexDirection: 'row', gap: 3 },

  summary: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE[2], marginTop: SPACE[3], marginBottom: SPACE[1] },
  sumNum: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
  sumLbl: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },

  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[2], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLOR.surface2 },
  info: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  meetings: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginLeft: SPACE[1] },

  tag: { fontSize: TYPE.caption, fontFamily: FONT.bold, letterSpacing: 0.5, paddingHorizontal: SPACE[2], paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  tagBogey: { color: COLOR.red, backgroundColor: 'rgba(224,85,85,0.13)' },
  tagFav: { color: COLOR.green, backgroundColor: 'rgba(48,212,126,0.13)' },
  tagEven: { color: COLOR.ink3, backgroundColor: COLOR.surface2 },

  rec: { fontSize: TYPE.body, fontFamily: FONT.bold, fontVariant: ['tabular-nums'], minWidth: 40, textAlign: 'right' },
  recLead: { color: COLOR.green },
  recTrail: { color: COLOR.red },
  recEven: { color: COLOR.ink2 },

  dot: { width: 23, height: 23, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dotSm: { width: 21, height: 21, borderRadius: 5, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dV: { backgroundColor: 'rgba(48,212,126,0.14)', borderColor: 'rgba(48,212,126,0.45)' },
  dF: { backgroundColor: 'rgba(224,85,85,0.14)', borderColor: 'rgba(224,85,85,0.45)' },
  dO: { backgroundColor: COLOR.surface2, borderColor: COLOR.surface2 },
  dotText: { fontSize: TYPE.caption, fontFamily: FONT.bold },
  tV: { color: COLOR.green },
  tF: { color: COLOR.red },
  tO: { color: COLOR.ink2 },
});
