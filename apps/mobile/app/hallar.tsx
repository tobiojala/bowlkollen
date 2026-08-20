import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { useHalls, hallAddress, type Hall } from '@/lib/halls';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Bowling halls / venues — World 5 reference, native parity with web /hallar.
export default function Hallar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: halls = [], isLoading } = useHalls();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return halls;
    return halls.filter((h) => h.name.toLowerCase().includes(q) || (h.city ?? '').toLowerCase().includes(q));
  }, [halls, query]);

  return (
    <View style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={(h) => String(h.id)}
        renderItem={({ item }) => <HallCard hall={item} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 56 }]}
        ListHeaderComponent={
          <View>
            <Text style={styles.kicker}>BOWLING</Text>
            <Text style={styles.h1}>Hallar</Text>
            <Text style={styles.sub}>{isLoading ? 'Laddar…' : `${halls.length} hallar i Sverige`}</Text>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={COLOR.ink3} />
              <TextInput value={query} onChangeText={setQuery} placeholder="Sök hall eller stad…"
                placeholderTextColor={COLOR.ink4} style={styles.searchInput} autoCorrect={false} />
            </View>
          </View>
        }
        ListEmptyComponent={isLoading ? null : <Text style={styles.empty}>Inga hallar hittades</Text>}
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function HallCard({ hall }: { hall: Hall }) {
  const [open, setOpen] = useState(false);
  const address = hallAddress(hall);
  const link = (url: string) => Linking.openURL(url).catch(() => {});
  const specs = [hall.lanes ? `${hall.lanes} banor` : null, hall.machine_type, hall.lane_type].filter(Boolean) as string[];

  return (
    <View style={[styles.card, open && styles.cardOpen]}>
      <PressableScale style={styles.cardHead} onPress={() => setOpen((o) => !o)}>
        <View style={styles.cardHeadText}>
          <Text style={styles.name} numberOfLines={1}>{hall.name}</Text>
          {!!hall.city && (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={13} color={COLOR.ink3} />
              <Text style={styles.city}>{[hall.city, hall.region].filter(Boolean).join(' · ')}</Text>
            </View>
          )}
          {specs.length > 0 && (
            <View style={styles.chips}>
              {specs.map((s) => <Text key={s} style={styles.chip}>{s}</Text>)}
            </View>
          )}
          <View style={styles.badges}>
            {hall.online_booking && <Text style={[styles.badge, styles.badgeGold]}>Boka online</Text>}
            {hall.online_scoring && <Text style={[styles.badge, styles.badgeGreen]}>Live scoring</Text>}
            {hall.accepts_gift_cards && <Text style={styles.badge}>Presentkort</Text>}
          </View>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={COLOR.ink3} />
      </PressableScale>

      {open && (
        <View style={styles.details}>
          {!!address && <ContactRow icon="location-outline" label="Adress" value={address} onPress={() => link(`https://maps.google.com/?q=${encodeURIComponent(address)}`)} />}
          {hall.online_booking && hall.online_booking_url && <ContactRow icon="calendar-outline" label="Boka bana" value="Öppna bokning" onPress={() => link(hall.online_booking_url!)} />}
          {hall.online_scoring && hall.online_scoring_url && <ContactRow icon="stats-chart-outline" label="Live scoring" value="Öppna scoring" onPress={() => link(hall.online_scoring_url!)} />}
          {!!hall.phone && <ContactRow icon="call-outline" label="Telefon" value={hall.phone} onPress={() => link(`tel:${hall.phone}`)} />}
          {!!hall.email && <ContactRow icon="mail-outline" label="E-post" value={hall.email} onPress={() => link(`mailto:${hall.email}`)} />}
          {!!hall.website && <ContactRow icon="globe-outline" label="Hemsida" value="Öppna webbplats" onPress={() => link(hall.website!)} />}
        </View>
      )}
    </View>
  );
}

function ContactRow({ icon, label, value, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onPress: () => void;
}) {
  return (
    <PressableScale style={styles.contact} onPress={onPress}>
      <View style={styles.contactIcon}><Ionicons name={icon} size={15} color={COLOR.gold} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue} numberOfLines={1}>{value}</Text>
      </View>
      <Ionicons name="open-outline" size={15} color={COLOR.ink3} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  list: { paddingHorizontal: SPACE[4], paddingBottom: 120, gap: SPACE[2] },
  chromeLeft: { position: 'absolute', left: 16 },

  kicker: { color: COLOR.ink3, fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 4, fontFamily: FONT.bold, letterSpacing: -0.5, marginTop: 2 },
  sub: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], backgroundColor: COLOR.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], marginTop: SPACE[4], marginBottom: SPACE[2] },
  searchInput: { flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.regular, padding: 0 },
  empty: { color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', paddingVertical: SPACE[16] },

  card: { backgroundColor: COLOR.surface, borderRadius: RADIUS.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: COLOR.hairline, overflow: 'hidden' },
  cardOpen: { borderColor: 'rgba(245,194,0,0.35)' },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE[3], padding: SPACE[4] },
  cardHeadText: { flex: 1, minWidth: 0 },
  name: { color: COLOR.ink, fontSize: TYPE.body + 1, fontFamily: FONT.bold },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  city: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACE[2] },
  chip: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.medium, backgroundColor: COLOR.surface2, paddingHorizontal: SPACE[2], paddingVertical: 3, borderRadius: RADIUS.sm, overflow: 'hidden' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACE[2] },
  badge: { color: COLOR.ink3, fontSize: TYPE.micro, fontFamily: FONT.bold, letterSpacing: 0.3, backgroundColor: COLOR.surface2, paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.sm, overflow: 'hidden' },
  badgeGold: { color: COLOR.gold, backgroundColor: 'rgba(245,194,0,0.12)' },
  badgeGreen: { color: COLOR.green, backgroundColor: 'rgba(48,212,126,0.12)' },

  details: { paddingHorizontal: SPACE[4], paddingBottom: SPACE[2], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLOR.hairline },
  contact: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3] },
  contactIcon: { width: 32, height: 32, borderRadius: RADIUS.md, backgroundColor: 'rgba(245,194,0,0.10)', alignItems: 'center', justifyContent: 'center' },
  contactLabel: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  contactValue: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold, marginTop: 1 },
});
