import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { COLOR, FONT, SPACE, TYPE } from '@/theme';

const ICON = 25; // senior-legible tap targets

// Instagram-style action row: like (+ count) and share on the left, save on the
// right. Controlled — liked/saved/likeCount come from the real reactions store.
export function PostActions({
  postKey,
  liked,
  saved,
  likeCount,
  onLike,
  onSave,
  shareMessage,
}: {
  postKey: string;
  liked: boolean;
  saved: boolean;
  likeCount: number;
  onLike: (key: string, currentlyLiked: boolean) => void;
  onSave: (key: string, currentlySaved: boolean) => void;
  shareMessage: string;
}) {
  const like = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike(postKey, liked);
  };
  const save = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave(postKey, saved);
  };
  const share = () => Share.share({ message: shareMessage }).catch(() => {});

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Pressable onPress={like} hitSlop={10} accessibilityLabel="Gilla" style={styles.likeBtn}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={ICON} color={liked ? COLOR.red : COLOR.ink2} />
          {likeCount > 0 && <Text style={styles.count}>{likeCount}</Text>}
        </Pressable>
        <Pressable onPress={share} hitSlop={10} accessibilityLabel="Dela" style={styles.btn}>
          <Ionicons name="paper-plane-outline" size={ICON} color={COLOR.ink2} />
        </Pressable>
      </View>
      <Pressable onPress={save} hitSlop={10} accessibilityLabel="Spara" style={styles.btn}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={ICON} color={saved ? COLOR.gold : COLOR.ink2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: SPACE[1] },
  left: { flexDirection: 'row', alignItems: 'center', gap: SPACE[6] },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], paddingVertical: 2 },
  count: { color: COLOR.ink2, fontSize: TYPE.caption, fontFamily: FONT.bold, fontVariant: ['tabular-nums'] },
  btn: { paddingVertical: 2 },
});
