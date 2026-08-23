'use client'

import Link from 'next/link'
import { Trophy, ChevronRight } from 'lucide-react'
import { COLOR, SPACE } from '@/lib/brand'
import { SEASON } from '@/lib/constants'
import { buildBrackets } from '@/app/sm-slutspel/_components/bracket'
import type { TeamStanding } from '@/lib/division-standings'

// SM-slutspel's place on the Elitserien division: a compact button, scoped to
// this gender + the selected season pill, that opens the full page. Past season →
// "Mästare: X"; current season → "Prognos". Hidden for seasons with no slutspel.
const SLUTSPEL_SEASON_ID = 2025 // hardcoded bracket = 2025/26 (played May 2026)

export function DivisionSlutspel({ gender, seasonYear }: {
  gender: 'herrar' | 'damer'; seasonYear: number; standings?: TeamStanding[]
}) {
  const currentYear = Number(SEASON.CURRENT.slice(0, 4))
  const label = `${String(seasonYear).slice(2)}/${String((seasonYear + 1) % 100).padStart(2, '0')}`

  let sub: string | null = null
  if (seasonYear === SLUTSPEL_SEASON_ID) {
    const { herrar, damer } = buildBrackets()
    const champ = (gender === 'herrar' ? herrar : damer).champion
    sub = champ ? `Svenska Mästare · ${champ}` : null
    if (!champ) return null
  } else if (seasonYear === currentYear) {
    sub = 'Prognos — på väg till slutspel'
  } else {
    return null // no slutspel for this season
  }

  return (
    <Link href={`/sm-slutspel?gender=${gender}&season=${seasonYear}`} style={{
      display: 'flex', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[4],
      padding: `${SPACE[3]}px ${SPACE[4]}px`, background: `${COLOR.gold}18`, borderRadius: 16, textDecoration: 'none',
    }}>
      <Trophy size={20} color={COLOR.gold} strokeWidth={2} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: COLOR.ink }}>SM-slutspel {label}</span>
        {sub && <span style={{ display: 'block', fontSize: 13, color: COLOR.ink3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
      </span>
      <ChevronRight size={16} color={COLOR.ink3} style={{ flexShrink: 0 }} />
    </Link>
  )
}
