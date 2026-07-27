import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { Segmented } from '@/components/Segmented';
import { BanaTab } from '@/components/laguttagning/BanaTab';
import { LineupSeating } from '@/components/laguttagning/LineupSeating';
import { OpponentTab } from '@/components/laguttagning/OpponentTab';
import { usePrepMatch } from '@/lib/diary';
import { formatMatchDate, relativeMatchDate } from '@/lib/format';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

type Tab = 'laget' | 'opp' | 'bana';

export default function Laguttagning() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, mid } = useLocalSearchParams<{ id: string; mid: string }>();
  const teamId = Number(id);
  const matchId = Number(mid);

  const { data: match } = usePrepMatch(matchId);
  const [tab, setTab] = useState<Tab>('laget');

  const hall = match?.hall ?? null;
  const opponentId = match ? (match.homeTeamId === teamId ? match.awayTeamId : match.homeTeamId) : null;
  const opponentName = match ? (match.homeTeamId === teamId ? match.awayName : match.homeName) : '';

  return (
    <View style={styles.safe}>
      <View style={[styles.header, { paddingTop: insets.top + 52 }]}>
        <Text style={styles.kicker}>LAGUTTAGNING</Text>
        {match && (
          <>
            <Text style={styles.h1} numberOfLines={2}>
              {match.homeName} <Text style={styles.vs}>–</Text> {match.awayName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaStrong}>{relativeMatchDate(match.date)}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.meta}>{formatMatchDate(match.date)}</Text>
              {!!hall && (<><Text style={styles.metaDot}>·</Text><Text style={styles.meta} numberOfLines={1}>{hall}</Text></>)}
            </View>
          </>
        )}
        <View style={styles.tabs}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[{ key: 'laget', label: 'Laget' }, { key: 'opp', label: 'Motståndare' }, { key: 'bana', label: 'Bana' }]}
          />
        </View>
      </View>

      {tab === 'laget' && <LineupSeating teamId={teamId} matchId={matchId} match={match ?? null} />}
      {tab === 'opp' && (
        <ScrollView contentContainerStyle={styles.tabScroll} showsVerticalScrollIndicator={false}>
          <OpponentTab teamId={teamId} opponentId={opponentId} opponentName={opponentName} matchId={matchId} />
        </ScrollView>
      )}
      {tab === 'bana' && (
        <ScrollView contentContainerStyle={styles.tabScroll} showsVerticalScrollIndicator={false}>
          <BanaTab hall={hall} division={match?.division ?? null} />
        </ScrollView>
      )}

      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  chromeLeft: { position: 'absolute', left: 16 },
  header: { paddingHorizontal: SPACE[6], paddingBottom: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 2, fontFamily: FONT.bold, letterSpacing: -0.4, lineHeight: 30 },
  vs: { color: COLOR.ink3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACE[2], flexWrap: 'wrap' },
  metaStrong: { color: COLOR.gold, fontSize: TYPE.caption, fontFamily: FONT.bold },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, flexShrink: 1 },
  metaDot: { color: COLOR.ink4, fontSize: TYPE.caption },
  tabs: { marginTop: SPACE[4] },
  tabScroll: { paddingHorizontal: SPACE[6], paddingTop: SPACE[4], paddingBottom: SPACE[16] },
});
