import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PostCard } from '@/components/PostCard';
import { PostCompose } from '@/components/PostCompose';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { useMyTeamRole } from '@/lib/team-admin';
import { useMarkPostsSeen, useTeamPosts } from '@/lib/team-posts';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export default function Nyheter() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);

  const { data: posts = [] } = useTeamPosts(teamId);
  const { data: role } = useMyTeamRole(teamId);
  const seen = useMarkPostsSeen(teamId);

  const canPost = role === 'captain' || role === 'lagledare' || role === 'styrelse';
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    seen.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {canPost && composing && <PostCompose teamId={teamId} onDone={() => setComposing(false)} />}

        {posts.map((p) => (
          <PostCard key={p.id} post={p} teamId={teamId} />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[16] },
  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 6, fontFamily: FONT.bold, letterSpacing: -0.5 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], marginTop: SPACE[4], padding: SPACE[4], borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(245,194,0,0.30)', backgroundColor: 'rgba(245,194,0,0.08)' },
  newText: { color: COLOR.gold, fontSize: TYPE.body, fontFamily: FONT.bold },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
