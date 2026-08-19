import { useQuery } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { candidateEligibility, lineupEligibilityIssues, type EligibilityVerdict } from '@bowlkollen/core'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'

export { lineupEligibilityIssues, type EligibilityVerdict, type EligibilityState } from '@bowlkollen/core'

// get_lineup_eligibility isn't in the generated types (run lineup_eligibility.sql).
// Mirrors apps/mobile/lib/eligibility-data.ts — same RPC, same core engine, so
// web + native give an identical § D 306 verdict.
type EligibilitySignals = {
  targetIsFarm: boolean
  isFinalRounds: boolean
  hasHigherData: boolean
  higherIds: Set<string>
}

// Which candidates are nominated to a higher club team this round — feeds the engine.
export function useLineupEligibility(teamId: number, matchId: number) {
  return useQuery({
    queryKey: ['lineup-eligibility', teamId, matchId],
    enabled: teamId > 0 && matchId > 0,
    staleTime: STALE.MEDIUM,
    queryFn: async (): Promise<EligibilitySignals | null> => {
      const db = createClient() as unknown as SupabaseClient
      const { data, error } = await db.rpc('get_lineup_eligibility', { p_bits_team_id: teamId, p_bits_match_id: matchId })
      if (error) throw error
      const r = (data as Record<string, unknown>[] | null)?.[0]
      if (!r) return null
      return {
        targetIsFarm: (r.target_is_farm as boolean | null) ?? false,
        isFinalRounds: (r.is_final_rounds as boolean | null) ?? false,
        hasHigherData: (r.has_higher_data as boolean | null) ?? false,
        higherIds: new Set((r.higher_player_ids as string[] | null) ?? []),
      }
    },
  })
}

export function isFinalRoundsOf(sig: EligibilitySignals | null | undefined): boolean {
  return sig?.isFinalRounds ?? false
}

// verdict(publicId) → the § D 306 state for that candidate, via the pure core engine.
export function makeVerdict(sig: EligibilitySignals | null | undefined): (publicId: string) => EligibilityVerdict {
  return (publicId: string) =>
    candidateEligibility({
      targetIsFarmTeam: sig?.targetIsFarm ?? false,
      isFinalRounds: sig?.isFinalRounds ?? false,
      // known only when a higher club team has a published lineup / results for the round.
      playedHigherThisRound: !sig || !sig.targetIsFarm ? false : sig.hasHigherData ? sig.higherIds.has(publicId) : null,
      lockedByFinalRule: null, // second-to-last→last tracking is a later refinement
    })
}
