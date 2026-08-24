import { NextResponse }         from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import {
  syncBitsDivisions,
  syncBitsClubs,
  syncBitsTeamsForAllClubs,
  syncBitsMatchesForSeason,
  syncBitsMatchesForDivision,
  syncBitsMatchScores,
  syncPendingMatchScores,
  syncBitsMatchResultsExact,
  syncPendingExactResults,
  syncBitsPlayers,
  resolveBitsPlayerLicNbrs,
  resolveBitsPlayerLicNbrsByClub,
  fixBitsHomeTeamAssignment,
  syncBitsPlayerAgreements,
  resolveBitsPlayerLicNbrsByAgreement,
} from '@/lib/bits-sync'
import {
  syncBitsCompetitions,
  syncBitsCompetitionResults,
  syncPendingCompetitionResults,
} from '@/lib/bits-competitions-sync'

async function requireAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  // Only the app owner (tobias.bergmark@gmail.com) should trigger syncs
  return user?.email === 'tobias.bergmark@gmail.com'
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    action:         string
    seasonId?:      number
    divisionId?:    number
    matchId?:       number
    competitionId?: number
    limit?:         number
  }
  const { action, seasonId = 2025, divisionId, matchId, competitionId, limit = 50 } = body

  try {
    switch (action) {
      case 'divisions':
        return NextResponse.json(await syncBitsDivisions(seasonId))

      case 'clubs':
        return NextResponse.json(await syncBitsClubs(seasonId))

      case 'teams':
        return NextResponse.json(await syncBitsTeamsForAllClubs(seasonId))

      case 'matches_season':
        return NextResponse.json(await syncBitsMatchesForSeason(seasonId))

      case 'matches_division': {
        if (!divisionId) return NextResponse.json({ error: 'divisionId required' }, { status: 400 })
        return NextResponse.json(await syncBitsMatchesForDivision(divisionId, seasonId))
      }

      case 'scores_match': {
        if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })
        return NextResponse.json(await syncBitsMatchScores(matchId))
      }

      case 'scores_pending':
        return NextResponse.json(await syncPendingMatchScores(limit))

      case 'exact_results_match': {
        if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })
        return NextResponse.json(await syncBitsMatchResultsExact(matchId))
      }

      case 'exact_results_pending':
        return NextResponse.json(await syncPendingExactResults(limit))

      case 'players':
        return NextResponse.json(await syncBitsPlayers())

      case 'resolve_players':
        return NextResponse.json(await resolveBitsPlayerLicNbrs())

      case 'resolve_players_by_club':
        return NextResponse.json(await resolveBitsPlayerLicNbrsByClub())

      case 'fix_home_team':
        return NextResponse.json(await fixBitsHomeTeamAssignment())

      case 'player_agreements':
        return NextResponse.json(await syncBitsPlayerAgreements(limit))

      case 'resolve_players_by_agreement':
        return NextResponse.json(await resolveBitsPlayerLicNbrsByAgreement())

      case 'competitions':
        return NextResponse.json(await syncBitsCompetitions(seasonId))

      case 'competition_results': {
        if (!competitionId) return NextResponse.json({ error: 'competitionId required' }, { status: 400 })
        return NextResponse.json(await syncBitsCompetitionResults(competitionId))
      }

      case 'competition_results_pending':
        return NextResponse.json(await syncPendingCompetitionResults(limit))

      default:
        return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
