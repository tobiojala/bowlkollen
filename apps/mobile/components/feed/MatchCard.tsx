import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
import { PostActions } from '@/components/feed/PostActions';
import { PostMeta } from '@/components/feed/PostMeta';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { formatMatchDate } from '@/lib/format';
import type { FeedMatch } from '@/lib/feed';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// Match post — refined scorecard: a division kicker, a stacked two-team board
// carrying banpoäng + pinfall with a ✓ winner marker, a banpoäng dominance bar
// (how decisive), then a quiet footer. Whole post opens the match.
// memo'd so it doesn't re-render while the virtualized list scrolls.
export const MatchCard = memo(function MatchCard({
  match,
  upcoming,
  onPress,
  liked,
  saved,
  likeCount,
  onLike,
  onSave,
}: {
  match: FeedMatch;
  upcoming: boolean;
  onPress: () => void;
  liked: boolean;
  saved: boolean;
  likeCount: number;
  onLike: (key: string, liked: boolean) => void;
  onSave: (key: string, saved: boolean) => void;
}) {
  const finished = !!match.is_finished;
  const hr = match.home_result ?? 0;
  const ar = match.away_result ?? 0;
  const homeWon = finished && hr > ar;
  const awayWon = finished && ar > hr;
  const total = hr + ar;
  const homePct = finished && total > 0 ? (hr / total) * 100 : 50;

  return (
    <FeedCard onPress={onPress}>
      <PostMeta
        left={
          <Text style={[styles.status, upcoming && styles.statusUpcoming]}>
            {upcoming ? 'KOMMANDE' : 'RESULTAT'}
          </Text>
        }
        division={match.division_name}
      />

      <View style={styles.teams}>
        <TeamLine name={match.home_team_name} result={match.home_result} pins={match.home_score} won={homeWon} finished={finished} />
        <TeamLine name={match.away_team_name} result={match.away_result} pins={match.away_score} won={awayWon} finished={finished} />
      </View>

      {finished && total > 0 && (
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${homePct}%`, backgroundColor: homeWon ? COLOR.ink : COLOR.ink3 }]} />
          <View style={[styles.barFill, { width: `${100 - homePct}%`, backgroundColor: awayWon ? COLOR.ink : COLOR.ink3 }]} />
        </View>
      )}

      <View style={styles.bottom}>
        <Text style={styles.footer} numberOfLines={1}>
          {[formatMatchDate(match.match_date), match.hall_name].filter(Boolean).join('  ·  ')}
        </Text>
        <PostActions
          postKey={`m${match.bits_match_id}`}
          liked={liked}
          saved={saved}
          likeCount={likeCount}
          onLike={onLike}
          onSave={onSave}
          shareMessage={`${match.home_team_name} – ${match.away_team_name} · Bowlkollen`}
        />
      </View>
    </FeedCard>
  );
});

// One team row: avatar · name · ✓ (winner) · banpoäng · pinfall. Winner reads by
// weight + full ink + the check shape — never colour alone (senior-legible).
function TeamLine({
  name,
  result,
  pins,
  won,
  finished,
}: {
  name: string;
  result: number | null;
  pins: number | null;
  won: boolean;
  finished: boolean;
}) {
  return (
    <View style={styles.line}>
      <IdentityAvatar colors={teamColor(name)} initials={teamInitials(name)} size={40} />
      <Text
        style={[styles.team, won ? styles.win : finished ? styles.lose : styles.upTeam]}
        numberOfLines={1}
      >
        {name}
      </Text>
      <View style={styles.chk}>
        {won && <Ionicons name="checkmark-sharp" size={18} color={COLOR.green} />}
      </View>
      {finished && result != null ? (
        <Text style={[styles.banp, won ? styles.sWin : styles.sLose]}>{result}</Text>
      ) : <View style={styles.banp} />}
      {finished && pins != null ? (
        <Text style={[styles.pins, won ? styles.pWin : styles.pLose]}>{pins}</Text>
      ) : <View style={styles.pins} />}
    </View>
  );
}

const styles = StyleSheet.create({
  status: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  statusUpcoming: { color: COLOR.gold },

  teams: { gap: SPACE[3] },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  team: { flex: 1, fontSize: TYPE.title, fontFamily: FONT.semibold, letterSpacing: -0.3 },
  win: { color: COLOR.ink, fontFamily: FONT.bold },
  lose: { color: COLOR.ink3 },
  upTeam: { color: COLOR.ink },
  chk: { width: 20, alignItems: 'center' },
  banp: { width: 44, textAlign: 'right', fontSize: TYPE.hero - 8, fontFamily: FONT.score, fontVariant: ['tabular-nums'] },
  sWin: { color: COLOR.ink },
  sLose: { color: COLOR.ink3 },
  pins: { width: 50, textAlign: 'right', fontSize: TYPE.caption, fontFamily: FONT.scoreSemi, fontVariant: ['tabular-nums'] },
  pWin: { color: COLOR.ink3 },
  pLose: { color: COLOR.ink4 },

  bar: { flexDirection: 'row', height: 5, borderRadius: 999, overflow: 'hidden', backgroundColor: COLOR.surface2, marginTop: SPACE[2] },
  barFill: { height: '100%' },

  bottom: { gap: SPACE[3] },
  footer: { color: COLOR.ink3, fontSize: TYPE.caption },
});
