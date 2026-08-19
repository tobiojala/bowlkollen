'use client'

import { use } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useTeamStats, useBitsTeamName } from '@/lib/team-stats-data'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { TeamStatsView } from './_components/TeamStatsView'

type Props = { params: Promise<{ id: string }> }

// Deep team statistics — the team's answer to the player profile. Public,
// BITS-native (rebuilt off the deprecated legacy compare page), shareable.
export default function TeamStatistikPage({ params }: Props) {
  const { id } = use(params)
  const teamId = Number(id)
  const { data: teamName } = useBitsTeamName(teamId)
  const { data, isLoading } = useTeamStats(teamId)

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: `${SPACE[6]}px ${SPACE[4]}px 96px` }}>
        <Link href={`/lag/${teamId}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 2,
          fontSize: TYPE.caption, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4],
        }}>
          <ChevronLeft size={15} /> {teamName ?? 'Laget'}
        </Link>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: 4 }}>
          STATISTIK
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: COLOR.ink, margin: `0 0 ${SPACE[6]}px` }}>
          {teamName ?? 'Laget'}
        </h1>

        {isLoading ? (
          <div style={{ color: COLOR.ink3, textAlign: 'center', padding: `${SPACE[8]}px 0` }}>Laddar…</div>
        ) : !data ? (
          <div style={{ color: COLOR.ink3, textAlign: 'center', padding: `${SPACE[8]}px 0` }}>
            Ingen färdigspelad match att visa statistik för än.
          </div>
        ) : (
          <TeamStatsView stats={data.stats} season={data.season} />
        )}
      </div>
    </main>
  )
}
