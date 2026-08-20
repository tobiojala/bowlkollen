// Deep team statistics — the team's answer to the player profile. Pure aggregation
// from BITS match + per-player-result rows, shared by web, native, compare, and
// share cards so the numbers are identical everywhere. No I/O. Unit-tested.
//
// BITS shape reminder: a match result (home_result/away_result) is BANPOÄNG (the
// competition points), while a player's `series` are their game scores (pins). Team
// pinfall = sum of the team side's game scores; team average = mean of those games.

export type Outcome = 'W' | 'L' | 'D';

export type TeamStatMatch = {
  bits_match_id: number;
  match_date: string;
  home_bits_team_id: number | null;
  away_bits_team_id: number | null;
  home_team_name: string;
  away_team_name: string;
  home_result: number | null;
  away_result: number | null;
  is_finished: boolean;
};

export type TeamStatResult = {
  bits_match_id: number;
  player_name: string;
  lic_nbr: string;
  series: number[] | null;
  is_home_team: boolean;
};

export type PlayerStatLine = {
  name: string;
  lic: string;
  matches: number;
  games: number;
  average: number;   // mean pins/game
  high: number;      // best single game
  pins: number;      // total pins
};

export type SplitStat = { average: number | null; wins: number; losses: number; draws: number; played: number };

export type TrendPoint = { matchId: number; date: string; average: number; teamTotal: number; outcome: Outcome | null; opponent: string };

export type TeamStats = {
  played: number;
  record: { wins: number; losses: number; draws: number };
  winPct: number;                 // 0–100, draws count as half
  banFor: number;
  banAgainst: number;
  form: Outcome[];                // most-recent first (up to 6)
  teamAverage: number | null;     // mean pins/game across every team game (per-bowler)
  totalPinfall: number;           // season cumulative team pins (the "wow" number)
  pinfallPerMatch: number | null; // avg TEAM total per match — the team-scale headline
  trend: TrendPoint[];            // chronological (oldest → newest)
  home: SplitStat;
  away: SplitStat;
  highGame: { name: string; pins: number; date: string } | null;
  highMatch: { total: number; date: string; opponent: string } | null;
  players: PlayerStatLine[];      // sorted by average desc, then games
};

const validGames = (series: number[] | null): number[] => (series ?? []).filter((g) => g > 0);
const mean = (xs: number[]): number => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

function outcomeOf(my: number | null, opp: number | null): Outcome | null {
  if (my == null || opp == null) return null;
  return my > opp ? 'W' : my < opp ? 'L' : 'D';
}

export function computeTeamStats(teamId: number, matches: TeamStatMatch[], results: TeamStatResult[]): TeamStats {
  const finished = matches
    .filter((m) => m.is_finished && (m.home_bits_team_id === teamId || m.away_bits_team_id === teamId))
    .sort((a, b) => a.match_date.localeCompare(b.match_date));

  const byMatch = new Map<number, TeamStatResult[]>();
  for (const r of results) {
    const arr = byMatch.get(r.bits_match_id) ?? [];
    arr.push(r);
    byMatch.set(r.bits_match_id, arr);
  }

  const record = { wins: 0, losses: 0, draws: 0 };
  let banFor = 0, banAgainst = 0;
  const allGames: number[] = [];
  let totalPinfall = 0;
  let matchesWithPins = 0;
  const trend: TrendPoint[] = [];
  const outcomes: (Outcome | null)[] = [];
  const home: SplitStat = { average: null, wins: 0, losses: 0, draws: 0, played: 0 };
  const away: SplitStat = { average: null, wins: 0, losses: 0, draws: 0, played: 0 };
  const homeGames: number[] = [], awayGames: number[] = [];
  let highGame: TeamStats['highGame'] = null;
  let highMatch: TeamStats['highMatch'] = null;

  // Per-player accumulation across matches.
  const players = new Map<string, { name: string; lic: string; matchIds: Set<number>; games: number[]; pins: number }>();

  for (const m of finished) {
    const isHome = m.home_bits_team_id === teamId;
    const my = isHome ? m.home_result : m.away_result;
    const opp = isHome ? m.away_result : m.home_result;
    const opponent = isHome ? m.away_team_name : m.home_team_name;
    const date = m.match_date.slice(0, 10);
    const out = outcomeOf(my, opp);

    if (my != null) banFor += my;
    if (opp != null) banAgainst += opp;
    if (out === 'W') record.wins++;
    else if (out === 'L') record.losses++;
    else if (out === 'D') record.draws++;

    const side = (byMatch.get(m.bits_match_id) ?? []).filter((r) => !!r.is_home_team === isHome);
    const matchGames: number[] = [];
    let matchPins = 0;
    for (const r of side) {
      const gs = validGames(r.series);
      matchGames.push(...gs);
      matchPins += gs.reduce((a, b) => a + b, 0);
      const p = players.get(r.player_name) ?? { name: r.player_name, lic: r.lic_nbr, matchIds: new Set<number>(), games: [], pins: 0 };
      p.matchIds.add(m.bits_match_id);
      p.games.push(...gs);
      p.pins += gs.reduce((a, b) => a + b, 0);
      players.set(r.player_name, p);
      const hi = Math.max(0, ...gs);
      if (hi > (highGame?.pins ?? 0)) highGame = { name: r.player_name, pins: hi, date };
    }

    allGames.push(...matchGames);
    const matchAvg = mean(matchGames);
    if (matchGames.length) {
      trend.push({ matchId: m.bits_match_id, date, average: matchAvg, teamTotal: matchPins, outcome: out, opponent });
      totalPinfall += matchPins;
      matchesWithPins++;
    }
    outcomes.push(out);
    if (matchPins > 0 && matchPins > (highMatch?.total ?? 0)) highMatch = { total: matchPins, date, opponent };

    const split = isHome ? home : away;
    split.played++;
    if (out === 'W') split.wins++; else if (out === 'L') split.losses++; else if (out === 'D') split.draws++;
    (isHome ? homeGames : awayGames).push(...matchGames);
  }

  home.average = homeGames.length ? mean(homeGames) : null;
  away.average = awayGames.length ? mean(awayGames) : null;

  const playerLines: PlayerStatLine[] = [...players.values()]
    .map((p) => ({
      name: p.name, lic: p.lic, matches: p.matchIds.size, games: p.games.length,
      average: mean(p.games), high: Math.max(0, ...p.games), pins: p.pins,
    }))
    .filter((p) => p.games > 0)
    .sort((a, b) => b.average - a.average || b.games - a.games);

  const decided = record.wins + record.losses + record.draws;
  const winPct = decided ? Math.round(((record.wins + record.draws * 0.5) / decided) * 100) : 0;

  return {
    played: finished.length,
    record,
    winPct,
    banFor,
    banAgainst,
    form: outcomes.filter((o): o is Outcome => o !== null).reverse().slice(0, 6),
    teamAverage: allGames.length ? mean(allGames) : null,
    totalPinfall,
    pinfallPerMatch: matchesWithPins ? Math.round(totalPinfall / matchesWithPins) : null,
    trend,
    home,
    away,
    highGame,
    highMatch,
    players: playerLines,
  };
}

// Two teams' stats side by side, for the compare view. Winner per row is decided
// by the caller (higher-is-better differs per metric); this just pairs the objects.
export function compareTeamStats(a: TeamStats, b: TeamStats) {
  return {
    a,
    b,
    diff: {
      teamAverage: (a.teamAverage ?? 0) - (b.teamAverage ?? 0),
      winPct: a.winPct - b.winPct,
      banFor: a.banFor - b.banFor,
    },
  };
}
