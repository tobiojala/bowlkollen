import { Ionicons } from '@expo/vector-icons';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BallShelf } from '@/components/BallShelf';
import { CaptainQuickActions } from '@/components/CaptainQuickActions';
import { ClaimedBadge } from '@/components/ClaimedBadge';
import { IdentityAvatar } from '@/components/IdentityAvatar';
import { NextMatchCard } from '@/components/NextMatchCard';
import { SelectedCard } from '@/components/SelectedCard';
import { PressableScale } from '@/components/PressableScale';
import { useAppBackground } from '@/lib/app-background';
import { signOut, useAuth } from '@/lib/auth';
import { useMyFollowCount } from '@/lib/follows';
import { useMyClaim, useMyStats } from '@/lib/me';
import { supabase } from '@/lib/supabase';
import { teamColor, teamInitials } from '@/lib/team-identity';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// release_player_claim / delete_my_account aren't in the generated types yet
// (run supabase/migrations/account_tools.sql) — reach them through an untyped view.
const db = supabase as unknown as SupabaseClient;

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { data: followCount = 0 } = useMyFollowCount();
  const { data: claim } = useMyClaim();
  const verifiedClaim = claim?.status === 'verified';
  const stats = useMyStats(verifiedClaim ? claim?.publicId : undefined);
  const qc = useQueryClient();
  const { uri: bgUri, pick: bgPick, clear: bgClear } = useAppBackground();

  const releaseClaim = () =>
    Alert.alert('Släpp spelarkoppling', 'Din spelarprofil kopplas bort från kontot. Du kan koppla igen när som helst.', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Släpp',
        style: 'destructive',
        onPress: async () => {
          await db.rpc('release_player_claim');
          qc.invalidateQueries({ queryKey: ['my-claim'] });
        },
      },
    ]);

  const deleteAccount = () =>
    Alert.alert('Radera konto', 'Detta raderar ditt konto och all din data permanent. Går inte att ångra.', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Radera konto',
        style: 'destructive',
        onPress: async () => {
          await db.rpc('delete_my_account');
          await signOut();
        },
      },
    ]);

  const email = session?.user?.email ?? '';
  const meta = session?.user?.user_metadata ?? {};
  const accountName = (typeof meta.full_name === 'string' && meta.full_name) || email || 'Bowlare';
  const verified = verifiedClaim;
  const displayName = verified ? claim!.name : accountName;

  const chooseBackground = () => {
    if (bgUri) {
      Alert.alert('Bakgrund', 'Din privata bakgrund (bara du ser den).', [
        { text: 'Byt bild', onPress: () => bgPick() },
        { text: 'Ta bort', style: 'destructive', onPress: () => bgClear() },
        { text: 'Avbryt', style: 'cancel' },
      ]);
    } else {
      bgPick();
    }
  };

  return (
    <View style={styles.safe}>
      {bgUri && (
        <ImageBackground source={{ uri: bgUri }} style={StyleSheet.absoluteFill} resizeMode="cover">
          <View style={styles.scrim} />
        </ImageBackground>
      )}
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACE[2] }]}>
        <Text style={styles.title}>Profil</Text>

        {/* Identity — your claimed player if verified, otherwise the account */}
        <PressableScale
          style={styles.identity}
          disabled={!verified}
          onPress={() => verified && router.push(`/player/${claim!.publicId}`)}
        >
          <IdentityAvatar colors={teamColor(displayName)} initials={teamInitials(displayName)} size={60} />
          <View style={styles.who}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
              {verified && <ClaimedBadge size={18} />}
            </View>
            <Text style={styles.sub} numberOfLines={1}>{verified ? (claim!.club ?? 'Min spelarprofil') : email}</Text>
          </View>
          {verified && <Ionicons name="chevron-forward" size={20} color={COLOR.ink3} />}
        </PressableScale>

        {/* Season snapshot — a doorway to the full player page */}
        {verified && stats && (
          <PressableScale style={styles.snapshot} onPress={() => router.push(`/player/${claim!.publicId}`)}>
            <Snap value={stats.seasonAvg != null ? String(stats.seasonAvg) : '–'} label="SNITT" />
            <View style={styles.snapDivider} />
            <Snap value={String(stats.matchesPlayed)} label="MATCHER" />
            <View style={styles.snapDivider} />
            <View style={styles.snapCol}>
              <View style={styles.formVal}>
                <Text style={styles.snapValue}>{stats.recentAvg != null ? String(stats.recentAvg) : '–'}</Text>
                {stats.formDiff != null && stats.formDiff !== 0 && (
                  <Text style={[styles.formDelta, { color: stats.formDiff > 0 ? COLOR.green : COLOR.red }]}>
                    {stats.formDiff > 0 ? '▲' : '▼'} {Math.abs(stats.formDiff)}
                  </Text>
                )}
              </View>
              <Text style={styles.snapLabel}>FORM</Text>
            </View>
          </PressableScale>
        )}

        {/* You've been picked for a published lineup */}
        <SelectedCard />

        {/* Next match → prep sheet (bowling diary) */}
        <NextMatchCard />

        {/* Captain/member shortcuts — one tap to lineup & availability */}
        <CaptainQuickActions />

        {/* Claim CTA / pending state */}
        {!claim && (
          <PressableScale style={styles.cta} onPress={() => router.push('/claim')}>
            <Ionicons name="person-circle-outline" size={24} color={COLOR.gold} />
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>Koppla din spelarprofil</Text>
              <Text style={styles.ctaBody}>Hitta dig själv för att se din statistik och rating.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLOR.ink3} />
          </PressableScale>
        )}
        {claim?.status === 'pending' && (
          <View style={styles.pending}>
            <Ionicons name="time-outline" size={18} color={COLOR.ink3} />
            <Text style={styles.pendingText}>Din spelarkoppling väntar på granskning.</Text>
          </View>
        )}

        {/* Ball arsenal (bowling diary, Phase 2) */}
        <BallShelf />


        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BOWLING</Text>
          <PressableScale style={styles.row} onPress={() => router.push('/hallar' as never)}>
            <Ionicons name="location-outline" size={22} color={COLOR.ink2} />
            <Text style={styles.rowName}>Hallar</Text>
            <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
          </PressableScale>
          <PressableScale style={styles.row} onPress={() => router.push('/klotshopar' as never)}>
            <Ionicons name="storefront-outline" size={22} color={COLOR.ink2} />
            <Text style={styles.rowName}>Klotshopar</Text>
            <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
          </PressableScale>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>KONTO</Text>
          <PressableScale style={styles.row} onPress={() => router.push('/following')}>
            <Ionicons name="people-outline" size={22} color={COLOR.ink2} />
            <Text style={styles.rowName}>Följer</Text>
            <Text style={styles.count}>{followCount}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
          </PressableScale>
          <PressableScale style={styles.row} onPress={chooseBackground}>
            <Ionicons name="image-outline" size={22} color={COLOR.ink2} />
            <Text style={styles.rowName}>Bakgrund</Text>
            <Text style={styles.count}>{bgUri ? 'På' : 'Av'}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
          </PressableScale>
          <PressableScale style={styles.row} onPress={() => router.push('/kalender')}>
            <Ionicons name="calendar-outline" size={22} color={COLOR.ink2} />
            <Text style={styles.rowName}>Kalender</Text>
            <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
          </PressableScale>
          <PressableScale style={styles.row} onPress={() => router.push('/invite')}>
            <Ionicons name="ticket-outline" size={22} color={COLOR.ink2} />
            <Text style={styles.rowName}>Lös in inbjudningskod</Text>
            <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
          </PressableScale>
          {!!claim && (
            <PressableScale style={styles.row} onPress={releaseClaim}>
              <Ionicons name="link-outline" size={22} color={COLOR.ink2} />
              <Text style={styles.rowName}>Släpp spelarkoppling</Text>
              <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
            </PressableScale>
          )}
          <PressableScale style={styles.row} onPress={deleteAccount}>
            <Ionicons name="trash-outline" size={22} color={COLOR.red} />
            <Text style={[styles.rowName, { color: COLOR.red }]}>Radera konto</Text>
            <Ionicons name="chevron-forward" size={18} color={COLOR.ink4} />
          </PressableScale>
        </View>

        <PressableScale style={styles.signout} onPress={signOut}>
          <Text style={styles.signoutText}>Logga ut</Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
}

