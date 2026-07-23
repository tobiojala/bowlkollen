import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
import type { Promo } from '@/lib/promos';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

// A sponsored post — same header → hero → detail rhythm as every other card, so
// it blends into the feed. The hero is the creative image (real deals) or a
// tinted placeholder with the headline. A quiet "Sponsrad" tag, like Instagram.
export const PromoCard = memo(function PromoCard({ promo, onPress }: { promo: Promo; onPress?: () => void }) {
  return (
    <FeedCard onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: promo.accent }]}>
          <Ionicons name={promo.sponsorIcon} size={22} color={COLOR.bg} />
        </View>
        <View style={styles.who}>
          <Text style={styles.sponsor} numberOfLines={1}>{promo.sponsor}</Text>
          <Text style={styles.sponsrad}>Sponsrad</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color={COLOR.ink3} />
      </View>

      <View style={styles.hero}>
        {promo.imageUrl ? (
          <Image source={{ uri: promo.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[promo.accent, 'rgba(11,13,16,0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.heroText}>
          <Text style={styles.kicker}>{promo.kicker}</Text>
          <Text style={styles.title} numberOfLines={2}>{promo.title}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.body} numberOfLines={2}>{promo.body}</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{promo.cta}</Text>
          <Ionicons name="arrow-forward" size={15} color={COLOR.bg} />
        </View>
      </View>
    </FeedCard>
  );
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  logo: { width: 40, height: 40, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
  who: { flex: 1, minWidth: 0 },
  sponsor: { color: COLOR.ink, fontSize: TYPE.body, fontFamily: FONT.bold },
  sponsrad: { color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, marginTop: 1 },

  hero: {
    height: 150,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroText: { padding: SPACE[4], gap: 2 },
  kicker: { color: 'rgba(255,255,255,0.85)', fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1.5 },
  title: { color: '#fff', fontSize: TYPE.title + 2, fontFamily: FONT.bold, letterSpacing: -0.4 },

  footer: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  body: { flex: 1, color: COLOR.ink3, fontSize: TYPE.caption, lineHeight: 19 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLOR.gold,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACE[2],
    paddingHorizontal: SPACE[4],
  },
  ctaText: { color: COLOR.bg, fontSize: TYPE.caption, fontFamily: FONT.bold },
});
