'use client'

import { use, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import {
  useSession, useTeamClaim, useBitsMatch, useTeamRoster, useTeamAvailability,
  useTeamLineup, useSaveTeamLineup, type LineupSlot,
} from '@/lib/queries'
import { isLineupComplete, sortRosterForPicker } from '@/lib/lineup'
import { useLineupCandidates } from '@/lib/lineup-aids'
import { useLineupEligibility, makeVerdict, isFinalRoundsOf, lineupEligibilityIssues } from '@/lib/eligibility'
import { shortName } from '@/lib/utils'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { LineupBoardGrid } from './_components/LineupBoardGrid'
import { EligibilityBanner } from './_components/EligibilityBanner'
import { KonstellationPanel } from './_components/KonstellationPanel'
import { PlayerPickerSheet } from './_components/PlayerPickerSheet'

type Props = { params: Promise<{ id: string; matchid: string }> }
type ActiveSlot = { bord: number; pos: number; isReserve: boolean }

// Lineup builder for a BITS team's match — works for every team, unlike the
// legacy /team/[id]/laguttagning pages this replaces. Captain edits; a
// published lineup is public (visible on /lag too), a draft is visible only
// to verified teammates — both enforced server-side by get_team_lineup, so
// this page never needs to redirect a non-member away, it just renders
// whatever the RPC allows through.
export default function LaguttagningPage({ params }: Props) {
  const { id, matchid } = use(params)
  const teamId  = Number(id)
  const matchId = Number(matchid)

  const { data: session }   = useSession()
  const { data: claim }     = useTeamClaim(teamId)
  const { data: match, isLoading: matchLoading } = useBitsMatch(matchId)
  const { data: roster = [] }    = useTeamRoster(teamId)
  const { data: responses = [] } = useTeamAvailability(teamId, matchId)
  const { data: candidates = [] } = useLineupCandidates(teamId, matchId)
  const { data: lineup, isLoading: lineupLoading } = useTeamLineup(teamId, matchId)
  const { data: eligibilitySig } = useLineupEligibility(teamId, matchId)
  const { mutate: save, isPending: saving, error: saveError } = useSaveTeamLineup(teamId, matchId)

  const isCaptain = !!session && claim?.status === 'verified' && claim.role === 'captain'

  const [slots, setSlots]           = useState<LineupSlot[]>([])
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null)
  const loadedRef = useRef(false)

  // Load the existing lineup into editable state once — later background
  // refetches shouldn't stomp on in-progress edits.
  useEffect(() => {
    if (lineup && !loadedRef.current) {
      setSlots(lineup.slots)
      loadedRef.current = true
    }
  }, [lineup])

  if (matchLoading || lineupLoading || !match) {
    return (
      <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink2, fontFamily: FONT.body, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Laddar…
      </main>
    )
  }

  const isHome = match.home_bits_team_id === teamId
  const opp    = isHome ? match.away_team_name : match.home_team_name

  const availabilityByPublicId: Record<string, string | undefined> = {}
  responses.forEach(r => { if (r.publicId) availabilityByPublicId[r.publicId] = r.response })

  const candByPublicId = Object.fromEntries(candidates.map(c => [c.publicId, c]))

  const sortedRoster = sortRosterForPicker(roster, availabilityByPublicId)
  const usedPublicIds = slots.map(s => s.publicId)
  const complete = isLineupComplete(slots)

  // § D 306 farm-team eligibility (shared engine in @bowlkollen/core). Only the
  // seated starters (not reserves) count toward the lineup-level spärr check.
  const verdictFor = makeVerdict(eligibilitySig)
  const displaySlots = isCaptain ? slots : (lineup?.slots ?? [])
  const eligibilityIssues = lineupEligibilityIssues(
    displaySlots.filter(s => !s.isReserve).map(s => verdictFor(s.publicId).state),
    isFinalRoundsOf(eligibilitySig),
  )

  const onSlotClick = (bord: number, pos: number, isReserve: boolean) => {
    const existing = slots.find(s => s.bord === bord && s.pos === pos && s.isReserve === isReserve)
    if (existing) {
      setSlots(prev => prev.filter(s => !(s.bord === bord && s.pos === pos && s.isReserve === isReserve)))
    } else {
      setActiveSlot({ bord, pos, isReserve })
    }
  }

  const onPick = (publicId: string, playerName: string) => {
    if (!activeSlot) return
    setSlots(prev => [
      ...prev.filter(s => !(s.bord === activeSlot.bord && s.pos === activeSlot.pos && s.isReserve === activeSlot.isReserve)),
      { publicId, playerName, ...activeSlot },
    ])
    setActiveSlot(null)
  }

  const publishLabel = !complete
    ? 'Fyll i alla 8 platser för att publicera'
    : lineup?.status === 'published' ? 'Uppdatera publicerad laguppställning' : 'Laguppställning klar — publicera'

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: `${SPACE[6]}px ${SPACE[4]}px 96px` }}>
        <Link href={`/lag/${teamId}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 2,
          fontSize: 14, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4],
        }}>
          <ChevronLeft size={15} /> Lagets sida
        </Link>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACE[3] }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: 4 }}>
              LAGUTTAGNING
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: COLOR.ink, margin: 0 }}>vs {shortName(opp)}</h1>
          </div>
          {lineup?.status === 'published' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: COLOR.green, background: 'rgba(48,212,126,0.12)', borderRadius: RADIUS.md, padding: '4px 10px', flexShrink: 0 }}>
              Publicerad
            </span>
          )}
        </div>
        <div style={{ fontSize: TYPE.body, color: COLOR.ink2, marginTop: 4, marginBottom: SPACE[6] }}>
          {new Date(match.match_date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}{isHome ? 'Hemma' : 'Borta'}
        </div>

        {!isCaptain && !lineup && (
          <div style={{ textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.body, padding: `${SPACE[8]}px 0` }}>
            Ingen laguppställning ännu.
          </div>
        )}

        {(isCaptain || lineup) && (
          <>
            <LineupBoardGrid slots={displaySlots} editable={isCaptain} onSlotClick={onSlotClick} verdictFor={verdictFor} />
            <EligibilityBanner issues={eligibilityIssues} />
          </>
        )}

        {isCaptain && candidates.length >= 2 && (
          <div style={{ marginTop: SPACE[6] }}>
            <KonstellationPanel candidates={candidates.map(c => ({ publicId: c.publicId, name: c.name }))} />
          </div>
        )}

        {isCaptain && (
          <div style={{ marginTop: SPACE[6] }}>
            {saveError && (
              <div style={{ fontSize: TYPE.caption, color: COLOR.red, marginBottom: SPACE[3] }}>
                Något gick fel — försök igen.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: SPACE[2] }}>
              <button
                onClick={() => save({ slots, publish: false })}
                disabled={saving}
                style={{ padding: SPACE[3], borderRadius: RADIUS.lg, border: `1px solid ${COLOR.hairline}`, background: 'transparent', color: COLOR.ink2, fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}
              >
                Spara utkast
              </button>
              <button
                onClick={() => save({ slots, publish: true })}
                disabled={saving || !complete}
                style={{
                  padding: SPACE[3], borderRadius: RADIUS.lg, border: 'none',
                  background: complete ? COLOR.gold : COLOR.surface2, color: complete ? '#1a1400' : COLOR.ink3,
                  fontSize: 13, fontWeight: 800, cursor: saving || !complete ? 'default' : 'pointer',
                }}
              >
                {saving ? 'Sparar…' : publishLabel}
              </button>
            </div>
          </div>
        )}
      </div>

      <PlayerPickerSheet
        open={activeSlot !== null}
        onClose={() => setActiveSlot(null)}
        roster={sortedRoster}
        usedPublicIds={usedPublicIds}
        availabilityByPublicId={availabilityByPublicId}
        candidates={candByPublicId}
        matchDivision={match.division_name}
        onPick={onPick}
      />
    </main>
  )
}
