'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useSession, useTeamClaim, useTeamAvailability, useBitsMatch } from '@/lib/queries'
import { shortName } from '@/lib/utils'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { AvailabilityCard } from './_components/AvailabilityCard'
import { AvailabilitySummary } from './_components/AvailabilitySummary'

type Props = { params: Promise<{ id: string; matchid: string }> }

// Availability responder for a BITS team's match — works for every team,
// unlike the legacy /team/[id]/tillganglighet pages this replaces. Fully
// client-rendered (session-gated, personalized), same shape as the legacy
// page: check session + verified membership on mount, redirect otherwise.
export default function TillganglighetPage({ params }: Props) {
  const { id, matchid } = use(params)
  const teamId  = Number(id)
  const matchId = Number(matchid)
  const router  = useRouter()

  const { data: session, isLoading: sessionLoading } = useSession()
  const { data: claim, isLoading: claimLoading }         = useTeamClaim(teamId)
  const { data: match, isLoading: matchLoading }         = useBitsMatch(matchId)
  const { data: responses = [], isLoading: respLoading } = useTeamAvailability(teamId, matchId)

  useEffect(() => {
    if (sessionLoading) return
    if (!session) { router.replace('/login'); return }
    if (!claimLoading && claim?.status !== 'verified') { router.replace(`/lag/${teamId}`) }
  }, [session, sessionLoading, claim, claimLoading, teamId, router])

  const ready = !sessionLoading && !claimLoading && !matchLoading && !respLoading
  if (!ready || !session || claim?.status !== 'verified' || !match) {
    return (
      <main style={{
        minHeight: '100vh', background: COLOR.bg, color: COLOR.ink2, fontFamily: FONT.body,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        Laddar…
      </main>
    )
  }

  const isHome = match.home_bits_team_id === teamId
  const opp    = isHome ? match.away_team_name : match.home_team_name
  const mine   = responses.find(r => r.userId === session.user.id) ?? null

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: `${SPACE[6]}px ${SPACE[4]}px 96px` }}>
        <Link href={`/lag/${teamId}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 2,
          fontSize: 14, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4],
        }}>
          <ChevronLeft size={15} /> Lagets sida
        </Link>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: 4 }}>
          TILLGÄNGLIGHET
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: COLOR.ink, margin: 0 }}>vs {shortName(opp)}</h1>
        <div style={{ fontSize: TYPE.body, color: COLOR.ink2, marginTop: 4 }}>
          {new Date(match.match_date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}{isHome ? 'Hemma' : 'Borta'}
        </div>

        <div style={{ marginTop: SPACE[6] }}>
          <AvailabilityCard bitsTeamId={teamId} bitsMatchId={matchId} mine={mine} />
        </div>

        <AvailabilitySummary responses={responses} />
      </div>
    </main>
  )
}
