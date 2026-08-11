export type PlayerMatch = {
  match_date: string;
  opponent_name: string | null;
  division_name: string | null;
  total_result: number | null;
  is_home_team: boolean | null;
  series: number[] | null;
};

export type TrendPoint = { avg: number; date: string; label: string };

// Chronological per-match average trend for the profile graph — one point per
// match that was actually bowled (skips matches with no games). label = opponent.
export function matchTrendPoints(history: PlayerMatch[]): TrendPoint[] {
  return [...history]
    .sort((a, b) => a.match_date.localeCompare(b.match_date))
    .map((m) => {
      const games = (m.series ?? []).filter((g) => g > 0);
      const avg = games.length ? Math.round(games.reduce((s, g) => s + g, 0) / games.length) : 0;
      return { avg, date: m.match_date, label: m.opponent_name ?? '' };
    })
    .filter((p) => p.avg > 0);
}

// Rolling BK-rating trend — the rating recomputed after each match on all games so
// far, so the hero graph shows how the rating climbed/fell across the season.
export function rollingRatingPoints(history: PlayerMatch[]): TrendPoint[] {
  const sorted = [...history].sort((a, b) => a.match_date.localeCompare(b.match_date));
  const games: number[] = [];
  const out: TrendPoint[] = [];
  for (const m of sorted) {
    const g = (m.series ?? []).filter((x) => x > 0);
    if (!g.length) continue;
    games.push(...g);
    const avg = Math.round(games.reduce((s, x) => s + x, 0) / games.length);
    const best = Math.max(...games);
    const over200 = games.filter((x) => x >= 200).length;
    out.push({ avg: calcRating(avg, best, over200, true), date: m.match_date, label: m.opponent_name ?? '' });
  }
  return out;
}

// Running BITS-style season average — total pins ÷ games after each match. Smooth
// and converging (unlike the per-match snitt), it's the season average as it builds.
export function cumulativeAvgPoints(history: PlayerMatch[]): TrendPoint[] {
  const sorted = [...history].sort((a, b) => a.match_date.localeCompare(b.match_date));
  const games: number[] = [];
  const out: TrendPoint[] = [];
  for (const m of sorted) {
    const g = (m.series ?? []).filter((x) => x > 0);
    if (!g.length) continue;
    games.push(...g);
    out.push({ avg: Math.round(games.reduce((s, x) => s + x, 0) / games.length), date: m.match_date, label: m.opponent_name ?? '' });
  }
  return out;
}

// Season boundaries (Swedish bowling season runs Jul→Jun). Matches the web SEASON.
export const SEASON = { CURRENT: '2026-07-01', PREV: '2025-07-01' } as const;

const avgOf = (games: number[]): number | null => (games.length ? Math.round(games.reduce((a, b) => a + b, 0) / games.length) : null);

export type SeasonSplit = {
  activeRows: PlayerMatch[];   // current season, or all history in the offseason
  prevRows: PlayerMatch[];
  hasCurrent: boolean;         // does the current season actually have matches? (false in preseason)
  lastSeasonAvg: number | null;
  prevMatchAvgs: number[];     // previous-season per-match averages (for the duel overlay)
};

// Split history into current / previous season. Before the new season has any
// matches (preseason), activeRows falls back to all history so the profile isn't empty.
export function splitSeason(history: PlayerMatch[]): SeasonSplit {
  const curr = history.filter((h) => h.match_date >= SEASON.CURRENT);
  const prev = history.filter((h) => h.match_date >= SEASON.PREV && h.match_date < SEASON.CURRENT);
  const activeRows = curr.length ? curr : history;
  const prevGames = prev.flatMap((h) => (h.series ?? []).filter((g) => g > 0));
  const prevMatchAvgs = [...prev]
    .sort((a, b) => a.match_date.localeCompare(b.match_date))
    .map((h) => avgOf((h.series ?? []).filter((g) => g > 0)))
    .filter((v): v is number => v !== null);
  return { activeRows, prevRows: prev, hasCurrent: curr.length > 0, lastSeasonAvg: avgOf(prevGames), prevMatchAvgs };
}

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
  projectedAvg: number | null; // where the season is heading if form holds
  historyDesc: PlayerMatch[]; // newest first
};

const MIN_MATCHES_FOR_PROJECTION = 4;
const PROJECTION_CLAMP = 15; // never project further than this beyond seen results

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

