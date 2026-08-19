import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FollowButton } from '@/components/FollowButton';
import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { useClub, teamTypeLabel, type ClubTeam } from '@/lib/clubs';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// A BITS club and its teams (World 5). Mirrors web /clubs/[bitsId] — a per-club
// identity wash, then each team is a doorway to its /lag page.
export default function ClubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bitsId = Number(id);
  const { data, isLoading } = useClub(bitsId);
  const club = data?.club ?? null;
  const teams = data?.teams ?? [];

  const hue = (club?.name ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const initials = (club?.name ?? '').split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase();

  if (isLoading) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={COLOR.gold} />
      </View>
    );
  }
  if (!club) {
    return (
      <View style={[styles.safe, styles.center]}>
        <Text style={styles.muted}>Klubben hittades inte</Text>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <FlatList
        data={teams}
        keyExtractor={(t) => String(t.bits_team_id)}
        renderItem={({ item }) => <TeamRow team={item} onPress={() => router.push(`/lag/${item.bits_team_id}`)} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <View>
            <View style={[styles.header, { backgroundColor: `hsl(${hue},42%,11%)`, paddingTop: insets.top + 56 }]}>
              <View style={styles.headRow}>
                <View style={[styles.logo, { borderColor: `hsla(${hue},50%,50%,0.5)`, backgroundColor: `hsla(${hue},50%,45%,0.15)` }]}>
                  {club.logo_url
                    ? <Image source={{ uri: club.logo_url }} style={styles.logoImg} resizeMode="contain" />
                    : <Text style={[styles.initials, { color: `hsl(${hue},50%,72%)` }]}>{initials}</Text>}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name} numberOfLines={2}>{club.name}</Text>
                  {!!(club.county || club.hall_name) && (
                    <Text style={styles.sub} numberOfLines={1}>{[club.county, club.hall_name].filter(Boolean).join(' · ')}</Text>
                  )}
                  {teams.length > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{teams.length} lag</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            {teams.length > 0 && <Text style={styles.sectionLabel}>LAG · {teams.length}</Text>}
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Den här klubben har inga registrerade lag i BITS just nu.</Text>}
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function TeamRow({ team, onPress }: { team: ClubTeam; onPress: () => void }) {
  const label = teamTypeLabel(team.team_type_desc);
  return (
    <View style={styles.row}>
      <PressableScale style={styles.rowMain} onPress={onPress}>
        <View style={styles.rowIcon}>
          <Text style={styles.rowIconText}>{team.name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.rowName} numberOfLines={1}>{team.name}</Text>
          <View style={styles.rowMeta}>
            {!!label && <Text style={styles.tier}>{label}</Text>}
            {!!team.hall_name && <Text style={styles.hall} numberOfLines={1}>{team.hall_name}</Text>}
          </View>
        </View>
      </PressableScale>
      <FollowButton entityType="team" entityId={String(team.bits_team_id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: COLOR.ink3, fontSize: TYPE.body },
  chromeLeft: { position: 'absolute', left: 16 },

  header: { paddingHorizontal: SPACE[4], paddingBottom: SPACE[6] },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4] },
  logo: { width: 64, height: 64, borderRadius: RADIUS.lg, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: 56, height: 56 },
  initials: { fontSize: 18, fontFamily: FONT.bold },
  name: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, letterSpacing: -0.4 },
  sub: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 3 },
  badge: { alignSelf: 'flex-start', marginTop: SPACE[2], backgroundColor: 'rgba(245,194,0,0.16)', borderRadius: RADIUS.sm, paddingHorizontal: SPACE[2], paddingVertical: 3 },
  badgeText: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 0.5 },

  sectionLabel: { color: COLOR.ink2, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, paddingHorizontal: SPACE[4], paddingTop: SPACE[6], paddingBottom: SPACE[2] },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', paddingVertical: SPACE[16], paddingHorizontal: SPACE[6] },

  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], paddingHorizontal: SPACE[4], paddingVertical: SPACE[2] },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACE[3], backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: COLOR.hairline, padding: SPACE[3] },
  rowIcon: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: 'rgba(245,194,0,0.10)', alignItems: 'center', justifyContent: 'center' },
  rowIconText: { color: COLOR.gold, fontSize: TYPE.body, fontFamily: FONT.bold },
  rowName: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], marginTop: 3 },
  tier: { color: COLOR.ink2, fontSize: TYPE.label, fontFamily: FONT.semibold, backgroundColor: COLOR.surface2, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden' },
  hall: { color: COLOR.ink3, fontSize: TYPE.caption, flexShrink: 1 },
});
