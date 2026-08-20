'use client'

import { use } from 'react'
import Link from 'next/link'
import { ChevronLeft, Share2, Image as ImageIcon } from 'lucide-react'
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

  // Share the actual image card where the platform supports it (mobile share
  // sheet → Instagram, stories, etc.); otherwise fall back to the link (which
  // carries the same card as a preview) or copying the URL.
  const share = async () => {
    if (typeof navigator === 'undefined') return
    const url = location.href
    const title = `${teamName ?? 'Lagstatistik'} · Bowlkollen`
    try {
      const res = await fetch(`/lag/${teamId}/statistik/card`)
      const blob = await res.blob()
      const file = new File([blob], `${(teamName ?? 'lag').replace(/\s+/g, '-').toLowerCase()}-statistik.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title })
        return
      }
    } catch { /* fall through to link/copy */ }
    if (navigator.share) navigator.share({ title, url }).catch(() => {})
    else navigator.clipboard?.writeText(url).catch(() => {})
  }

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
          <>
            <TeamStatsView stats={data.stats} season={data.season} />
            <div style={{ display: 'flex', gap: SPACE[3], marginTop: SPACE[6] }}>
              <button onClick={share} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: `${SPACE[3]}px`, borderRadius: 14, border: 'none', background: COLOR.gold,
                fontSize: 14, fontWeight: 800, color: '#1a1400', cursor: 'pointer',
              }}>
                <Share2 size={16} /> Dela statistik
              </button>
              <Link href={`/compare/teams/${teamId}`} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: `${SPACE[3]}px`, borderRadius: 14,
                border: `1px solid ${COLOR.hairline}`, background: COLOR.surface,
                fontSize: 14, fontWeight: 700, color: COLOR.ink2, textDecoration: 'none',
              }}>
                Jämför lag
              </Link>
            </div>
            <Link href={`/lag/${teamId}/statistik/card`} target="_blank" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: SPACE[3], padding: `${SPACE[2]}px`,
              fontSize: 13, fontWeight: 600, color: COLOR.ink3, textDecoration: 'none',
            }}>
              <ImageIcon size={14} /> Öppna bildkort
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
