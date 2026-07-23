import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassSheet } from '@/components/GlassSheet';
import { MatchRow } from '@/components/MatchRow';
import { PressableScale } from '@/components/PressableScale';
import { useTeamMatches } from '@/lib/team-data';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

type PeekFn = (teamId: number, teamName: string) => void;

const Ctx = createContext<{ peek: PeekFn }>({ peek: () => {} });
export const useTeamPeek = () => useContext(Ctx);

// A team's schedule at a glance — tapping a team name anywhere opens this glass
// sheet (upcoming + past matches); "Öppna lagsida" is the second tap through to
// the full team page. Global, so every match row gets it for free.
export function TeamPeekProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('');
  const [open, setOpen] = useState(false);

  const peek = useCallback<PeekFn>((id, name) => {
    setTeamId(id);
    setTeamName(name);
    setOpen(true);
  }, []);

  const { data: matches = [] } = useTeamMatches(teamId ?? 0, open);
  const { upcoming, results } = useMemo(() => {
    const up = matches
      .filter((m) => !m.is_finished)
      .sort((a, b) => a.match_date.localeCompare(b.match_date));
    const res = matches
      .filter((m) => m.is_finished)
      .sort((a, b) => b.match_date.localeCompare(a.match_date));
    return { upcoming: up, results: res };
  }, [matches]);

  const openFull = () => {
    setOpen(false);
    if (teamId) router.push(`/lag/${teamId}`);
  };
  const openMatch = (mid: number) => {
    setOpen(false);
    router.push(`/matcher/${mid}`);
  };

  return (
    <Ctx.Provider value={{ peek }}>
      {children}
      <GlassSheet visible={open} onClose={() => setOpen(false)} title={teamName}>
        <View style={styles.body}>
          <PressableScale style={styles.openBtn} onPress={openFull}>
            <Ionicons name="person-circle-outline" size={18} color={COLOR.gold} />
            <Text style={styles.openText}>Öppna lagsida</Text>
            <Ionicons name="chevron-forward" size={16} color={COLOR.gold} />
          </PressableScale>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[8] }}>
            {upcoming.length > 0 && (
              <>
                <Text style={styles.label}>KOMMANDE</Text>
                {upcoming.map((m) => (
                  <MatchRow
                    key={m.bits_match_id}
                    m={m}
                    showDivision={false}
                    onPress={() => openMatch(m.bits_match_id)}
                    onOpenTeam={(id, name) => id !== teamId && peek(id, name)}
                  />
                ))}
              </>
            )}
            {results.length > 0 && (
              <>
                <Text style={styles.label}>RESULTAT</Text>
                {results.map((m) => (
                  <MatchRow
                    key={m.bits_match_id}
                    m={m}
                    showDivision={false}
                    onPress={() => openMatch(m.bits_match_id)}
                    onOpenTeam={(id, name) => id !== teamId && peek(id, name)}
                  />
                ))}
              </>
            )}
            {matches.length === 0 && <Text style={styles.empty}>Inga matcher ännu.</Text>}
          </ScrollView>
        </View>
      </GlassSheet>
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    paddingVertical: SPACE[3],
    paddingHorizontal: SPACE[4],
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(245,194,0,0.10)',
    marginBottom: SPACE[3],
  },
  openText: { flex: 1, color: COLOR.gold, fontSize: TYPE.body, fontFamily: FONT.bold },
  label: {
    color: COLOR.ink3,
    fontSize: TYPE.label,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    marginTop: SPACE[6],
    marginBottom: SPACE[1],
  },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', marginTop: SPACE[8] },
});