// Projected average one match ahead — a least-squares trend line through the
// per-match averages, clamped so noisy data can't produce a wild number. Null
// until there's enough of a season to read a trend.
export function projectSeasonAvg(matchAvgs: number[], seasonAvg: number | null): number | null {
  if (matchAvgs.length < MIN_MATCHES_FOR_PROJECTION || seasonAvg == null) return null;
  const n = matchAvgs.length;
  const mx = (n - 1) / 2;
  const my = mean(matchAvgs);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - mx) * (matchAvgs[i] - my);
    den += (i - mx) ** 2;
  }
  const slope = den ? num / den : 0;
  const next = my - slope * mx + slope * n; // intercept + slope * n
  const lo = Math.min(...matchAvgs) - PROJECTION_CLAMP;
  const hi = Math.max(...matchAvgs) + PROJECTION_CLAMP;
  return round(Math.max(lo, Math.min(hi, next)));
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
    projectedAvg: projectSeasonAvg(matchAvgs.map(round), seasonAvg),
    historyDesc: [...sorted].reverse(),
  };
}

// ── Season-analysis engine (ported from web lib/profile + mockup helpers) ──────

// Longest and current run of games at or above threshold t.
export function streaks(games: number[], t: number): { current: number; best: number } {
  let best = 0;
  let run = 0;
  for (const g of games) {
    if (g >= t) { run++; best = Math.max(best, run); } else run = 0;
  }
  let current = 0;
  for (let i = games.length - 1; i >= 0; i--) { if (games[i] >= t) current++; else break; }
  return { current, best };
}

export function consistencyLabel(sd: number): string {
  return sd < 20 ? 'Konsekvent' : sd < 30 ? 'Stabil' : sd < 40 ? 'Varierad' : 'Explosiv';
}

// Average per game-position (S1..Sn) across matches, each slot over the matches
// that reached it (handles varying series lengths).
export function gamePositionAvgs(history: PlayerMatch[]): number[] {
  const series = history.map((h) => (h.series ?? []).filter((g) => g > 0)).filter((s) => s.length > 0);
  if (!series.length) return [];
  const n = Math.max(...series.map((s) => s.length));
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const vals = series.filter((s) => s.length > i).map((s) => s[i]);
    if (vals.length) out.push(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length));
  }
  return out;
}

export function rhythmLabel(avgs: number[]): { label: string; detail: string } {
  if (avgs.length < 2) return { label: '—', detail: '' };
  const first = avgs[0];
  const last = avgs[avgs.length - 1];
  const max = Math.max(...avgs);
  const diff = last - first;
  const spread = max - Math.min(...avgs);
  if (diff >= 12) return { label: 'Stark avslutare', detail: `+${diff}p från spel 1 till ${avgs.length}` };
  if (diff <= -12) return { label: 'Snabbstartare', detail: `tappar ${Math.abs(diff)}p mot slutet` };
  if (spread <= 8) return { label: 'Järnkonsekvent', detail: `bara ${spread}p skillnad spel 1–${avgs.length}` };
  if (avgs.indexOf(max) === 1) return { label: 'Snabbt inne', detail: 'peakar i spel 2, håller sedan nivån' };
  return { label: 'Varierad rytm', detail: `spridning ${spread}p spel 1–${avgs.length}` };
}

// One-line "what kind of bowler". Neutral — no gendered pronouns.
export function characterSentence(s: {
  hitRate: number; formDiff: number; consistency: string; seasonAvg: number; bestSeries: number;
}): string {
  const lead = s.hitRate >= 68 ? 'Dominant 200+-spjutspets'
    : s.hitRate >= 52 ? 'Pålitlig 200+-spjutspets'
    : s.hitRate >= 38 ? 'Allround bowlare'
    : 'Offensiv risktagare';
  const mod = s.formDiff >= 20 ? `i tydlig uppgång (+${s.formDiff} i form)`
    : s.formDiff <= -15 ? `som söker formen — bästa serie ${s.bestSeries} visar kapaciteten`
    : s.hitRate >= 60 ? `med ${s.consistency.toLowerCase()} spel och ${s.hitRate}% träffrate`
    : `med ${s.consistency.toLowerCase()} prestationer kring ${s.seasonAvg}`;
  return `${lead} ${mod}.`;
}

