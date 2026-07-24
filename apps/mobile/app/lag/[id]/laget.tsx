import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { formatMatchDate, relativeMatchDate } from '@/lib/format';
import { useTeam, useTeamMatches } from '@/lib/team-data';
import { useMyTeamRole } from '@/lib/team-admin';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export default function TeamAdminHub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);

  const { data: team } = useTeam(teamId);
  const { data: role } = useMyTeamRole(teamId);
  const { data: matches = [] } = useTeamMatches(teamId);

  const upcoming = matches
    .filter((m) => !m.is_finished)
    .sort((a, b) => a.match_date.localeCompare(b.match_date));

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56 }]}>
        <Text style={styles.kicker}>MITT LAG</Text>
        <Text style={styles.h1} numberOfLines={2}>{team?.name ?? 'Lag'}</Text>
        {role && (
          <View style={[styles.roleTag, role === 'captain' && styles.roleTagCaptain]}>
            <Ionicons name={role === 'captain' ? 'shield-checkmark' : 'person'} size={14} color={role === 'captain' ? COLOR.bg : COLOR.ink2} />
            <Text style={[styles.roleText, role === 'captain' && styles.roleTextCaptain]}>
              {role === 'captain' ? 'KAPTEN' : 'SPELARE'}
            </Text>
          </View>
        )}

        {!role ? (
          <Text style={styles.empty}>Bara lagets medlemmar har tillgång här.</Text>
        ) : upcoming.length === 0 ? (
          <Text style={styles.empty}>Inga kommande matcher just nu.</Text>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>KOMMANDE MATCHER</Text>
            {upcoming.map((m) => {
              const home = m.home_bits_team_id === teamId;
              const opponent = home ? m.away_team_name : m.home_team_name;
              return (
                <PressableScale
                  key={m.bits_match_id}
                  style={styles.row}
                  onPress={() => router.push(`/lag/${teamId}/match/${m.bits_match_id}`)}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowOpp} numberOfLines={1}>
                      {home ? 'Hemma mot ' : 'Borta mot '}
                      <Text style={styles.rowOppName}>{opponent}</Text>
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {relativeMatchDate(m.match_date)} · {formatMatchDate(m.match_date)}
                      {m.hall_name ? ` · ${m.hall_name}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLOR.ink3} />
                </PressableScale>
              );
            })}
          </View>
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
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: SPACE[3],
    paddingVertical: SPACE[2],
    paddingHorizontal: SPACE[3],
    borderRadius: RADIUS.pill,
    backgroundColor: COLOR.surface2,
  },
  roleTagCaptain: { backgroundColor: COLOR.gold },
  roleText: { color: COLOR.ink2, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  roleTextCaptain: { color: COLOR.bg },

  section: { marginTop: SPACE[8] },
  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[4], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  rowText: { flex: 1, minWidth: 0 },
  rowOpp: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.medium },
  rowOppName: { color: COLOR.ink, fontFamily: FONT.bold },
  rowMeta: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 2 },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, marginTop: SPACE[8], textAlign: 'center' },
});
