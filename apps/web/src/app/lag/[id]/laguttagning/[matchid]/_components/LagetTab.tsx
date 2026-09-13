'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Share2 } from 'lucide-react'
import {
  useTeamRoster, useTeamAvailability, useTeamLineup, useSaveTeamLineup,
  type LineupSlot,
} from '@/lib/queries'
import type { BitsMatchDetail } from '@/lib/types'
import { isLineupComplete, sortRosterForPicker, suggestLineup, seatPairIntoBoard, type SeatablePerson } from '@/lib/lineup'
import { useLineupCandidates, rankCandidates } from '@/lib/lineup-aids'
import { useLineupEligibility, makeVerdict, isFinalRoundsOf, lineupEligibilityIssues } from '@/lib/eligibility'
import { shortName } from '@/lib/utils'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { LineupBoardGrid } from './LineupBoardGrid'
import { EligibilityBanner } from './EligibilityBanner'
import { KonstellationPanel } from './KonstellationPanel'
import { PlayerPickerSheet } from './PlayerPickerSheet'

type ActiveSlot = { bord: number; pos: number; isReserve: boolean }
const STARTERS = 8

// The "Laget" tab — the lineup builder. Captain edits (suggest, seat konstellationer,
// pick, save/publish, share); teammates see the published/draft lineup read-only.
export function LagetTab({ teamId, matchId, match, isCaptain }: {
  teamId: number; matchId: number; match: BitsMatchDetail; isCaptain: boolean
}) {
  const router = useRouter()
  const { data: roster = [] }     = useTeamRoster(teamId)
  const { data: responses = [] }  = useTeamAvailability(teamId, matchId)
  const { data: candidates = [] } = useLineupCandidates(teamId, matchId)
  const { data: lineup }          = useTeamLineup(teamId, matchId)
  const { data: eligibilitySig }  = useLineupEligibility(teamId, matchId)
  const { mutate: save, isPending: saving, error: saveError } = useSaveTeamLineup(teamId, matchId)

  const [slots, setSlots]           = useState<LineupSlot[]>([])
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null)
  const loadedRef = useRef(false)
  useEffect(() => { if (lineup && !loadedRef.current) { setSlots(lineup.slots); loadedRef.current = true } }, [lineup])

  const isHome   = match.home_bits_team_id === teamId
  const teamName = isHome ? match.home_team_name : match.away_team_name

  const availabilityByPublicId: Record<string, string | undefined> = {}
  responses.forEach(r => { if (r.publicId) availabilityByPublicId[r.publicId] = r.response })
  const candByPublicId = Object.fromEntries(candidates.map(c => [c.publicId, c]))
  const sortedRoster = sortRosterForPicker(roster, availabilityByPublicId)

  const usedPublicIds = slots.map(s => s.publicId)
  const seatedIds     = new Set(usedPublicIds)
  const starterCount  = slots.filter(s => !s.isReserve).length
  const complete      = isLineupComplete(slots)

  const verdictFor = makeVerdict(eligibilitySig)
  const displaySlots = isCaptain ? slots : (lineup?.slots ?? [])
  const eligibilityIssues = lineupEligibilityIssues(
    displaySlots.filter(s => !s.isReserve).map(s => verdictFor(s.publicId).state),
    isFinalRoundsOf(eligibilitySig),
  )

  const onSlotClick = (bord: number, pos: number, isReserve: boolean) => {
    const existing = slots.find(s => s.bord === bord && s.pos === pos && s.isReserve === isReserve)
    if (existing) setSlots(prev => prev.filter(s => !(s.bord === bord && s.pos === pos && s.isReserve === isReserve)))
    else setActiveSlot({ bord, pos, isReserve })
  }
  const onPick = (publicId: string, playerName: string) => {
    if (!activeSlot) return
    setSlots(prev => [
      ...prev.filter(s => s.publicId !== publicId && !(s.bord === activeSlot.bord && s.pos === activeSlot.pos && s.isReserve === activeSlot.isReserve)),
      { publicId, playerName, ...activeSlot },
    ])
    setActiveSlot(null)
  }
  const onSuggest = () => {
    const pool: SeatablePerson[] = rankCandidates(candidates, teamName, match.division_name)
      .filter(c => c.availability !== 'no').map(c => ({ publicId: c.publicId, name: c.name }))
    setSlots(prev => suggestLineup(prev, pool))
  }
  const onSeatPair = (a: SeatablePerson, b: SeatablePerson) => setSlots(prev => seatPairIntoBoard(prev, a, b))

  const onShare = () => {
    const line = (b: number) => `Banpar ${b}: ${slots.find(s => !s.isReserve && s.bord === b && s.pos === 1)?.playerName ?? '—'} / ${slots.find(s => !s.isReserve && s.bord === b && s.pos === 2)?.playerName ?? '—'}`
    const reserves = slots.filter(s => s.isReserve).sort((a, b) => a.pos - b.pos)
    const body = [`Laguppställning – ${match.home_team_name} mot ${match.away_team_name}`, '', ...[1, 2, 3, 4].map(line)]
    if (reserves.length) body.push('', `Reserver: ${reserves.map(r => shortName(r.playerName)).join(', ')}`)
    const text = body.join('\n')
    if (typeof navigator !== 'undefined' && navigator.share) navigator.share({ text }).catch(() => {})
    else navigator.clipboard?.writeText(text).catch(() => {})
  }

  const publishLabel = !complete
    ? 'Fyll i alla 8 platser för att publicera'
    : lineup?.status === 'published' ? 'Uppdatera publicerad laguppställning' : 'Laguppställning klar — publicera'

  if (!isCaptain && !lineup) {
    return <p style={{ textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.body, padding: `${SPACE[8]}px 0` }}>Ingen laguppställning ännu.</p>
  }

  return (
    <div>
      {isCaptain && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[3] }}>
          <span style={{ fontSize: TYPE.body, fontWeight: 800, color: COLOR.ink }}>{starterCount}/{STARTERS} placerade</span>
          {lineup?.status === 'published' && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: COLOR.green }}>PUBLICERAD</span>}
        </div>
      )}

      {isCaptain && !complete && (
        <button onClick={onSuggest}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACE[2], width: '100%', marginBottom: SPACE[4], padding: `${SPACE[3]}px`, borderRadius: RADIUS.md, border: '1px solid rgba(245,194,0,0.35)', background: 'rgba(245,194,0,0.08)', color: COLOR.gold, fontSize: TYPE.body, fontWeight: 800, fontFamily: FONT.body, cursor: 'pointer' }}>
          <Sparkles size={18} /> {starterCount === 0 ? 'Föreslå laget' : 'Fyll tomma platser'}
        </button>
      )}

      {isCaptain && candidates.length >= 2 && (
        <KonstellationPanel
          candidates={candidates.map(c => ({ publicId: c.publicId, name: c.name }))}
          seatedIds={seatedIds} onSeatPair={onSeatPair}
          onOpenPlayer={pid => router.push(`/players/${pid}`)}
        />
      )}

      <LineupBoardGrid slots={displaySlots} editable={isCaptain} onSlotClick={onSlotClick} verdictFor={verdictFor} />
      <EligibilityBanner issues={eligibilityIssues} />

      {isCaptain && (
        <div style={{ marginTop: SPACE[6] }}>
          {saveError && <div style={{ fontSize: TYPE.caption, color: COLOR.red, marginBottom: SPACE[3] }}>Något gick fel — försök igen.</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: SPACE[2] }}>
            <button onClick={() => save({ slots, publish: false })} disabled={saving}
              style={{ padding: SPACE[3], borderRadius: RADIUS.lg, border: `1px solid ${COLOR.hairline}`, background: 'transparent', color: COLOR.ink2, fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
              Spara utkast
            </button>
            <button onClick={() => save({ slots, publish: true })} disabled={saving || !complete}
              style={{ padding: SPACE[3], borderRadius: RADIUS.lg, border: 'none', background: complete ? COLOR.gold : COLOR.surface2, color: complete ? '#1a1400' : COLOR.ink3, fontSize: 13, fontWeight: 800, cursor: saving || !complete ? 'default' : 'pointer' }}>
              {saving ? 'Sparar…' : publishLabel}
            </button>
          </div>
          {starterCount > 0 && (
            <button onClick={onShare}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACE[2], width: '100%', marginTop: SPACE[4], padding: `${SPACE[3]}px`, background: 'none', border: 'none', color: COLOR.ink2, fontSize: TYPE.body, fontWeight: 700, cursor: 'pointer' }}>
              <Share2 size={18} /> Dela laguppställning
            </button>
          )}
        </div>
      )}

      <PlayerPickerSheet
        open={activeSlot !== null} onClose={() => setActiveSlot(null)}
        roster={sortedRoster} usedPublicIds={usedPublicIds}
        availabilityByPublicId={availabilityByPublicId} candidates={candByPublicId}
        matchDivision={match.division_name} onPick={onPick}
      />
    </div>
  )
}
