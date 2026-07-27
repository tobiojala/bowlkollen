import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { relativeMatchDate } from '@/lib/format';
import { useMySelections, type MySelection } from '@/lib/team-admin';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// "Du är uttagen" — shows on Profil when a captain has published a lineup you're in.
export function SelectedCard() {
  const { data: selections = [] } = useMySelections();
  if (selections.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {selections.map((s) => (
        <SelectionRow key={`${s.teamId}-${s.matchId}`} s={s} />
      ))}
    </View>
  );
}

function SelectionRow({ s }: { s: MySelection }) {
  const router = useRouter();
  const spot = s.isReserve ? 'Reserv' : `Banpar ${s.bord}`;

  return (
    <PressableScale style={styles.card} onPress={() => router.push(`/lag/${s.teamId}`)}>
      <View style={styles.star}>
        <Ionicons name="star" size={20} color={COLOR.gold} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Du är uttagen · {spot}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {s.teamName} mot {s.opponent} · {relativeMatchDate(s.date)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLOR.ink3} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACE[4], gap: SPACE[2] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    padding: SPACE[4],
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(245,194,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,194,0,0.30)',
  },
  star: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,194,0,0.14)' },
  body: { flex: 1, minWidth: 0 },
  title: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  sub: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 2 },
});
