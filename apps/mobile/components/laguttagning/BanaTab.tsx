import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useOilProfiles } from '@/lib/diary';
import { divisionRank } from '@/lib/team-admin';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// The venue + the oil profiles that fit this match's level. We don't get the exact
// booked pattern from BITS, so these are the division's candidates — the captain
// confirms in BITS (registered 5 weekdays before, 19:00).
function categoriesFor(division: string | null): string[] {
  const r = divisionRank(division);
  if (r === 1) return ['elite', 'elite_damer'];
  if (r === 2) return ['elite', 'bredare'];
  if (r >= 3 && r <= 6) return ['bredare', 'sammandrag'];
  return [];
}

export function BanaTab({ hall, division }: { hall: string | null; division: string | null }) {
  const { data: profiles = [] } = useOilProfiles();
  const cats = categoriesFor(division);
  const relevant = cats.length ? profiles.filter((p) => cats.includes(p.category ?? '')) : profiles;

  return (
    <View>
      <View style={styles.venue}>
        <Ionicons name="location" size={22} color={COLOR.gold} />
        <View style={styles.venueText}>
          <Text style={styles.venueName}>{hall ?? 'Okänd hall'}</Text>
          {!!division && <Text style={styles.venueDiv}>{division}</Text>}
        </View>
      </View>

      <Text style={styles.label}>TROLIGA OLJEBILDER</Text>
      {relevant.length > 0 ? (
        relevant.map((p) => (
          <View key={p.name} style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
            {(p.lengthFt != null || p.ratio != null) && (
              <Text style={styles.spec}>
                {[p.lengthFt != null ? `${p.lengthFt} ft` : null, p.ratio != null ? `${p.ratio.toFixed(2)}:1` : null].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.empty}>Inga oljebilder inlästa. Kör oil_profiles_seed.sql.</Text>
      )}
      <Text style={styles.note}>
        Exakt oljebild bekräftas i BITS (registreras 5 vardagar före match, senast 19:00).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  venue: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[4], padding: SPACE[4], borderRadius: RADIUS.lg, backgroundColor: COLOR.surface },
  venueText: { flex: 1, minWidth: 0 },
  venueName: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, letterSpacing: -0.3 },
  venueDiv: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },

  label: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5, marginTop: SPACE[8], marginBottom: SPACE[3] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3], paddingVertical: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  name: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold },
  spec: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.medium },
  empty: { color: COLOR.ink3, fontSize: TYPE.caption, paddingVertical: SPACE[3] },
  note: { color: COLOR.ink3, fontSize: TYPE.caption, marginTop: SPACE[4], lineHeight: 19 },
});
