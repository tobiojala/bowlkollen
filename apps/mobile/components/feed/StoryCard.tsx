import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FeedCard } from '@/components/feed/FeedCard';
import { PostActions } from '@/components/feed/PostActions';
import type { MatchResultPayload, TeamEvent, TeamEventType } from '@/lib/story-events';
import { COLOR, FONT, SPACE, TYPE } from '@/theme';

// The Remember pillar on native — a story from a followed team (a win, a segersvit,
// a personbästa). Mirrors apps/web FeedCard: an accent-coloured label, the team ·
// date meta, a headline, and an optional line of narrative. The whole post opens
// the linked match / player / team (route decided by storyEventHref in the parent).

const LABELS: Partial<Record<TeamEventType, string>> = {
  win_streak: 'SEGERSVIT',
  personal_best: 'PERSONBÄSTA',
  player_milestone: 'MILSTOLPE',
  form_rising: 'I FORM',
  division_climbed: 'KLÄTTRAR',
  match_preview: 'KOMMANDE',
  lineup_announced: 'UPPSTÄLLNING',
  comeback_win: 'COMEBACK',
  revenge_win: 'REVANSCH',
  giant_killer: 'JÄTTEDÖDARE',
  promotion_clinched: 'UPPFLYTTNING',
  captain_post: 'KAPTEN',
};

function labelFor(e: TeamEvent): string {
  if (e.event_type === 'match_result') {
    const r = (e.payload as MatchResultPayload).result;
    return r === 'W' ? 'SEGER' : r === 'L' ? 'FÖRLUST' : 'OAVGJORT';
  }
  return LABELS[e.event_type] ?? e.event_type.replace(/_/g, ' ').toUpperCase();
}

function accentFor(e: TeamEvent): string {
  if (e.event_type === 'match_result') {
    const r = (e.payload as MatchResultPayload).result;
    return r === 'W' ? COLOR.gold : r === 'L' ? COLOR.red : COLOR.ink3;
  }
  if (e.event_type === 'form_rising' || e.event_type === 'division_climbed') return COLOR.green;
  return COLOR.gold;
}

function relativeDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diff <= 0) return 'Idag';
  if (diff === 1) return 'Igår';
  if (diff < 7) return `${diff} dagar sedan`;
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

export const StoryCard = memo(function StoryCard({
  event,
  onPress,
  liked,
  saved,
  likeCount,
  onLike,
  onSave,
}: {
  event: TeamEvent;
  onPress: () => void;
  liked: boolean;
  saved: boolean;
  likeCount: number;
  onLike: (key: string, liked: boolean) => void;
  onSave: (key: string, saved: boolean) => void;
}) {
  const accent = accentFor(event);

  return (
    <FeedCard onPress={onPress}>
      <View style={styles.meta}>
        <Text style={[styles.label, { color: accent }]}>{labelFor(event)}</Text>
        <Text style={styles.metaRight} numberOfLines={1}>
          {[event.team_name, relativeDate(event.event_date)].filter(Boolean).join('  ·  ')}
        </Text>
      </View>

      <Text style={styles.title}>{event.title}</Text>

      <View style={styles.bottom}>
        {!!event.body && (
          <Text style={styles.body} numberOfLines={3}>
            {event.body}
          </Text>
        )}
        <PostActions
          postKey={`e${event.id}`}
          liked={liked}
          saved={saved}
          likeCount={likeCount}
          onLike={onLike}
          onSave={onSave}
          shareMessage={`${event.title} · Bowlkollen`}
        />
      </View>
    </FeedCard>
  );
});

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3] },
  label: { fontSize: TYPE.label, fontFamily: FONT.bold, letterSpacing: 1 },
  metaRight: { flexShrink: 1, color: COLOR.ink3, fontSize: TYPE.caption, fontFamily: FONT.medium, textAlign: 'right' },

  title: { color: COLOR.ink, fontSize: TYPE.title, fontFamily: FONT.bold, letterSpacing: -0.4, lineHeight: TYPE.title + 4 },

  bottom: { gap: SPACE[3] },
  body: { color: COLOR.ink2, fontSize: TYPE.body, fontFamily: FONT.regular, lineHeight: 22 },
});
