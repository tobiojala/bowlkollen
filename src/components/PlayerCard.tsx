'use client'

import React, { useState, useRef } from 'react'

type Props = {
  name: string
  teamName: string
  avatarUrl: string | null
  avg: number
  bestSeries: number
  over200: number
  matches: number
  division: string
  hand: string | null
  style: string | null
  ballBrand: string | null
  bio: string | null
  achievements?: string[]
  isDark: boolean
}

function calcRating(avg: number, best: number, over200: number, hasData: boolean) {
  if (!hasData) return Math.min(55, Math.round(avg * 0.3))
  return Math.min(99, Math.round(avg * 0.4 + (best / 4 / 10) * 0.4 + over200 * 1.5))
}

function getTier(rating: number) {
  if (rating >= 95) return { label: 'LEGEND', color: '#f5c200', bg: 'rgba(245,194,0,0.12)', border: '#f5c200', edgeShadow: 'inset 0 0 20px rgba(245,194,0,0.25),0 0 30px rgba(245,194,0,0.15)', cardBg: 'linear-gradient(160deg,#1a1400,#0d1520)', topBg: 'linear-gradient(135deg,#1a1400,#0d1520)', tierBg: 'rgba(180,140,0,0.9)' }
  if (rating >= 85) return { label: 'ELITE', color: '#afa9ec', bg: 'rgba(127,119,221,0.12)', border: '#7f77dd', edgeShadow: 'inset 0 0 20px rgba(127,119,221,0.25),0 0 30px rgba(127,119,221,0.15)', cardBg: 'linear-gradient(160deg,#1c1640,#0d1520)', topBg: 'linear-gradient(135deg,#1c1640,#0d1520)', tierBg: 'rgba(100,90,200,0.9)' }
  if (rating >= 75) return { label: 'PRO', color: '#5dcaa5', bg: 'rgba(29,158,117,0.12)', border: '#1d9e75', edgeShadow: 'inset 0 0 20px rgba(29,158,117,0.25),0 0 30px rgba(29,158,117,0.15)', cardBg: 'linear-gradient(160deg,#0f1f1a,#0d1520)', topBg: 'linear-gradient(135deg,#0a1f16,#0d1520)', tierBg: 'rgba(15,100,70,0.95)' }
  if (rating >= 60) return { label: 'VETERAN', color: '#ef9f27', bg: 'rgba(186,117,23,0.12)', border: '#ba7517', edgeShadow: 'inset 0 0 20px rgba(186,117,23,0.25),0 0 30px rgba(186,117,23,0.15)', cardBg: 'linear-gradient(160deg,#1a1206,#0d1520)', topBg: 'linear-gradient(135deg,#1a1206,#0d1520)', tierBg: 'rgba(140,80,10,0.95)' }
  return { label: 'ROOKIE', color: '#8899aa', bg: 'rgba(255,255,255,0.04)', border: '#2a3858', edgeShadow: 'inset 0 0 10px rgba(100,120,160,0.1)', cardBg: '#141e2e', topBg: 'linear-gradient(135deg,#141e2e,#0d1520)', tierBg: 'rgba(40,55,80,0.95)' }
}

