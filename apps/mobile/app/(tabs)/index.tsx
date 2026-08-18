import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, type ListRenderItem, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/PressableScale';
import { ListSkeleton } from '@/components/Skeleton';
import { StoryChips, type Story } from '@/components/StoryChips';
import { MatchCard } from '@/components/feed/MatchCard';
import { RivalCard } from '@/components/feed/RivalCard';
import { PromoCard } from '@/components/feed/PromoCard';
import { StandingsCard } from '@/components/feed/StandingsCard';
import { StoryCard } from '@/components/feed/StoryCard';
import { TopSerieCard } from '@/components/feed/TopSerieCard';
import { useNextMatch } from '@/lib/diary';
import { buildFeed, filterFeed, injectPromos, injectStandings, type FeedCategory, type FeedItem, type FeedMatch } from '@/lib/feed';
import { useFeedReactions, useReactionActions } from '@/lib/feed-reactions';
import { useFeedStandings } from '@/lib/feed-standings';
import { storyEventHref, useHomeStoryEvents } from '@/lib/story-events';
import { greetingFor, homeNote } from '@/lib/home-tip';
import { useMyClaim } from '@/lib/me';
import { useNavScroll } from '@/lib/nav-scroll';
import { SAMPLE_PROMOS } from '@/lib/promos';
import { supabase } from '@/lib/supabase';
import { useTopScores } from '@/lib/top-scores';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const STORIES: Story[] = [
  { key: 'Allt', label: 'Allt', icon: 'apps' },
  { key: 'Matcher', label: 'Matcher', icon: 'calendar' },
  { key: 'Serier', label: 'Serier', icon: 'flame' },
];

function useMyMatches() {
  return useQuery({
    queryKey: ['my-matches'],
    staleTime: 60_000,
    queryFn: async (): Promise<FeedMatch[]> => {
      const { data, error } = await supabase.rpc('get_user_season_matches');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onScroll } = useNavScroll();
  const [category, setCategory] = useState<FeedCategory>('Allt');
  const { data: matches = [], isLoading } = useMyMatches();
  const { data: topScores = [] } = useTopScores();
  const { data: standings = [] } = useFeedStandings();
  const { data: storyEvents = [] } = useHomeStoryEvents();

  const { data: claim } = useMyClaim();
  const { data: nextMatch } = useNextMatch();
  const firstName = claim?.status === 'verified' ? claim.name.split(' ')[0] : null;
  const greetingText = greetingFor(new Date().getHours(), firstName);
  const dateStr = new Date().toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'long' });
  const daysToMatch = nextMatch
    ? Math.round((new Date(nextMatch.date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
    : null;
  const note = homeNote({
    daysToMatch,
    opponent: nextMatch?.opponentName ?? null,
    matchId: nextMatch?.matchId ?? null,
    daySeed: Math.floor(Date.now() / 86_400_000),
  });

  const feed = useMemo(() => {
    const base = filterFeed(buildFeed(matches, topScores, storyEvents), category);
    // Standings + sponsored posts only mix into the full stream, not filtered views.
    return category === 'Allt' ? injectPromos(injectStandings(base, standings), SAMPLE_PROMOS) : base;
  }, [matches, topScores, storyEvents, standings, category]);

  // Likes/saves for every likeable post in the feed, in one batched query.
  const reactionKeys = useMemo(() => feed.filter((i) => i.kind !== 'promo').map((i) => i.key), [feed]);
  const { data: reactions } = useFeedReactions(reactionKeys);
  const { toggleLike, toggleSave } = useReactionActions();

  const renderItem = useCallback<ListRenderItem<FeedItem>>(
    ({ item }) => {
      if (item.kind === 'promo') return <PromoCard promo={item.promo} />;
      if (item.kind === 'standings') {
        return (
          <StandingsCard
            standing={item.standing}
            onOpen={() => router.push(`/division/${item.standing.divisionId}`)}
            onOpenTeam={(tid) => router.push(`/lag/${tid}`)}
          />
        );
      }
      const r = reactions?.get(item.key);
      const common = {
        liked: r?.liked ?? false,
        saved: r?.saved ?? false,
        likeCount: r?.likes ?? 0,
        onLike: toggleLike,
        onSave: toggleSave,
      };
      if (item.kind === 'match') {
        return (
          <MatchCard
            match={item.match}
            upcoming={item.upcoming}
            onPress={() => router.push(`/matcher/${item.match.bits_match_id}`)}
            {...common}
          />
        );
      }
      if (item.kind === 'event') {
        return (
          <StoryCard
            event={item.event}
            onPress={() => router.push(storyEventHref(item.event) as never)}
            {...common}
          />
        );
      }
      return (
        <TopSerieCard
          score={item.score}
          onPress={() => item.score.publicId && router.push(`/player/${item.score.publicId}`)}
          {...common}
        />
      );
    },
    [router, reactions, toggleLike, toggleSave],
  );

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.header}>
        <Text style={styles.dateKicker}>{dateStr}</Text>
        <Text style={styles.greeting}>{greetingText}</Text>
        <PressableScale
          disabled={!note.matchId}
          onPress={() => note.matchId && router.push(`/prep/${note.matchId}`)}
          hitSlop={6}
        >
          <Text style={[styles.note, !!note.matchId && styles.noteMatch]}>{note.text}</Text>
        </PressableScale>
      </View>
      <StoryChips stories={STORIES} selected={category} onSelect={(k) => setCategory(k as FeedCategory)} />
      <View style={styles.prep}>
        <RivalCard />
      </View>
    </View>
  );

  return (
    <View style={styles.safe}>
      <FlatList
        data={feed}
        extraData={reactions}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.pad}>
              <ListSkeleton />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Inget att visa än</Text>
              <Text style={styles.emptyBody}>Följ lag och spelare så fylls flödet med deras matcher.</Text>
              <PressableScale style={styles.emptyBtn} onPress={() => router.push('/schema')}>
                <Text style={styles.emptyBtnText}>Utforska divisioner</Text>
              </PressableScale>
            </View>
          )
        }
        contentContainerStyle={[styles.list, { paddingTop: insets.top + SPACE[2] }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  list: { paddingBottom: 120 },
  pad: { paddingTop: SPACE[6], paddingHorizontal: SPACE[4] },
  headerWrap: { marginBottom: SPACE[2] },
  header: { alignItems: 'center', paddingTop: SPACE[4], paddingBottom: SPACE[4], paddingHorizontal: SPACE[6] },
  prep: { paddingHorizontal: SPACE[4], marginBottom: SPACE[4] },
  dateKicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: SPACE[1] },
  greeting: { color: COLOR.ink, fontSize: TYPE.title + 4, fontFamily: FONT.bold, letterSpacing: -0.5, textAlign: 'center' },
  note: { color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.medium, textAlign: 'center', marginTop: SPACE[2], lineHeight: 22 },
  noteMatch: { color: COLOR.ink },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE[8], paddingTop: SPACE[16], gap: SPACE[3] },
  emptyTitle: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold },
  emptyBody: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center' },
  emptyBtn: { marginTop: SPACE[2], backgroundColor: COLOR.surface, borderRadius: RADIUS.pill, paddingHorizontal: SPACE[6], paddingVertical: SPACE[3] },
  emptyBtnText: { color: COLOR.gold, fontSize: TYPE.caption, fontFamily: FONT.bold },
});
