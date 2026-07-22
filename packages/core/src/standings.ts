// Pure standings computation — shared by web and mobile. Moved out of the web
// app's division-standings.ts (which now re-exports from here) so both platforms
// compute a league table identically. No DB access; fully testable.

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
