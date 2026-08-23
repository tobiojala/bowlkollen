// Pure standings computation — shared by web and mobile. Moved out of the web
// app's division-standings.ts (which now re-exports from here) so both platforms
// compute a league table identically. No DB access; fully testable.

/** Wall-clock kickoff "HH:mm" from a naive match_datetime string
 * ("YYYY-MM-DDTHH:mm:ss"), or null when the source carried only a date
 * (midnight) or nothing. Shared by web + native so times read identically. */
export function matchKickoff(datetime: string | null | undefined): string | null {
  if (!datetime || datetime.length < 16) return null;
  const hhmm = datetime.slice(11, 16);
  return hhmm && hhmm !== '00:00' ? hhmm : null;
}

export type MatchRow = {
  bits_match_id: number;
  home_bits_team_id: number;
  away_bits_team_id: number;
  home_team_name: string;
  away_team_name: string;
  home_result: number | null;
  away_result: number | null;
  is_finished: boolean | null;
  match_date: string;
  match_datetime?: string | null;
  round_id: number | null;
  hall_name: string | null;
};

export type TeamStanding = {
  teamId: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  boardWins: number;
  boardLosses: number;
  points: number;
};

export function computeStandings(matches: MatchRow[]): TeamStanding[] {
  const map = new Map<number, TeamStanding>();

  function getOrCreate(id: number, name: string): TeamStanding {
    if (!map.has(id)) {
      map.set(id, {
        teamId: id,
        teamName: name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        boardWins: 0,
        boardLosses: 0,
        points: 0,
      });
    }
    return map.get(id)!;
  }

  for (const m of matches) {
    if (!m.is_finished || m.home_result == null || m.away_result == null) continue;

    const home = getOrCreate(m.home_bits_team_id, m.home_team_name);
    const away = getOrCreate(m.away_bits_team_id, m.away_team_name);

    home.played++;
    away.played++;
    home.boardWins += m.home_result;
    home.boardLosses += m.away_result;
    away.boardWins += m.away_result;
    away.boardLosses += m.home_result;

    if (m.home_result > m.away_result) {
      home.won++;
      home.points += 2;
      away.lost++;
    } else if (m.home_result === m.away_result) {
      home.drawn++;
      home.points += 1;
      away.drawn++;
      away.points += 1;
    } else {
      away.won++;
      away.points += 2;
      home.lost++;
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const netB = b.boardWins - b.boardLosses;
    const netA = a.boardWins - a.boardLosses;
    if (netB !== netA) return netB - netA;
    return b.boardWins - a.boardWins;
  });
}

/** The `radius` teams above and below `teamId` (inclusive), clamped to stay
 * in-bounds rather than shrinking near the top or bottom of the table. */
export function standingsNeighbors(
  standings: TeamStanding[],
  teamId: number,
  radius = 2,
): TeamStanding[] {
  const idx = standings.findIndex((s) => s.teamId === teamId);
  if (idx === -1) return [];
  const windowSize = radius * 2 + 1;
  const start = Math.max(0, Math.min(idx - radius, standings.length - windowSize));
  return standings.slice(start, start + windowSize);
}

/** Drops the redundant team-designation suffixes BITS appends (A / H A / DA / F)
 * so "IK Sisu H A" reads as "IK Sisu". Mirrors web utils.shortName. */
export function shortName(n: string): string {
  return (n || '')
    .replace(/ A$/, '')
    .replace(/ H A$/, '')
    .replace(/ DA$/, '')
    .replace(/ F$/, '')
    .trim();
}
