import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatchRow } from '@/components/MatchRow';
import { PressableScale } from '@/components/PressableScale';
import { ListSkeleton } from '@/components/Skeleton';
import { TopSerieRow } from '@/components/TopSerieRow';
import { useNavScroll } from '@/lib/nav-scroll';
import { supabase } from '@/lib/supabase';
import { useTopScores } from '@/lib/top-scores';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

type Match = {
  bits_match_id: number;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
  home_result: number;
  away_result: number;
  division_name: string;
  is_finished: boolean;
  hall_name: string;
};

const FILTERS = ['Allt', 'Matcher', 'Serier'] as const;
type Filter = (typeof FILTERS)[number];

function useMyMatches() {
  return useQuery({
    queryKey: ['my-matches'],
    staleTime: 60_000,
    queryFn: async (): Promise<Match[]> => {
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
  const [filter, setFilter] = useState<Filter>('Allt');
  const { data: matches = [], isLoading } = useMyMatches();
  const { data: topScores = [] } = useTopScores();

  const hour = new Date().getHours();
  const greeting = hour < 10 ? 'God morgon' : hour < 18 ? 'God dag' : 'God kväll';
  const dateStr = new Date().toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'long' });

  const upcoming = matches.filter((m) => !m.is_finished).sort((a, b) => a.match_date.localeCompare(b.match_date));
  const results = matches.filter((m) => m.is_finished).sort((a, b) => b.match_date.localeCompare(a.match_date));

  const showMatches = filter === 'Allt' || filter === 'Matcher';
  const showSeries = filter === 'Allt' || filter === 'Serier';
  const nothing =
    (!showMatches || (upcoming.length === 0 && results.length === 0)) &&
    (!showSeries || topScores.length === 0);

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.list, { paddingTop: insets.top + SPACE[2] }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        <View style={styles.chips}>
          {FILTERS.map((f) => (
            <PressableScale
              key={f}
              style={[styles.chip, f === filter && styles.chipOn]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, f === filter && styles.chipTextOn]}>{f}</Text>
            </PressableScale>
          ))}
        </View>

        {isLoading ? (
          <ListSkeleton />
        ) : nothing ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Inget att visa än</Text>
            <Text style={styles.emptyBody}>Följ lag och spelare så fylls flödet med deras matcher.</Text>
            <PressableScale style={styles.emptyBtn} onPress={() => router.push('/schema')}>
              <Text style={styles.emptyBtnText}>Utforska divisioner</Text>
            </PressableScale>
          </View>
        ) : (
          <>
            {showMatches && upcoming.length > 0 && (
              <Section label="KOMMANDE">
                {upcoming.map((m, i) => (
                  <Reveal key={m.bits_match_id} i={i}>
                    <MatchRow m={m} onPress={() => router.push(`/matcher/${m.bits_match_id}`)} />
                  </Reveal>
                ))}
              </Section>
            )}

            {showSeries && topScores.length > 0 && (
              <Section label="TOPPSERIER">
                {topScores.map((s, i) => (
                  <Reveal key={`${s.matchId}-${s.playerName}`} i={i}>
                    <TopSerieRow score={s} onPress={() => s.publicId && router.push(`/player/${s.publicId}`)} />
                  </Reveal>
                ))}
              </Section>
            )}

            {showMatches && results.length > 0 && (
              <Section label="SENASTE RESULTAT">
                {results.map((m, i) => (
                  <Reveal key={m.bits_match_id} i={i}>
                    <MatchRow m={m} onPress={() => router.push(`/matcher/${m.bits_match_id}`)} />
                  </Reveal>
                ))}
              </Section>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Reveal({ i, children }: { i: number; children: React.ReactNode }) {
  return <Animated.View entering={FadeInDown.duration(280).delay(Math.min(i, 8) * 35)}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  list: { paddingHorizontal: SPACE[6], paddingBottom: 120 },
  header: { paddingTop: SPACE[3], paddingBottom: SPACE[4] },
  greeting: { color: COLOR.ink, fontSize: 22, fontFamily: FONT.bold, letterSpacing: -0.5 },
  date: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: SPACE[1], textTransform: 'capitalize' },
  chips: { flexDirection: 'row', gap: SPACE[2], marginBottom: SPACE[2] },
  chip: {
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[2],
    borderRadius: RADIUS.pill,
    backgroundColor: COLOR.surface,
  },
  chipOn: { backgroundColor: 'rgba(245,194,0,0.14)' },
  chipText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.bold },
  chipTextOn: { color: COLOR.gold },
  section: { marginTop: SPACE[6] },
  sectionLabel: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginBottom: SPACE[2],
  },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE[8], paddingTop: SPACE[16], gap: SPACE[3] },
  emptyTitle: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold },
  emptyBody: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center' },
  emptyBtn: { marginTop: SPACE[2], backgroundColor: COLOR.surface, borderRadius: RADIUS.pill, paddingHorizontal: SPACE[6], paddingVertical: SPACE[3] },
  emptyBtnText: { color: COLOR.gold, fontSize: TYPE.caption, fontFamily: FONT.bold },
});
