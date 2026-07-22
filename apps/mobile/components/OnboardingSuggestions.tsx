import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useToggleFollow, type FollowEntityType } from '@/lib/follows';
import { supabase } from '@/lib/supabase';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Teammates (your team's roster) + nearby teams — the two highest-value tiers.
// Elitserien/rival-player tiers (web SuggestionTiers) come in a later increment.
function useOnboardingSuggestions(bitsTeamId: number) {
  return useQuery({
    queryKey: ['onboarding-suggestions', bitsTeamId],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const [{ data: teammates }, { data: nearby }] = await Promise.all([
        supabase.rpc('get_team_roster', { p_bits_team_id: bitsTeamId, p_limit: 12 }),
        supabase.rpc('get_nearby_teams', { p_bits_team_id: bitsTeamId, p_limit: 12 }),
      ]);
      return { teammates: teammates ?? [], nearby: nearby ?? [] };
    },
  });
}

export default function OnboardingSuggestions({ bitsTeamId }: { bitsTeamId: number }) {
  const { data, isLoading } = useOnboardingSuggestions(bitsTeamId);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLOR.ink3} />
      </View>
    );
  }
  if (!data) return null;

  const hasTeammates = data.teammates.length > 0;
  const hasNearby = data.nearby.length > 0;
  if (!hasTeammates && !hasNearby) return null;

  return (
    <View>
      {hasTeammates && (
        <Section label="DINA LAGKAMRATER">
          {data.teammates.map((p) => (
            <FollowRow
              key={p.public_id}
              entityType="player"
              entityId={p.public_id}
              title={p.name}
              subtitle={p.licence_average ? `Snitt ${p.licence_average}` : null}
            />
          ))}
        </Section>
      )}

      {hasNearby && (
        <Section label="LAG I NÄRHETEN">
          {data.nearby.map((t) => (
            <FollowRow
              key={t.bits_team_id}
              entityType="team"
              entityId={String(t.bits_team_id)}
              title={t.name}
              subtitle={t.club_name && t.club_name !== t.name ? t.club_name : null}
            />
          ))}
        </Section>
      )}
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

function FollowRow({
  entityType,
  entityId,
  title,
  subtitle,
}: {
  entityType: FollowEntityType;
  entityId: string;
  title: string;
  subtitle?: string | null;
}) {
  const [following, setFollowing] = useState(false);
  const { mutate } = useToggleFollow(entityType, entityId);

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      <Pressable
        style={[styles.pill, following && styles.pillOn]}
        onPress={() => {
          mutate();
          setFollowing((f) => !f);
        }}
        hitSlop={6}
      >
        <Text style={[styles.pillText, following && styles.pillTextOn]}>
          {following ? 'Följer' : 'Följ'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: SPACE[8], alignItems: 'center' },
  section: { marginTop: SPACE[8] },
  sectionLabel: {
    color: COLOR.ink2,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginBottom: SPACE[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE[3],
    paddingVertical: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: COLOR.hairline,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  rowSub: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: 1 },
  pill: {
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[2],
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLOR.ink4,
  },
  pillOn: { backgroundColor: COLOR.gold, borderColor: COLOR.gold },
  pillText: { color: COLOR.ink, fontSize: TYPE.caption, fontFamily: FONT.bold },
  pillTextOn: { color: COLOR.bg },
});