function initials(n: string) {
  return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function stars(rating: number) {
  const s = Math.round(rating / 20)
  return { filled: s, empty: 5 - s }
}

export default function PlayerCard({ name, teamName, avatarUrl, avg, bestSeries, over200, matches, division, hand, style, ballBrand, bio, achievements = [], isDark }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  const rating = calcRating(avg, bestSeries, over200, avg > 0)
  const tier = getTier(rating)
  const st = stars(rating)
  const muted = '#6b7a99'

  const downloadCard = async () => {
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const wasFlipped = flipped

      // Download front
      if (wasFlipped) setFlipped(false)
      await new Promise(r => setTimeout(r, 400))
      if (frontRef.current) {
        const canvas = await html2canvas(frontRef.current, { scale: 3, backgroundColor: null, useCORS: true })
        const link = document.createElement('a')
        link.download = name.replace(' ', '_') + '_front.png'
        link.href = canvas.toDataURL('image/png')
        link.click()
      }

      // Download back
      setFlipped(true)
      await new Promise(r => setTimeout(r, 500))
      if (backRef.current) {
        const canvas = await html2canvas(backRef.current, { scale: 3, backgroundColor: null, useCORS: true })
        const link = document.createElement('a')
        link.download = name.replace(' ', '_') + '_back.png'
        link.href = canvas.toDataURL('image/png')
        link.click()
      }

      setFlipped(wasFlipped)
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

      {/* 3D Card */}
      <div
        onClick={() => setFlipped(f => !f)}
        style={{ width: 220, height: 330, perspective: '1000px', cursor: 'pointer' }}
      >
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.7s cubic-bezier(0.4,0.2,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))'
        }}>

          {/* FRONT */}
          <div ref={frontRef} style={{ position: 'absolute', inset: 0, borderRadius: 18, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden', background: tier.cardBg }}>
            {/* Photo or initials */}
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }} crossOrigin="anonymous" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tier.cardBg }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: tier.bg, border: '3px solid ' + tier.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: tier.color }}>
                  {initials(name)}
                </div>
              </div>
            )}
            {/* Gradient overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 35%,rgba(0,0,0,0.75) 65%,rgba(0,0,0,0.97) 100%)' }} />
            {/* Foil texture */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.4, background: 'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,0.02) 2px,rgba(255,255,255,0.02) 4px)', borderRadius: 18 }} />
            {/* Border glow */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 18, border: '2px solid ' + tier.border, boxShadow: tier.edgeShadow, pointerEvents: 'none' }} />
            {/* Top */}
            <div style={{ position: 'absolute', top: 10, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, padding: '3px 9px', borderRadius: 20, background: tier.tierBg, color: '#fff' }}>{tier.label}</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, fontWeight: 500 }}>2025/26</span>
            </div>
            {/* Bottom info */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px 12px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.9)', letterSpacing: 0.3, lineHeight: 1, marginBottom: 2 }}>{name}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: tier.color, letterSpacing: 1, marginBottom: 8 }}>{teamName.toUpperCase()}</div>
              <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                {[{ v: avg, l: 'SNITT' }, { v: bestSeries || '—', l: 'BASTA' }, { v: over200, l: '200+' }].map(s => (
                  <div key={s.l} style={{ flex: 1, background: 'rgba(0,0,0,0.55)', borderRadius: 7, padding: '5px 3px', textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.55)', marginTop: 2, letterSpacing: 0.8 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 12, letterSpacing: 1.5 }}>
                    <span style={{ color: '#f5c200' }}>{'★'.repeat(st.filled)}</span>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>{'★'.repeat(st.empty)}</span>
                  </div>
                  <div style={{ fontSize: 7, color: tier.color, letterSpacing: 0.8, fontWeight: 700, marginTop: 1 }}>SPELSTYRKA {rating}</div>
                </div>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5 }}>#001 / 500</div>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div ref={backRef} style={{ position: 'absolute', inset: 0, borderRadius: 18, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden', background: '#0d1520', transform: 'rotateY(180deg)', display: 'flex', flexDirection: 'column' }}>
            {/* Back top */}
            <div style={{ height: 80, background: tier.topBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.12, background: 'repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,255,255,0.1) 8px,rgba(255,255,255,0.1) 9px)' }} />
              <div style={{ position: 'absolute', inset: 0, borderBottom: '1px solid ' + tier.border + '44' }} />
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -1, zIndex: 2, color: '#fff' }}>
                Bowl<span style={{ color: '#f5c200' }}>kollen</span>
              </div>
            </div>
            {/* Back body */}
            <div style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
              {/* Stats */}
              <div style={{ background: tier.bg, border: '0.5px solid ' + tier.border + '44', borderRadius: 10, padding: '7px 9px' }}>
                <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: tier.color, marginBottom: 5 }}>SASONGSSTATISTIK 2025/26</div>
                {[['Snittpoang', avg], ['Basta serie', bestSeries || '—'], ['200+ spel', over200], ['Matcher', matches], ['Division', division]].map(([l, v]) => (
                  <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{l}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Achievements */}
              {achievements.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px 9px' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: tier.color, marginBottom: 5 }}>MERITER</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {achievements.map(a => (
                      <span key={a} style={{ fontSize: 7, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: tier.bg, color: tier.color, border: '0.5px solid ' + tier.border + '44' }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Profile */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px 9px' }}>
                <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>SPELARPROFIL</div>
                {[['Hand', hand === 'right' ? 'Hoger' : hand === 'left' ? 'Vanster' : '—'], ['Stil', style || '—'], ['Klot', ballBrand || '—']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{l}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Back footer */}
            <div style={{ padding: '6px 12px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>BOWLKOLLEN.SE</span>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>#001 / 500 · {tier.label}</span>
            </div>
            {/* Border */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 18, border: '2px solid ' + tier.border, boxShadow: tier.edgeShadow, pointerEvents: 'none' }} />
          </div>

        </div>
      </div>

      {/* Hint */}
      <div style={{ fontSize: 11, color: muted, letterSpacing: 0.5 }}>
        {flipped ? 'Klicka for att se framsidan' : 'Klicka for att vanda kortet'}
      </div>

      {/* Download button */}
      <button onClick={downloadCard} disabled={downloading}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: tier.bg, border: '1px solid ' + tier.border + '66', borderRadius: 12, fontSize: 12, fontWeight: 700, color: tier.color, cursor: 'pointer', opacity: downloading ? 0.7 : 1 }}>
        {downloading ? 'Laddar ner...' : '⬇ Ladda ner kort (framsida + baksida)'}
      </button>
    </div>
  )
}
