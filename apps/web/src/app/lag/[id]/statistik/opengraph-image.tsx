import { ImageResponse } from 'next/og'
import { getTeamStatsServer } from '@/lib/team-stats-server'

// The sponsor share card — a branded PNG generated when the public stats link is
// shared (WhatsApp, socials, a sponsor's post). Team-scale pinfall front and
// centre. Near-black ground, one gold accent, form as V/F/O (never colour alone).
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Lagstatistik · Bowlkollen'

const BG = '#0b0d10'
const SURFACE = '#14171c'
const INK = '#f4f5f7'
const INK3 = 'rgba(244,245,247,0.56)'
const GOLD = '#f5c200'
const GREEN = '#30d47e'
const RED = '#e05555'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getTeamStatsServer(Number(id))

  if (!data) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', background: BG, color: INK3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
        Bowlkollen · Lagstatistik
      </div>,
      size,
    )
  }

  const { name, stats } = data
  const form = [...stats.form].reverse()

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: BG, display: 'flex', flexDirection: 'column', padding: 72, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: GOLD, fontSize: 26, fontWeight: 800, letterSpacing: 4 }}>BOWLKOLLEN</div>
          <div style={{ color: INK, fontSize: 68, fontWeight: 800, marginTop: 12, maxWidth: 1000, lineHeight: 1.05 }}>{name}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: INK3, fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>PINFALL / MATCH</div>
            <div style={{ color: GOLD, fontSize: 190, fontWeight: 800, lineHeight: 1 }}>
              {stats.pinfallPerMatch != null ? stats.pinfallPerMatch.toLocaleString('sv-SE') : '–'}
            </div>
            <div style={{ color: INK3, fontSize: 30, marginTop: 8, display: 'flex' }}>
              {stats.totalPinfall.toLocaleString('sv-SE')} pins totalt · {stats.played} matcher · {stats.winPct}% vinst
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 20 }}>
            <div style={{ color: INK3, fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>FORM</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {form.map((o, i) => {
                const c = o === 'W' ? GREEN : o === 'L' ? RED : INK3
                const letter = o === 'W' ? 'V' : o === 'L' ? 'F' : 'O'
                return (
                  <div key={i} style={{ width: 56, height: 56, borderRadius: 14, background: SURFACE, color: c, fontSize: 30, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {letter}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
