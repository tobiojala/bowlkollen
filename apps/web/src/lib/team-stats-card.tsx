import { ImageResponse } from 'next/og'
import type { TeamStats } from '@bowlkollen/core'

// The sponsor share card, shared by the OG link-preview (opengraph-image.tsx) and
// the downloadable/shareable PNG route (statistik/card). One renderer → one look.
export const CARD_SIZE = { width: 1200, height: 630 }

const BG = '#0b0d10'
const SURFACE = '#14171c'
const INK = '#f4f5f7'
const INK3 = 'rgba(244,245,247,0.56)'
const GOLD = '#f5c200'
const GREEN = '#30d47e'
const RED = '#e05555'

// DM Sans (brand body) as TTF so Satori renders å/ä/ö. Google serves TTF to an
// old UA (it serves woff2 to modern ones, which Satori can't read). Best-effort:
// null → ImageResponse falls back to its built-in font.
async function loadDMSans(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=DM+Sans:wght@${weight}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 5.1)' },
    }).then((r) => r.text())
    const url = css.match(/src:\s*url\((https:[^)]+\.ttf)\)/)?.[1]
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null
  } catch {
    return null
  }
}

export async function renderTeamStatsCard(name: string, stats: TeamStats, headers?: Record<string, string>): Promise<ImageResponse> {
  const [regular, bold] = await Promise.all([loadDMSans(400), loadDMSans(700)])
  const fonts = [
    ...(regular ? [{ name: 'DM Sans', data: regular, weight: 400 as const, style: 'normal' as const }] : []),
    ...(bold ? [{ name: 'DM Sans', data: bold, weight: 700 as const, style: 'normal' as const }] : []),
  ]
  const form = [...stats.form].reverse()

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: BG, display: 'flex', flexDirection: 'column', padding: 72, justifyContent: 'space-between', fontFamily: 'DM Sans' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: GOLD, fontSize: 26, fontWeight: 700, letterSpacing: 4 }}>BOWLKOLLEN</div>
          <div style={{ color: INK, fontSize: 68, fontWeight: 700, marginTop: 12, maxWidth: 1000, lineHeight: 1.05 }}>{name}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: INK3, fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>PINFALL / MATCH</div>
            <div style={{ color: GOLD, fontSize: 190, fontWeight: 700, lineHeight: 1 }}>
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
                  <div key={i} style={{ width: 56, height: 56, borderRadius: 14, background: SURFACE, color: c, fontSize: 30, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {letter}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...CARD_SIZE, ...(fonts.length ? { fonts } : {}), ...(headers ? { headers } : {}) },
  )
}