function Snap({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.snapCol}>
      <Text style={styles.snapValue}>{value}</Text>
      <Text style={styles.snapLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,13,16,0.80)' },
  scroll: { paddingHorizontal: SPACE[6], paddingBottom: 120 },
  title: { color: COLOR.ink, fontSize: TYPE.title + 8, fontFamily: FONT.bold, letterSpacing: -0.5, paddingTop: SPACE[3], paddingBottom: SPACE[4] },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[4],
    backgroundColor: COLOR.surface,
    borderRadius: RADIUS.lg,
    padding: SPACE[4],
  },
  who: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, letterSpacing: -0.3 },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },

  snapshot: { flexDirection: 'row', alignItems: 'center', marginTop: SPACE[4], paddingVertical: SPACE[2] },
  snapCol: { flex: 1, alignItems: 'center', gap: 6 },
  snapValue: { fontFamily: FONT.score, fontSize: 26, color: COLOR.ink, letterSpacing: -0.5 },
  snapLabel: { fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1, color: COLOR.ink3 },
  snapDivider: { width: 1, alignSelf: 'stretch', backgroundColor: COLOR.hairline },
  formVal: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  formDelta: { fontSize: TYPE.caption, fontFamily: FONT.bold },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    marginTop: SPACE[3],
    padding: SPACE[4],
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(245,194,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.24)',
  },
  ctaText: { flex: 1, minWidth: 0, gap: 2 },
  ctaTitle: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  ctaBody: { color: COLOR.ink3, fontSize: TYPE.caption },
  pending: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], marginTop: SPACE[3], paddingHorizontal: SPACE[2] },
  pendingText: { color: COLOR.ink3, fontSize: TYPE.caption },

  section: { marginTop: SPACE[8] },
  sectionLabel: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginBottom: SPACE[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    paddingVertical: SPACE[3],
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
  },
  rowName: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  roleTag: { color: COLOR.gold, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  count: { color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.bold },

  signout: {
    marginTop: SPACE[12],
    borderWidth: 1,
    borderColor: COLOR.hairline,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[4],
    alignItems: 'center',
  },
  signoutText: { color: COLOR.red, fontSize: TYPE.body, fontFamily: FONT.bold },
});
