import { NARRATIVE } from '@/lib/constants'
import type { TableRow, TeamNarrative, NarrativeArchetype, FormResult } from '@/lib/types'

type NarrativeInput = {
  teamId:        string
  table:         TableRow[]           // full division standings
  totalMatches:  number               // total matches in the season
  playedMatches: number               // matches this team has played
  form:          FormResult[]         // last 5, most recent first
  upcomingOpponentId?: string | null
  lastOpponentId?:     string | null  // opponent in most recent completed match
  lastMatchResult?:    'W' | 'D' | 'L' | null
}

export function computeTeamNarrative(input: NarrativeInput): TeamNarrative {
  const { teamId, table, totalMatches, playedMatches, form } = input
  const remaining  = totalMatches - playedMatches
  const row        = table.find(r => r.teamId === teamId)

  if (!row) return midseason()

  const rank       = row.rank
  const totalTeams = table.length
  const bottomTwo  = rank >= totalTeams - 1  // last two positions

  // Win streak and unbeaten run from form (most recent first)
  let winStreak    = 0
  let unbeatenRun  = 0
  for (const r of form) {
    if (r === 'W') winStreak++
    else break
  }
  for (const r of form) {
    if (r !== 'L') unbeatenRun++
    else break
  }

  // Comeback: recent wins after a loss run
  let recentWins = 0
  let hadLossRun = false
  for (const r of [...form].reverse()) {
    if (r === 'L') { if (recentWins >= NARRATIVE.COMEBACK_WIN_STREAK) { hadLossRun = true; break } recentWins = 0 }
    else recentWins++
  }
  const isComeback = hadLossRun && recentWins >= NARRATIVE.COMEBACK_WIN_STREAK

  // Promotion chase — top 2, endgame
  if (rank <= 2 && remaining <= NARRATIVE.ENDGAME_MATCHES_REMAINING) {
    const leader   = table[0]
    const pointGap = rank === 1 ? 0 : row.points - (table.find(r => r.rank === 1)?.points ?? row.points)
    if (rank === 1) {
      return {
        archetype: 'promotion_chase',
        headline:  `Leder serien — ${remaining} matcher kvar`,
        subtext:   `${row.points} poäng, ${Math.abs(pointGap)} poäng före tvåan`,
      }
    }
    return {
      archetype: 'promotion_chase',
      headline:  `${Math.abs(pointGap)} poäng från seriesegern — ${remaining} matcher kvar`,
      subtext:   `Plats ${rank} av ${totalTeams}`,
    }
  }

  // Playoff push — within gap of top 2, matches left
  if (rank > 2 && rank <= 4 && remaining >= NARRATIVE.PLAYOFF_PUSH_MIN_REMAINING) {
    const top2Points = table.find(r => r.rank === 2)?.points ?? 0
    const gap        = top2Points - row.points
    if (gap <= NARRATIVE.PLAYOFF_PUSH_GAP) {
      return {
        archetype: 'playoff_push',
        headline:  `${gap} poäng från topp-2 — ${remaining} matcher kvar`,
        subtext:   `Plats ${rank}, fortfarande i kampen`,
      }
    }
  }

  // Relegation battle — bottom, endgame
  if (bottomTwo && remaining <= NARRATIVE.ENDGAME_MATCHES_REMAINING) {
    const safeRow  = table.find(r => r.rank === totalTeams - 2)
    const safeGap  = safeRow ? safeRow.points - row.points : 0
    return {
      archetype: 'relegation_battle',
      headline:  `Måste vinna för att hålla sig kvar`,
      subtext:   `${Math.abs(safeGap)} poäng från säker mark — ${remaining} matcher kvar`,
    }
  }

  // Survival confirmed — just moved out of relegation
  if (!bottomTwo && rank === totalTeams - 2 && form[0] === 'W') {
    return {
      archetype: 'survival_confirmed',
      headline:  `Klättrade ur nedstigningsplats`,
      subtext:   `Plats ${rank} av ${totalTeams}`,
    }
  }

  // Comeback run
  if (isComeback) {
    return {
      archetype: 'comeback_run',
      headline:  `${recentWins} raka vinster efter svackan`,
      subtext:   `Laget är på väg uppåt igen`,
    }
  }

  // Dominant form
  if (winStreak >= NARRATIVE.DOMINANT_FORM_STREAK) {
    return {
      archetype: 'dominant_form',
      headline:  `Bästa formen sedan säsongsstart — ${winStreak} raka`,
      subtext:   `Plats ${rank} av ${totalTeams}`,
    }
  }
  if (unbeatenRun >= NARRATIVE.DOMINANT_FORM_STREAK + 1) {
    return {
      archetype: 'dominant_form',
      headline:  `${unbeatenRun} matcher utan förlust`,
      subtext:   `Plats ${rank} av ${totalTeams}`,
    }
  }

  // Rivalry / revenge — requires upcoming or last opponent context
  if (input.upcomingOpponentId && input.lastOpponentId === input.upcomingOpponentId && input.lastMatchResult === 'L') {
    const oppRow = table.find(r => r.teamId === input.upcomingOpponentId)
    return {
      archetype: 'revenge_opportunity',
      headline:  `Revanschtillfälle mot ${oppRow?.teamName ?? 'motståndaren'}`,
      subtext:   `Förlorade senast mot dem`,
    }
  }

  return midseason()
}

function midseason(): TeamNarrative {
  return {
    archetype: 'midseason' as NarrativeArchetype,
    headline:  '',
    subtext:   '',
  }
}
