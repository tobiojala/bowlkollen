import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { useHallNotes, useNextMatch } from '@/lib/diary';
import { relativeMatchDate } from '@/lib/format';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// The Prepare-pillar card: your next fixture, tapped open into the prep sheet.
// Hints when you've got diary notes waiting from the last time you were at this
// center — the "it just serves you" moment.
export function NextMatchCard() {
  const router = useRouter();
  const { data: next } = useNextMatch();
  const { data: recall = [] } = useHallNotes(next?.hall);

  if (!next) return null;
  const hasRecall = recall.length > 0;

  return (
    <PressableScale style={styles.card} onPress={() => router.push(`/prep/${next.matchId}`)}>
      <View style={styles.head}>
        <Text style={styles.kicker}>NÄSTA MATCH</Text>
        <Text style={styles.when}>{relativeMatchDate(next.date)}</Text>
      </View>

      <Text style={styles.vs} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
        {next.isHome ? 'Hemma mot ' : 'Borta mot '}
        <Text style={styles.opp}>{next.opponentName}</Text>
      </Text>

      <View style={styles.metaRow}>
        {!!next.hall && (
          <View style={styles.meta}>
            <Ionicons name="location-outline" size={16} color={COLOR.ink3} />
            <Text style={styles.metaText} numberOfLines={1}>{next.hall}</Text>
          </View>
        )}
        {!!next.division && <Text style={styles.div} numberOfLines={1}>{next.division}</Text>}
      </View>

      <View style={styles.footer}>
        {hasRecall ? (
          <View style={styles.recall}>
            <Ionicons name="bookmark" size={16} color={COLOR.gold} />
            <Text style={styles.recallText}>
              {recall.length === 1 ? 'Din anteckning härifrån väntar' : `${recall.length} anteckningar härifrån väntar`}
            </Text>
          </View>
        ) : (
          <View style={styles.recall}>
            <Ionicons name="create-outline" size={16} color={COLOR.ink3} />
            <Text style={styles.prepText}>Förbered matchen</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={COLOR.ink3} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACE[4],
    padding: SPACE[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLOR.surface,
    gap: SPACE[3],
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  when: { color: COLOR.gold, fontSize: TYPE.caption, fontFamily: FONT.bold },

  vs: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.medium },
  opp: { color: COLOR.ink, fontFamily: FONT.bold },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  metaText: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, flexShrink: 1 },
  div: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginLeft: 'auto' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
    paddingTop: SPACE[3],
  },
  recall: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  recallText: { color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.semibold, flexShrink: 1 },
  prepText: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
});
