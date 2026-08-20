import { TAVLINGAR, type Tavling } from '@bowlkollen/core';
import { useMemo } from 'react';
import { FlatList, Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/PressableScale';
import { useNavScroll } from '@/lib/nav-scroll';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// Competitions — native parity with web /tavlingar, same curated list from
// @bowlkollen/core. Pågående first, then kommande, then avslutade.
const ORDER: Record<Tavling['status'], number> = { pagaende: 0, kommande: 1, avslutad: 2 };

function openHref(href: string) {
  const url = href.startsWith('http') ? href : `https://bowlkollen.se${href}`;
  Linking.openURL(url).catch(() => {});
}

export default function Tavlingar() {
  const insets = useSafeAreaInsets();
  const { onScroll } = useNavScroll();
  const list = useMemo(() => [...TAVLINGAR].sort((a, b) => ORDER[a.status] - ORDER[b.status]), []);
  const live = TAVLINGAR.filter((t) => t.status === 'pagaende').length;

  return (
    <View style={styles.safe}>
      <FlatList
        data={list}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TavCard t={item} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + SPACE[4] }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.h1}>Tävlingar</Text>
            <Text style={styles.sub}>{live > 0 ? `${live} pågår just nu` : 'Tävlingar i Sverige'}</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function TavCard({ t }: { t: Tavling }) {
  const live = t.status === 'pagaende';
  const done = t.status === 'avslutad';
  const statusColor = live ? COLOR.green : done ? COLOR.ink3 : COLOR.gold;
  const statusText = live ? 'PÅGÅENDE' : done ? 'AVSLUTAD' : 'KOMMANDE';

  return (
    <View style={[styles.card, live && styles.cardLive, done && styles.cardDone]}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>
      <Text style={styles.name}>{t.name}</Text>
      <Text style={styles.subtitle}>{t.subtitle}</Text>
      <Text style={styles.meta} numberOfLines={1}>{[t.date, t.venue].filter(Boolean).join('  ·  ')}</Text>

      <View style={styles.actions}>
        <PressableScale style={styles.primary} onPress={() => openHref(t.officialHref ?? t.href)}>
          <Text style={styles.primaryText}>{t.buttonLabel}</Text>
        </PressableScale>
        {(t.extraButtons ?? []).map((b) => (
          <PressableScale key={b.href} style={styles.secondary} onPress={() => openHref(b.href)}>
            <Text style={styles.secondaryText}>{b.label}</Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOR.bg },
  list: { paddingHorizontal: SPACE[4], paddingBottom: 120, gap: SPACE[3] },
  header: { paddingBottom: SPACE[2] },
  h1: { color: COLOR.ink, fontSize: TYPE.title + 6, fontFamily: FONT.bold, letterSpacing: -0.5 },
  sub: { color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.medium, marginTop: 4 },

  card: { backgroundColor: COLOR.surface, borderRadius: RADIUS.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: COLOR.hairline, padding: SPACE[4] },
  cardLive: { borderColor: 'rgba(48,212,126,0.35)' },
  cardDone: { opacity: 0.7 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACE[2] },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  name: { color: COLOR.ink, fontSize: TYPE.body + 3, fontFamily: FONT.bold, letterSpacing: -0.3 },
  subtitle: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.regular, marginTop: 4, lineHeight: 19 },
  meta: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: SPACE[2] },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2], marginTop: SPACE[4] },
  primary: { backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[2] },
  primaryText: { color: COLOR.bg, fontSize: TYPE.caption, fontFamily: FONT.bold },
  secondary: { backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[2] },
  secondaryText: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.semibold },
});