// Four-sentence season narrative. Uses the player's name (never she/he).
export function narrativeParagraph(s: {
  firstName: string; seasonAvg: number; lastSeasonAvg: number; formDiff: number;
  hitRate: number; consistency: string; rhythmLabel: string; bestSeries: number;
  games200Plus: number; totalGames: number;
}): string[] {
  const diff = s.seasonAvg - s.lastSeasonAvg;
  const name = s.firstName;
  return [
    diff >= 8 ? `${name} har haft sin bästa säsong hittills — ett snitt på ${s.seasonAvg} är ${diff}p bättre än förra säsongens ${s.lastSeasonAvg}.`
      : diff >= 3 ? `${name} fortsätter att förbättra sig med ett snitt på ${s.seasonAvg}, upp ${diff}p från förra säsongens ${s.lastSeasonAvg}.`
        : diff >= -3 ? `${name} levererar en stabil säsong med ett snitt på ${s.seasonAvg} — i linje med förra säsongens ${s.lastSeasonAvg}.`
          : `${name} snittar ${s.seasonAvg} denna säsong, något under förra årets ${s.lastSeasonAvg}, men med tydlig uppgång de senaste matcherna.`,
    s.formDiff >= 20 ? `Formen pekar tydligt uppåt — snittet de senaste matcherna ligger ${s.formDiff}p över säsongssnittet.`
      : s.formDiff >= 10 ? `Kurvan pekar uppåt med ett formsnitt ${s.formDiff}p över säsongssnittet — god timing inför slutspurten.`
        : s.formDiff <= -15 ? `Formen är inte på topp just nu, men grunden är stark med ${s.hitRate}% träffrate på 200-strecket.`
          : `Med ${s.hitRate}% träffrate och ${s.games200Plus} av ${s.totalGames} spel över 200 är grundstabiliteten hög.`,
    `Som ${s.rhythmLabel.toLowerCase()} tar ${name} regelbundet ett kliv mot slutet — ${s.consistency.toLowerCase()} prestationer gör spelaren svår att räkna bort.`,
    `Säsongens höjdpunkt är en serie på ${s.bestSeries} — ett bevis på att toppresultaten finns när det verkligen gäller.`,
  ];
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

export type Challenge = { id: string; icon: string; title: string; desc: string; cur: string; progress: number; done: boolean };

// In-progress challenges DERIVED from the player's own stats (no backend) — like
// achievements but with live progress toward the next milestone. Not-done first,
// nearest first.
export function playerChallenges(s: PlayerStats, opts: { prevAvg?: number | null; streak200Best?: number } = {}): Challenge[] {
  const band = (v: number, floor: number, target: number) =>
    Math.max(0, Math.min(100, Math.round(((v - floor) / (target - floor)) * 100)));
  const out: Challenge[] = [];

  if (s.seasonAvg != null) {
    const done = s.seasonAvg >= 200;
    out.push({ id: 'avg200', icon: 'trending-up', title: '200-snittet', done,
      desc: done ? 'I mål — 200+ i snitt' : `${200 - s.seasonAvg} pin kvar till 200`,
      cur: `${s.seasonAvg} / 200`, progress: done ? 100 : band(s.seasonAvg, 150, 200) });
  }
  if (opts.streak200Best != null) {
    const b = opts.streak200Best;
    const done = b >= 5;
    out.push({ id: 'streak200', icon: 'flame', title: 'Hetsviten', done,
      desc: '5 spel i rad över 200', cur: `${Math.min(b, 5)} / 5`, progress: done ? 100 : Math.round((b / 5) * 100) });
  }
  if (s.bestGame != null) {
    const done = s.bestGame >= 250;
    out.push({ id: 'g250', icon: 'star', title: '250-spel', done,
      desc: done ? `Bästa spel ${s.bestGame}` : 'Slå 250 i ett spel',
      cur: `${s.bestGame} / 250`, progress: done ? 100 : band(s.bestGame, 180, 250) });
  }
  {
    const done = s.games200 >= 10;
    out.push({ id: 'vol200', icon: 'trophy', title: '200+-klubben', done,
      desc: '10 spel över 200 i säsongen', cur: `${Math.min(s.games200, 10)} / 10`, progress: done ? 100 : Math.round((s.games200 / 10) * 100) });
  }
  if (opts.prevAvg != null && s.seasonAvg != null) {
    const done = s.seasonAvg > opts.prevAvg;
    out.push({ id: 'beatLast', icon: 'ribbon', title: 'Bättre än förra', done,
      desc: `Höj snittet från ${opts.prevAvg}`, cur: `${s.seasonAvg} / ${opts.prevAvg + 1}`,
      progress: done ? 100 : band(s.seasonAvg, Math.max(0, opts.prevAvg - 20), opts.prevAvg + 1) });
  }

  return out.sort((a, b) => Number(a.done) - Number(b.done) || b.progress - a.progress);
}
