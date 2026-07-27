import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { formatMatchDate } from '@/lib/format';
import { useVotePost, type TeamPost } from '@/lib/team-posts';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// A board post — a plain message, or a poll with tappable options + live results.
export function PostCard({ post, teamId }: { post: TeamPost; teamId: number }) {
  const vote = useVotePost(teamId);
  const total = post.options.reduce((n, o) => n + o.votes, 0);
  const voted = post.options.some((o) => o.mine);

  return (
    <View style={styles.card}>
      {!!post.title && <Text style={styles.title}>{post.title}</Text>}
      <Text style={styles.body}>{post.body}</Text>

      {post.kind === 'poll' && (
        <View style={styles.poll}>
          {post.options.map((o) => {
            const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
            return (
              <PressableScale key={o.id} style={styles.option} onPress={() => vote.mutate({ postId: post.id, optionId: o.id })}>
                <View style={[styles.fill, { width: `${pct}%` }, o.mine && styles.fillMine]} />
                <View style={styles.optionRow}>
                  <Ionicons
                    name={o.mine ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={o.mine ? COLOR.gold : COLOR.ink4}
                  />
                  <Text style={[styles.optionLabel, o.mine && styles.optionLabelMine]} numberOfLines={1}>{o.label}</Text>
                  {voted && <Text style={styles.pct}>{pct}%</Text>}
                </View>
              </PressableScale>
            );
          })}
          <Text style={styles.pollMeta}>{total} {total === 1 ? 'röst' : 'röster'}{voted ? '' : ' · tryck för att rösta'}</Text>
        </View>
      )}

      <Text style={styles.meta}>{post.authorName} · {formatMatchDate(post.createdAt.slice(0, 10))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: SPACE[4], padding: SPACE[4], borderRadius: RADIUS.lg, backgroundColor: COLOR.surface },
  title: { color: COLOR.ink, fontSize: TYPE.body + 2, fontFamily: FONT.bold, letterSpacing: -0.2, marginBottom: SPACE[2] },
  body: { color: COLOR.ink2, fontSize: TYPE.body, lineHeight: 23 },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: SPACE[3] },

  poll: { marginTop: SPACE[4], gap: SPACE[2] },
  option: { borderRadius: RADIUS.md, backgroundColor: COLOR.surface2, overflow: 'hidden', minHeight: 46, justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.06)' },
  fillMine: { backgroundColor: 'rgba(245,194,0,0.16)' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingHorizontal: SPACE[3], paddingVertical: SPACE[3] },
  optionLabel: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.medium },
  optionLabelMine: { fontFamily: FONT.bold },
  pct: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.bold },
  pollMeta: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: SPACE[1] },
});
