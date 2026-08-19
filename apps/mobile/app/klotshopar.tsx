import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCircle } from '@/components/GlassButtons';
import { PressableScale } from '@/components/PressableScale';
import { useProShops, shopAddress, type ProShop } from '@/lib/pro-shops';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Klotshopar (pro shops) — World 5 reference, native parity with web /klotshopar.
export default function Klotshopar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: shops = [], isLoading } = useProShops();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((s) => s.name.toLowerCase().includes(q) || (s.city ?? '').toLowerCase().includes(q));
  }, [shops, query]);

  return (
    <View style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={(s) => String(s.id)}
        renderItem={({ item }) => <ShopCard shop={item} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 56 }]}
        ListHeaderComponent={
          <View>
            <Text style={styles.kicker}>BOWLING</Text>
            <Text style={styles.h1}>Klotshopar</Text>
            <Text style={styles.sub}>{isLoading ? 'Laddar…' : `${shops.length} pro shops i Sverige`}</Text>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={COLOR.ink3} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Sök shop eller stad…"
                placeholderTextColor={COLOR.ink4}
                style={styles.searchInput}
                autoCorrect={false}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : <Text style={styles.empty}>Inga klotshopar hittades</Text>
        }
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.chromeLeft, { top: insets.top + 6 }]}>
        <GlassCircle icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Tillbaka" />
      </View>
    </View>
  );
}

function ShopCard({ shop }: { shop: ProShop }) {
  const [open, setOpen] = useState(false);
  const address = shopAddress(shop);
  const link = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <View style={[styles.card, open && styles.cardOpen]}>
      <PressableScale style={styles.cardHead} onPress={() => setOpen((o) => !o)}>
        <View style={styles.cardHeadText}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{shop.name}</Text>
            {shop.ibpsia_certified && (
              <View style={styles.badge}>
                <Ionicons name="ribbon-outline" size={11} color={COLOR.gold} />
                <Text style={styles.badgeText}>IBPSIA</Text>
              </View>
            )}
          </View>
          {!!shop.city && (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={13} color={COLOR.ink3} />
              <Text style={styles.city}>{shop.city}</Text>
            </View>
          )}
          {shop.accepts_gift_cards && <Text style={styles.chip}>Presentkort</Text>}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={COLOR.ink3} />
      </PressableScale>

      {open && (
        <View style={styles.details}>
          {!!address && <ContactRow icon="location-outline" label="Adress" value={address} onPress={() => link(`https://maps.google.com/?q=${encodeURIComponent(address)}`)} />}
          {!!shop.phone && <ContactRow icon="call-outline" label="Telefon" value={shop.phone} onPress={() => link(`tel:${shop.phone}`)} />}
          {!!shop.mobile && <ContactRow icon="phone-portrait-outline" label="Mobil" value={shop.mobile} onPress={() => link(`tel:${shop.mobile}`)} />}
          {!!shop.email && <ContactRow icon="mail-outline" label="E-post" value={shop.email} onPress={() => link(`mailto:${shop.email}`)} />}
          {!!shop.website && <ContactRow icon="globe-outline" label="Hemsida" value="Öppna webbplats" onPress={() => link(shop.website!)} />}
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
      <View style={styles.contactIcon}>
        <Ionicons name={icon} size={15} color={COLOR.gold} />
      </View>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], flexWrap: 'wrap' },
  name: { color: COLOR.ink, fontSize: TYPE.body + 1, fontFamily: FONT.bold, flexShrink: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.sm, backgroundColor: 'rgba(245,194,0,0.12)' },
  badgeText: { color: COLOR.gold, fontSize: TYPE.micro, fontFamily: FONT.bold, letterSpacing: 0.5 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  city: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  chip: { alignSelf: 'flex-start', marginTop: SPACE[2], color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, backgroundColor: COLOR.surface2, paddingHorizontal: SPACE[2], paddingVertical: 3, borderRadius: RADIUS.sm, overflow: 'hidden' },

  details: { paddingHorizontal: SPACE[4], paddingBottom: SPACE[2], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLOR.hairline },
  contact: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[3] },
  contactIcon: { width: 32, height: 32, borderRadius: RADIUS.md, backgroundColor: 'rgba(245,194,0,0.10)', alignItems: 'center', justifyContent: 'center' },
  contactLabel: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium },
  contactValue: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.semibold, marginTop: 1 },
});
