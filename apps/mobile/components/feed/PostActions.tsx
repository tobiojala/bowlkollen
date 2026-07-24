import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { isLiked, isSaved, toggleLike, toggleSave } from '@/lib/feed-actions';
import { COLOR, SPACE } from '@/theme';

const ICON = 25; // senior-legible tap targets

// Instagram-style action row at the bottom of every feed post: like + share on
// the left, save on the right. Like/save persist for the session (see
// lib/feed-actions); share uses the native sheet.
export function PostActions({ postKey, shareMessage }: { postKey: string; shareMessage: string }) {
  const [liked, setLiked] = useState(() => isLiked(postKey));
  const [saved, setSaved] = useState(() => isSaved(postKey));

  const onLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLiked(toggleLike(postKey));
  };
  const onSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaved(toggleSave(postKey));
  };
  const onShare = () => Share.share({ message: shareMessage }).catch(() => {});

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <IconBtn name={liked ? 'heart' : 'heart-outline'} color={liked ? COLOR.red : COLOR.ink2} onPress={onLike} label="Gilla" />
        <IconBtn name="paper-plane-outline" color={COLOR.ink2} onPress={onShare} label="Dela" />
      </View>
      <IconBtn name={saved ? 'bookmark' : 'bookmark-outline'} color={saved ? COLOR.gold : COLOR.ink2} onPress={onSave} label="Spara" />
    </View>
  );
}

function IconBtn({
  name,
  color,
  onPress,
  label,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityLabel={label} style={styles.btn}>
      <Ionicons name={name} size={ICON} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACE[1],
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: SPACE[6] },
  btn: { paddingVertical: 2 },
});
