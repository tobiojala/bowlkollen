'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useSession, useTeamClaim, useBitsMatch } from '@/lib/queries'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { LagetTab } from './_components/LagetTab'
import { OpponentTab } from './_components/OpponentTab'
import { BanaTab } from './_components/BanaTab'

type Props = { params: Promise<{ id: string; matchid: string }> }
type Tab = 'laget' | 'opp' | 'bana'

const TABS: { key: Tab; label: string }[] = [
  { key: 'laget', label: 'Laget' },
  { key: 'opp',   label: 'Motståndare' },
  { key: 'bana',  label: 'Bana' },
]

// Captain lineup tool for a BITS team's match — mirrors native laguttagning:
// Laget (build/publish the lineup), Motståndare (scouting), Bana (venue + oil).
// A published lineup is public; a draft is visible only to verified teammates —
// both enforced server-side by get_team_lineup, so this page never redirects.
export default function LaguttagningPage({ params }: Props) {
  const { id, matchid } = use(params)
  const teamId  = Number(id)
  const matchId = Number(matchid)

  const { data: session } = useSession()
  const { data: claim }   = useTeamClaim(teamId)
  const { data: match, isLoading } = useBitsMatch(matchId)
  const [tab, setTab] = useState<Tab>('laget')

  const isCaptain = !!session && claim?.status === 'verified' && claim.role === 'captain'

  if (isLoading || !match) {
    return (
      <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink2, fontFamily: FONT.body, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Laddar…
      </main>
    )
  }

  const isHome       = match.home_bits_team_id === teamId
  const opponentId   = isHome ? match.away_bits_team_id : match.home_bits_team_id
  const opponentName = isHome ? match.away_team_name : match.home_team_name
  const dateLabel = new Date(match.match_date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: `${SPACE[6]}px ${SPACE[4]}px 96px` }}>
        <Link href={`/lag/${teamId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 14, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4] }}>
          <ChevronLeft size={15} /> Lagets sida
        </Link>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: 4 }}>LAGUTTAGNING</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: COLOR.ink, margin: 0, lineHeight: 1.2 }}>
          {match.home_team_name} <span style={{ color: COLOR.ink3 }}>–</span> {match.away_team_name}
        </h1>
        <div style={{ fontSize: TYPE.body, color: COLOR.ink2, marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span>{dateLabel}</span>
          <span style={{ color: COLOR.ink4 }}>·</span>
          <span>{isHome ? 'Hemma' : 'Borta'}</span>
          {match.hall_name && (<><span style={{ color: COLOR.ink4 }}>·</span><span>{match.hall_name}</span></>)}
        </div>

        {/* Segmented tabs */}
        <div role="tablist" style={{ display: 'flex', gap: 3, background: COLOR.surface, borderRadius: RADIUS.pill, padding: 3, marginTop: SPACE[4], marginBottom: SPACE[6] }}>
          {TABS.map(t => {
            const active = tab === t.key
            return (
              <button key={t.key} role="tab" aria-selected={active} onClick={() => setTab(t.key)}
                style={{ flex: 1, minHeight: 38, border: 'none', borderRadius: RADIUS.pill, cursor: 'pointer', background: active ? COLOR.surface2 : 'transparent', color: active ? COLOR.ink : COLOR.ink3, fontSize: 14, fontWeight: 700, fontFamily: FONT.body }}>
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'laget' && <LagetTab teamId={teamId} matchId={matchId} match={match} isCaptain={isCaptain} />}
        {tab === 'opp'   && <OpponentTab teamId={teamId} opponentId={opponentId} opponentName={opponentName} matchId={matchId} />}
        {tab === 'bana'  && <BanaTab hall={match.hall_name} division={match.division_name} />}
      </div>
    </main>
  )
}
