export type PlayerMatch = {
  match_date: string;
  opponent_name: string | null;
  division_name: string | null;
  total_result: number | null;
  is_home_team: boolean | null;
  series: number[] | null;
};

export type TierInfo = { label: string; accent: string };

export type PlayerStats = {
  seasonAvg: number | null;
  recentAvg: number | null;
  formDiff: number | null;
  matchAvgs: number[]; // per-match average, chronological — for the form curve
  bestGame: number | null; // best single game
  bestSeries: number | null; // best match total (sum of that day's games)
  matchesPlayed: number;
  gamesPlayed: number;
  games200: number; // games of 200+
  hitRate: number; // % of games that are 200+
  consistency: number; // std-dev of per-match averages (lower = steadier)
  rating: number; // BK-rating 0–99
  tier: TierInfo;
  historyDesc: PlayerMatch[]; // newest first
};

const RECENT_GAMES = 9; // ~3 matches — the "form" window
const BIG_GAME = 200;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round = (n: number) => Math.round(n);

export function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return round(Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length));
}

// BK-rating (ported from web player-stats.calcRating): a 0–99 score blending
// season average, best game, and 200+ volume.
export function calcRating(avg: number, best: number, over200: number, hasData: boolean): number {
  if (!hasData) return Math.min(55, round(avg * 0.3));
  return Math.min(99, round(avg * 0.4 + (best / 40) * 0.4 + over200 * 1.5));
}

export function getTier(rating: number): TierInfo {
  if (rating >= 95) return { label: 'LEGEND', accent: '#f5c200' };
  if (rating >= 85) return { label: 'ELIT', accent: '#e0b84d' };
  if (rating >= 75) return { label: 'PROFFS', accent: '#30d47e' };
  if (rating >= 60) return { label: 'VETERAN', accent: '#c2a35a' };
  return { label: 'ROOKIE', accent: '#8a94a6' };
}

// Everything the player profile needs, derived from the match history's per-game
// series. Pure + season-agnostic so it's easy to test and reuse.
export function computePlayerStats(history: PlayerMatch[]): PlayerStats {
  const sorted = [...history].sort((a, b) => a.match_date.localeCompare(b.match_date));
  const gamesPerMatch = sorted.map((h) => (h.series ?? []).filter((g) => g > 0));
  const games = gamesPerMatch.flat();

  const seasonAvg = games.length ? round(mean(games)) : null;
  const recent = games.slice(-RECENT_GAMES);
  const recentAvg = recent.length ? round(mean(recent)) : null;
  const formDiff = seasonAvg != null && recentAvg != null ? recentAvg - seasonAvg : null;

  const matchAvgs = gamesPerMatch.filter((g) => g.length > 0).map((g) => mean(g));
  const bestGame = games.length ? Math.max(...games) : null;
  const bestSeries = gamesPerMatch.reduce(
    (mx, g) => (g.length ? Math.max(mx, g.reduce((a, b) => a + b, 0)) : mx),
    0,
  );
  const games200 = games.filter((g) => g >= BIG_GAME).length;
  const hitRate = games.length ? round((games200 / games.length) * 100) : 0;
  const rating = calcRating(seasonAvg ?? 0, bestGame ?? 0, games200, games.length > 0);

  return {
    seasonAvg,
    recentAvg,
    formDiff,
    matchAvgs,
    bestGame,
    bestSeries: bestSeries || null,
    matchesPlayed: sorted.length,
    gamesPlayed: games.length,
    games200,
    hitRate,
    consistency: stdDev(matchAvgs.map(round)),
    rating,
    tier: getTier(rating),
    historyDesc: [...sorted].reverse(),
  };
}

export type Achievement = { id: string; label: string; icon: string };

// Earned milestone badges derived from the season stats.
export function playerAchievements(s: PlayerStats): Achievement[] {
  const out: Achievement[] = [];
  if (s.bestGame === 300) out.push({ id: '300', label: '300 — perfekt spel', icon: 'star' });
  else if (s.bestGame != null && s.bestGame >= 250) out.push({ id: 'g250', label: `${s.bestGame} högsta spel`, icon: 'flame' });
  if (s.bestSeries != null && s.bestSeries >= 700) out.push({ id: 's700', label: `${s.bestSeries} bästa serie`, icon: 'trophy' });
  if (s.seasonAvg != null && s.seasonAvg >= 200) out.push({ id: 'avg200', label: `${s.seasonAvg} i snitt`, icon: 'trending-up' });
  if (s.hitRate >= 50 && s.gamesPlayed >= 6) out.push({ id: 'hit', label: `${s.hitRate}% 200+`, icon: 'flash' });
  const milestone = [100, 50, 25, 10].find((m) => s.matchesPlayed >= m);
  if (milestone) out.push({ id: `m${milestone}`, label: `${milestone}+ matcher`, icon: 'ribbon' });
  return out;
}
