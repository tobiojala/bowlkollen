import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassSheet } from '@/components/GlassSheet';
import type { PlayerStats } from '@/lib/player-stats';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

export type PlayerSheetKind = 'rating' | 'puls' | null;

// Explainer sheets for the BK-rating and Profil-puls — the "what is this?"
// detail views, presented as the shared glass curtain.
export function PlayerInfoSheet({
  kind,
  stats,
  recentAvg,
  onClose,
}: {
  kind: PlayerSheetKind;
  stats: PlayerStats;
  recentAvg: number | null;
  onClose: () => void;
}) {
  return (
    <GlassSheet visible={kind != null} onClose={onClose} title={kind === 'puls' ? 'Profil-puls' : 'BK-rating'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[8] }}>
        {kind === 'rating' ? (
          <>
            <Text style={styles.body}>
              BK-rating (0–99) väger ihop ditt snitt, ditt bästa spel och hur ofta du slår 200+ till ett enda mått.
            </Text>
            <Row label="Snitt" value={stats.seasonAvg != null ? String(stats.seasonAvg) : '–'} />
            <Row label="Bästa spel" value={stats.bestGame != null ? String(stats.bestGame) : '–'} />
            <Row label="200+ spel" value={String(stats.games200)} />
            <Row label="Träffrate 200+" value={`${stats.hitRate}%`} />
            <Row label="Jämnhet (±)" value={String(stats.consistency)} />
            <Row label="Nivå" value={stats.tier.label} />
          </>
        ) : (
          <>
            <Text style={styles.body}>
              Profil-puls visar ditt snitt match för match — den taggiga kurvan avslöjar hur jämn eller ryckig
              säsongen varit. Den streckade linjen är ditt matchsnitt; kvällar över den är dina bästa. Dra längs
              kurvan för att läsa en enskild match.
            </Text>
            <Row label="Matchsnitt" value={stats.seasonAvg != null ? String(stats.seasonAvg) : '–'} />
            <Row label="Form (senaste)" value={recentAvg != null ? String(recentAvg) : '–'} />
            <Row label="Jämnhet (±)" value={String(stats.consistency)} />
            <Row label="Matcher" value={String(stats.matchesPlayed)} />
          </>
        )}
      </ScrollView>
    </GlassSheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.regular, lineHeight: 23, marginBottom: SPACE[4] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE[3],
    borderTopWidth: 1,
    borderTopColor: COLOR.hairline,
  },
  label: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.semibold },
  value: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
});
