import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Segmented } from '@/components/Segmented';
import { POST_MAX, useCreateTeamPoll, useCreateTeamPost } from '@/lib/team-posts';
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/theme';

const MAX_OPTIONS = 6;

// Compose a message or a poll. Captains/board only (the screen gates entry).
export function PostCompose({ teamId, onDone }: { teamId: number; onDone: () => void }) {
  const createPost = useCreateTeamPost(teamId);
  const createPoll = useCreateTeamPoll(teamId);
  const [kind, setKind] = useState<'message' | 'poll'>('message');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const busy = createPost.isPending || createPoll.isPending;
  const validOptions = options.map((o) => o.trim()).filter(Boolean);
  const canPost = kind === 'message' ? !!body.trim() : !!body.trim() && validOptions.length >= 2;

  const setOption = (i: number, v: string) => setOptions((prev) => prev.map((o, j) => (j === i ? v : o)));
  const done = () => { setTitle(''); setBody(''); setOptions(['', '']); onDone(); };

  const publish = () => {
    if (kind === 'message') createPost.mutate({ title, body }, { onSuccess: done });
    else createPoll.mutate({ title, body, options: validOptions }, { onSuccess: done });
  };

  return (
    <View style={styles.wrap}>
      <Segmented
        value={kind}
        onChange={setKind}
        options={[{ key: 'message', label: 'Meddelande' }, { key: 'poll', label: 'Omröstning' }]}
      />

      <TextInput style={styles.titleInput} value={title} onChangeText={setTitle} placeholder="Rubrik (valfritt)" placeholderTextColor={COLOR.ink4} maxLength={140} />
      <TextInput
        style={styles.bodyInput}
        value={body}
        onChangeText={setBody}
        placeholder={kind === 'poll' ? 'Fråga till laget…' : 'Skriv till laget…'}
        placeholderTextColor={COLOR.ink4}
        multiline
        textAlignVertical="top"
        maxLength={POST_MAX}
      />

      {kind === 'poll' && (
        <View style={styles.opts}>
          {options.map((o, i) => (
            <View key={i} style={styles.optRow}>
              <TextInput
                style={styles.optInput}
                value={o}
                onChangeText={(v) => setOption(i, v)}
                placeholder={`Alternativ ${i + 1}`}
                placeholderTextColor={COLOR.ink4}
                maxLength={140}
              />
              {options.length > 2 && (
                <PressableScale onPress={() => setOptions((prev) => prev.filter((_, j) => j !== i))} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={COLOR.ink4} />
                </PressableScale>
              )}
            </View>
          ))}
          {options.length < MAX_OPTIONS && (
            <PressableScale onPress={() => setOptions((prev) => [...prev, ''])} hitSlop={6}>
              <Text style={styles.addOpt}>+ Lägg till alternativ</Text>
            </PressableScale>
          )}
        </View>
      )}

      <View style={styles.foot}>
        <Text style={styles.counter}>{body.length}/{POST_MAX}</Text>
        <View style={styles.btns}>
          <PressableScale onPress={onDone} hitSlop={8}><Text style={styles.cancel}>Avbryt</Text></PressableScale>
          <PressableScale style={[styles.publish, (!canPost || busy) && styles.publishOff]} onPress={publish} disabled={!canPost || busy}>
            {busy ? <ActivityIndicator color={COLOR.bg} /> : <Text style={styles.publishText}>Publicera</Text>}
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACE[4], padding: SPACE[4], borderRadius: RADIUS.lg, backgroundColor: COLOR.surface, gap: SPACE[3] },
  titleInput: { color: COLOR.ink, fontSize: TYPE.body + 1, fontFamily: FONT.bold, paddingVertical: SPACE[2] },
  bodyInput: { color: COLOR.ink, fontSize: TYPE.body, minHeight: 96, lineHeight: 22 },
  opts: { gap: SPACE[2] },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  optInput: { flex: 1, backgroundColor: COLOR.surface2, borderRadius: RADIUS.md, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], color: COLOR.ink, fontSize: TYPE.body },
  addOpt: { color: COLOR.gold, fontSize: TYPE.body, fontFamily: FONT.bold, paddingVertical: SPACE[2] },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { color: COLOR.ink3, fontSize: TYPE.caption },
  btns: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4] },
  cancel: { color: COLOR.ink3, fontSize: TYPE.body, fontFamily: FONT.semibold },
  publish: { backgroundColor: COLOR.gold, borderRadius: RADIUS.md, paddingHorizontal: SPACE[6], paddingVertical: SPACE[3], alignItems: 'center' },
  publishOff: { opacity: 0.5 },
  publishText: { color: COLOR.bg, fontSize: TYPE.body, fontFamily: FONT.bold },
});
