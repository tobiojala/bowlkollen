import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { ScrollBlur } from '@/components/ScrollBlur';
import { TeamBackOffice } from '@/components/TeamBackOffice';
import { formatMatchDate, relativeMatchDate } from '@/lib/format';
import { useTeam, useTeamMatches } from '@/lib/team-data';
import { useLineupHistory, useMyTeamRole } from '@/lib/team-admin';
import { useMyUnread } from '@/lib/team-posts';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

export default function TeamAdminHub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);

  const { data: team } = useTeam(teamId);
  const { data: role } = useMyTeamRole(teamId);
  const { data: matches = [] } = useTeamMatches(teamId);
  const { data: history = [] } = useLineupHistory(teamId);
  const { data: unread } = useMyUnread();
  const unreadCount = unread?.get(teamId) ?? 0;

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
        ) : (
          <>
            <PressableScale style={styles.anslag} onPress={() => router.push(`/lag/${teamId}/nyheter`)}>
              <Ionicons name="megaphone-outline" size={22} color={COLOR.gold} />
              <View style={styles.anslagText}>
                <Text style={styles.anslagTitle}>Anslagstavla</Text>
                <Text style={styles.anslagBody}>Nyheter, info och meddelanden från lagledningen</Text>
              </View>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}><Text style={styles.unreadText}>{unreadCount}</Text></View>
              )}
              <Ionicons name="chevron-forward" size={18} color={COLOR.ink3} />
            </PressableScale>

            {upcoming.length === 0 ? (
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

            <TeamBackOffice teamId={teamId} teamName={team?.name ?? 'Lag'} isCaptain={role === 'captain'} />

            {history.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TIDIGARE LAGUTTAGNINGAR</Text>
                {history.map((h) => (
                  <PressableScale key={h.matchId} style={styles.histRow} onPress={() => router.push(`/matcher/${h.matchId}`)}>
                    <Text style={styles.histDate}>{formatMatchDate(h.date)}</Text>
                    <Text style={styles.histOpp} numberOfLines={1}>{h.opponent}</Text>
                    <Text style={styles.histScore}>{h.ours ?? '–'}–{h.theirs ?? '–'}</Text>
                    {h.outcome && (
                      <View style={[styles.histBadge, { backgroundColor: h.outcome === 'W' ? COLOR.green : h.outcome === 'L' ? COLOR.red : COLOR.surface2 }]}>
                        <Text style={[styles.histBadgeText, h.outcome === 'D' && { color: COLOR.ink2 }]}>
                          {h.outcome === 'W' ? 'V' : h.outcome === 'L' ? 'F' : 'O'}
                        </Text>
                      </View>
                    )}
                  </PressableScale>
                ))}
              </View>
            )}
          </>
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

  histRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  histDate: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, width: 58 },
  histOpp: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  histScore: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.bold },
  histBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  histBadgeText: { color: COLOR.bg, fontSize: TYPE.caption, fontFamily: FONT.bold },

  anslag: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[6], padding: SPACE[4], borderRadius: RADIUS.lg, backgroundColor: COLOR.surface },
  anslagText: { flex: 1, minWidth: 0, gap: 2 },
  anslagTitle: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  anslagBody: { color: COLOR.ink3, fontSize: TYPE.caption, lineHeight: 18 },
  unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: COLOR.gold, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: COLOR.bg, fontSize: TYPE.caption, fontFamily: FONT.bold },
});
