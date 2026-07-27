import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { formatMatchDate } from '@/lib/format';
import { useMyTeamRole } from '@/lib/team-admin';
import { POST_MAX, useCreateTeamPost, useMarkPostsSeen, useTeamPosts, type TeamPost } from '@/lib/team-posts';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export default function Nyheter() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);

  const { data: posts = [] } = useTeamPosts(teamId);
  const { data: role } = useMyTeamRole(teamId);
  const create = useCreateTeamPost(teamId);
  const seen = useMarkPostsSeen(teamId);

  const canPost = role === 'captain' || role === 'lagledare' || role === 'styrelse';
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Opening the board clears its unread badge.
  useEffect(() => {
    seen.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publish = () =>
    create.mutate(
      { title, body },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
          setComposing(false);
        },
      },
    );

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>ANSLAGSTAVLA</Text>
        <Text style={styles.h1}>Nyheter</Text>

        {canPost && !composing && (
          <PressableScale style={styles.newBtn} onPress={() => setComposing(true)}>
            <Ionicons name="create-outline" size={20} color={COLOR.gold} />
            <Text style={styles.newText}>Nytt anslag</Text>
          </PressableScale>
        )}

        {canPost && composing && (
          <View style={styles.compose}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Rubrik (valfritt)"
              placeholderTextColor={COLOR.ink4}
              maxLength={140}
            />
            <TextInput
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder="Skriv till laget…"
              placeholderTextColor={COLOR.ink4}
              multiline
              textAlignVertical="top"
              maxLength={POST_MAX}
            />
            <View style={styles.composeFoot}>
              <Text style={styles.counter}>{body.length}/{POST_MAX}</Text>
              <View style={styles.composeBtns}>
                <PressableScale onPress={() => setComposing(false)} hitSlop={8}>
                  <Text style={styles.cancel}>Avbryt</Text>
                </PressableScale>
                <PressableScale
                  style={[styles.publish, (!body.trim() || create.isPending) && styles.publishOff]}
                  onPress={publish}
                  disabled={!body.trim() || create.isPending}
                >
                  {create.isPending ? <ActivityIndicator color={COLOR.bg} /> : <Text style={styles.publishText}>Publicera</Text>}
                </PressableScale>
              </View>
            </View>
          </View>
        )}

        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {posts.length === 0 && (
          <Text style={styles.empty}>Inga anslag än.{canPost ? ' Skriv det första!' : ''}</Text>
        )}
      </ScrollView>

      <ScrollBlur />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function PostCard({ post }: { post: TeamPost }) {
  return (
    <View style={styles.card}>
      {!!post.title && <Text style={styles.postTitle}>{post.title}</Text>}
      <Text style={styles.postBody}>{post.body}</Text>
      <Text style={styles.postMeta}>{post.authorName} · {formatMatchDate(post.createdAt.slice(0, 10))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[16] },
  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 6, fontFamily: FONT.bold, letterSpacing: -0.5 },

  newBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], marginTop: SPACE[4], padding: SPACE[4], borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(245,194,0,0.30)', backgroundColor: 'rgba(245,194,0,0.08)' },
  newText: { color: COLOR.gold, fontSize: TYPE.body, fontFamily: FONT.bold },

  compose: { marginTop: SPACE[4], padding: SPACE[4], borderRadius: RADIUS.lg, backgroundColor: COLOR.surface, gap: SPACE[3] },
  titleInput: { color: COLOR.ink, fontSize: TYPE.body + 1, fontFamily: FONT.bold, paddingVertical: SPACE[2] },
  bodyInput: { color: COLOR.ink, fontSize: TYPE.body, minHeight: 120, lineHeight: 22 },
  composeFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { color: COLOR.ink3, fontSize: TYPE.caption },
  composeBtns: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4] },
  cancel: { color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.semibold },
  publish: { backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingHorizontal: SPACE[6], paddingVertical: SPACE[3], alignItems: 'center' },
  publishOff: { opacity: 0.5 },
  publishText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },

  card: { marginTop: SPACE[4], padding: SPACE[4], borderRadius: RADIUS.lg, backgroundColor: COLOR.surface },
  postTitle: { color: COLOR.ink, fontSize: TYPE.body + 2, fontFamily: FONT.bold, letterSpacing: -0.2, marginBottom: SPACE[2] },
  postBody: { color: COLOR.ink2, fontSize: TYPE.body, lineHeight: 23 },
  postMeta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: SPACE[3] },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
