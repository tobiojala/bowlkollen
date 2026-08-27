// Home-feed ranking primitives — shared verbatim by web + native so the two
// streams can't drift on the numbers. Each app builds its own FeedItem[] from
// its own data shapes, then scores with these: a recency base plus affinity
// boosts. Higher score surfaces earlier.
//
//   score = recencyScore(ts) + (app-specific affinity: event / serie / tier / followed)
//
// The event and serie boosts live here because both apps weight them identically;
// tier and followed boosts stay app-side (web mixes cold-start + followed content
// and weights division tier; native's source is already followed-scoped).

// Story-event affinity by type — the meaningful moments the feed should surface.
export const EVENT_BOOST: Record<string, number> = {
  promotion_clinched: 50,
  personal_best:      35,
  win_streak:         25,
  unbeaten_run:       20,
  comeback_win:       20,
  revenge_win:        20,
  giant_killer:       20,
  rivalry_match:      15,
  division_climbed:   15,
  player_milestone:   12,
  form_rising:        10,
  match_result:        5,
  match_preview:       5,
  lineup_announced:    3,
  captain_post:        2,
};

/** Recency base: 100 now → 0 at ~14 days (−7/day). Future dates clamp to 100 so
 *  an upcoming fixture reads as "now" and can lead the stream. */
export function recencyScore(ts: string, now: number = Date.now()): number {
  const daysAgo = Math.max(0, (now - new Date(ts).getTime()) / 86_400_000);
  return Math.max(0, 100 - daysAgo * 7);
}

/** Affinity boost for a story event by type (unknown types → 5). */
export function eventBoost(eventType: string): number {
  return EVENT_BOOST[eventType] ?? 5;
}

/** Standout single-serie boost: 300 → 40, 270 → 20, 250 → 10, else 0. */
export function serieBoost(total: number): number {
  return total >= 300 ? 40 : total >= 270 ? 20 : total >= 250 ? 10 : 0;
}

// Spread card kinds so the stream reads mixed, not sorted into type buckets
// (all the +80 story events clustering at the top when data is old and recency
// flattens). Keeps rough relevance — always pulls the best-ranked head still
// available — but won't repeat the previous kind while another kind waits.
// Generic so web (FeedEntry) and native (FeedItem) share the exact same mixer.
export function diversifyByKind<T extends { kind: string }>(ranked: T[]): T[] {
  const buckets = new Map<string, T[]>();
  ranked.forEach((e) => { const b = buckets.get(e.kind); if (b) b.push(e); else buckets.set(e.kind, [e]); });
  const rankOf = new Map<T, number>(ranked.map((e, i) => [e, i]));
  const out: T[] = [];
  let last = '';
  while (out.length < ranked.length) {
    let pick: T | null = null;
    let pickKind = '';
    for (const [kind, arr] of buckets) {
      if (arr.length === 0 || kind === last) continue;
      if (!pick || rankOf.get(arr[0])! < rankOf.get(pick)!) { pick = arr[0]; pickKind = kind; }
    }
    if (!pick) for (const [kind, arr] of buckets) { if (arr.length) { pick = arr[0]; pickKind = kind; break; } }
    buckets.get(pickKind)!.shift();
    out.push(pick as T);
    last = pickKind;
  }
  return out;
}
