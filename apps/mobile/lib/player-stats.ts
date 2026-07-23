export type PlayerMatch = {
  match_date: string;
  opponent_name: string | null;
  division_name: string | null;
  total_result: number | null;
  is_home_team: boolean | null;
  series: number[] | null;
};

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
  historyDesc: PlayerMatch[]; // newest first
};

const RECENT_GAMES = 9; // ~3 matches — the "form" window
const BIG_GAME = 200;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round = (n: number) => Math.round(n);

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

  return {
    seasonAvg,
    recentAvg,
    formDiff,
    matchAvgs,
    bestGame,
    bestSeries: bestSeries || null,
    matchesPlayed: sorted.length,
    gamesPlayed: games.length,
    games200: games.filter((g) => g >= BIG_GAME).length,
    historyDesc: [...sorted].reverse(),
  };
}
