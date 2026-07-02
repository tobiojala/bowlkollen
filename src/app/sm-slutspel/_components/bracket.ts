// ── Types ────────────────────────────────────────────────────────────────────

export type SeasonMatch = {
  bits_match_id: number
  home_team_name: string
  away_team_name: string
  home_score:     number | null
  away_score:     number | null
  is_finished:    boolean | null
  round_id:       number | null
  match_date:     string
}

export type TeamStanding = {
  pos:          number
  team:         string
  played:       number
  won:          number
  drawn:        number
  lost:         number
  points:       number
  pinsFor:      number
  pinsAgainst:  number
}

export type BracketEntry = {
  team:     string | null
  seed:     number | null
  isWinner: boolean
}

/** One game within a best-of-3 series — scores are banp (boards won per day). */
export type SeriesGame = {
  home:   number | null
  away:   number | null
  note?:  string          // "Match 1", "Match 2", etc.
}

export type BracketMatch = {
  id:            string
  round:         'sf' | 'final' | 'third'
  label:         string
  home:          BracketEntry
  away:          BracketEntry
  games?:        SeriesGame[]   // individual match scores in the series
  seriesResult?: string         // e.g. "2–1 i matcher"
  date?:         string
}

export type SmBracket = {
  division:  'Herrar' | 'Damer'
  year:      number
  venue:     string
  dates:     string
  champion:  string | null
  /** Short narrative shown under the champion name — curated per year. */
  story?:    string
  matches:   BracketMatch[]
}

// ── Standings ─────────────────────────────────────────────────────────────────

/**
 * Computes standings from bits_matches. Note: home_score/away_score are
 * total pins across all boards, not banp. Winner is approximated by higher
 * total pins — good enough for showing qualifiers; official table uses banp.
 */
export function computeStandings(matches: SeasonMatch[]): TeamStanding[] {
  const map = new Map<string, Omit<TeamStanding, 'pos'>>()

  const row = (name: string) => {
    if (!map.has(name))
      map.set(name, { team: name, played: 0, won: 0, drawn: 0, lost: 0, points: 0, pinsFor: 0, pinsAgainst: 0 })
    return map.get(name)!
  }

  for (const m of matches) {
    if (!m.is_finished || m.home_score === null || m.away_score === null) continue
    const h = row(m.home_team_name)
    const a = row(m.away_team_name)
    h.played++; a.played++
    h.pinsFor += m.home_score; h.pinsAgainst += m.away_score
    a.pinsFor += m.away_score; a.pinsAgainst += m.home_score
    if (m.home_score > m.away_score)      { h.won++; h.points += 2; a.lost++ }
    else if (m.away_score > m.home_score) { a.won++; a.points += 2; h.lost++ }
    else                                   { h.drawn++; h.points++; a.drawn++; a.points++ }
  }

  return [...map.values()]
    .sort((a, b) =>
      b.points !== a.points
        ? b.points - a.points
        : (b.pinsFor - b.pinsAgainst) - (a.pinsFor - a.pinsAgainst)
    )
    .map((t, i) => ({ ...t, pos: i + 1 }))
}

// ── 2026 real data (source: swebowl.se, via.tt.se) ───────────────────────────
//
// Venue: Superbowl, Nyköping — 15–17 maj 2026
// Format: best-of-3 match series (home+away per match day)
// Banp scores = boards won out of ~20 total per day's play
//
// Update `buildBrackets` below to point to a new year's config
// when the 2026/27 SM-slutspel data is available.

const HERRAR_2026: SmBracket = {
  division: 'Herrar',
  year:     2026,
  venue:    'Superbowl, Nyköping',
  dates:    '15–17 maj 2026',
  champion: 'Team Pergamon BC',
  story:    'Det 17:e SM-guldet. Pergamon kom tillbaka från 1–0 i matcher och vann det avgörande mötet. Den mest titulerade klubben i Elitserien cementerar sin plats i historien.',
  matches: [
    {
      id: 'sf1-herrar', round: 'sf', label: 'Semifinal 1',
      date: '15–16 maj',
      home: { team: 'Team Pergamon BC',   seed: 1, isWinner: true  },
      away: { team: 'BK Full House',       seed: 4, isWinner: false },
    },
    {
      id: 'sf2-herrar', round: 'sf', label: 'Semifinal 2',
      date: '15–16 maj',
      home: { team: 'Team Alingsås BC',    seed: 2, isWinner: true  },
      away: { team: 'Team Clan Nässjö BK', seed: 3, isWinner: false },
    },
    {
      id: 'final-herrar', round: 'final', label: 'Final',
      date: '17 maj',
      seriesResult: '2–1 i matcher',
      games: [
        { home:  9, away: 11, note: 'Match 1' },   // Alingsås 11–9 Pergamon
        { home: 13, away:  7, note: 'Match 2' },   // Pergamon 13–7 Alingsås
        { home: null, away: null, note: 'Match 3' }, // Pergamon won, score TBD
      ],
      // home = Pergamon (#1 seed), away = Alingsås (#2 seed)
      home: { team: 'Team Pergamon BC',  seed: 1, isWinner: true  },
      away: { team: 'Team Alingsås BC',  seed: 2, isWinner: false },
    },
  ],
}

const DAMER_2026: SmBracket = {
  division: 'Damer',
  year:     2026,
  venue:    'Superbowl, Nyköping',
  dates:    '15–17 maj 2026',
  champion: 'Team X-Calibur BK',
  story:    'Revansch. X-Calibur tog sitt första SM-guld sedan 2018 och bröt Spader Dams dominans. Från 0–0 i finalen till seger i tre matcher — inget gavs.',
  matches: [
    {
      id: 'sf1-damer', round: 'sf', label: 'Semifinal 1',
      date: '15–16 maj',
      home: { team: 'Spader Dam',       seed: 1, isWinner: true  },
      away: { team: 'AIK BK D',         seed: 4, isWinner: false },
    },
    {
      id: 'sf2-damer', round: 'sf', label: 'Semifinal 2',
      date: '15–16 maj',
      home: { team: 'Team X-Calibur BK', seed: 2, isWinner: true  },
      away: { team: 'BK Merci',          seed: 3, isWinner: false },
    },
    {
      id: 'final-damer', round: 'final', label: 'Final',
      date: '17 maj',
      seriesResult: '2–0 (1 oavgjord)',
      games: [
        { home: 10, away: 10, note: 'Match 1' },  // Spader Dam 10–10 X-Calibur (oavgjort)
        { home:  8, away: 11, note: 'Match 2' },  // X-Calibur 11–8 Spader Dam
        { home:  8, away: 11, note: 'Match 3' },  // X-Calibur 11–8 Spader Dam
      ],
      // home = Spader Dam (#1 seed), away = X-Calibur (#2 seed)
      home: { team: 'Spader Dam',        seed: 1, isWinner: false },
      away: { team: 'Team X-Calibur BK', seed: 2, isWinner: true  },
    },
  ],
}

export function buildBrackets(): { herrar: SmBracket; damer: SmBracket } {
  return { herrar: HERRAR_2026, damer: DAMER_2026 }
}
