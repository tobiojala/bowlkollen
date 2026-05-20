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
  isOwner: boolean
  onClose?: () => void
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

function CardFront({ name, teamName, avatarUrl, avg, bestSeries, over200, tier, st, rating }: any) {
  return (
    <div style={{ position: 'relative', width: 220, height: 330, borderRadius: 18, overflow: 'hidden', background: tier.cardBg, flexShrink: 0 }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: tier.bg, border: '3px solid ' + tier.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: tier.color }}>
            {initials(name)}
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 35%,rgba(0,0,0,0.75) 65%,rgba(0,0,0,0.97) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4, background: 'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,0.02) 2px,rgba(255,255,255,0.02) 4px)', borderRadius: 18 }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, border: '2px solid ' + tier.border, boxShadow: tier.edgeShadow, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 10, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, padding: '3px 9px', borderRadius: 20, background: tier.tierBg, color: '#fff' }}>{tier.label}</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, fontWeight: 500 }}>2025/26</span>
      </div>
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
  )
}

function CardBack({ name, teamName, tier, avg, bestSeries, over200, matches, division, hand, style: bStyle, ballBrand, achievements, rating }: any) {
  return (
    <div style={{ position: 'relative', width: 220, height: 330, borderRadius: 18, overflow: 'hidden', background: '#0d1520', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ height: 80, background: tier.topBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.12, background: 'repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,255,255,0.1) 8px,rgba(255,255,255,0.1) 9px)' }} />
        <div style={{ position: 'absolute', inset: 0, borderBottom: '1px solid ' + tier.border + '44' }} />
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1, zIndex: 2, color: '#fff' }}>Bowl<span style={{ color: '#f5c200' }}>kollen</span></div>
      </div>
      <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
        <div style={{ background: tier.bg, border: '0.5px solid ' + tier.border + '44', borderRadius: 10, padding: '7px 9px' }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: tier.color, marginBottom: 5 }}>SASONGSSTATISTIK 2025/26</div>
          {[['Snittpoang', avg], ['Basta serie', bestSeries || '—'], ['200+ spel', over200], ['Matcher', matches], ['Division', division]].map(([l, v]) => (
            <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{l}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{v}</span>
            </div>
          ))}
        </div>
        {achievements.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px 9px' }}>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: tier.color, marginBottom: 5 }}>MERITER</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {achievements.map((a: string) => (
                <span key={a} style={{ fontSize: 7, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: tier.bg, color: tier.color }}>{a}</span>
              ))}
            </div>
          </div>
        )}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px 9px' }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>SPELARPROFIL</div>
          {[['Hand', hand === 'right' ? 'Hoger' : hand === 'left' ? 'Vanster' : '—'], ['Stil', bStyle || '—'], ['Klot', ballBrand || '—']].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{l}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '6px 12px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>BOWLKOLLEN.SE</span>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>#001 / 500 · {tier.label}</span>
      </div>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, border: '2px solid ' + tier.border, boxShadow: tier.edgeShadow, pointerEvents: 'none' }} />
    </div>
  )
}

export default function PlayerCard({ name, teamName, avatarUrl, avg, bestSeries, over200, matches, division, hand, style: bStyle, ballBrand, bio, achievements = [], isDark, isOwner, onClose }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  const rating = calcRating(avg, bestSeries, over200, avg > 0)
  const tier = getTier(rating)
  const st = stars(rating)
  const muted = '#6b7a99'
  const shareText = encodeURIComponent(`Kolla mitt Bowlkollen spelarkort! Snitt ${avg}, Spelstyrka ${rating} – ${tier.label} tier 🎳 bowlkollen.se`)

  const getCardCanvas = async (side: 'front' | 'back') => {
    const html2canvas = (await import('html2canvas')).default
    const el = side === 'front' ? frontRef.current : backRef.current
    if (!el) return null
    return html2canvas(el, { scale: 3, backgroundColor: null, useCORS: true, allowTaint: true })
  }

  const downloadCard = async () => {
    setDownloading(true)
    try {
      // Front
      if (flipped) { setFlipped(false); await new Promise(r => setTimeout(r, 500)) }
      const fc = await getCardCanvas('front')
      if (fc) { const a = document.createElement('a'); a.download = name.replace(/\s/g,'_') + '_front.png'; a.href = fc.toDataURL('image/png'); a.click() }
      await new Promise(r => setTimeout(r, 200))
      // Back
      setFlipped(true); await new Promise(r => setTimeout(r, 500))
      const bc = await getCardCanvas('back')
      if (bc) { const a = document.createElement('a'); a.download = name.replace(/\s/g,'_') + '_back.png'; a.href = bc.toDataURL('image/png'); a.click() }
      setFlipped(false)
    } catch(e) { console.error(e) }
    setDownloading(false)
  }

  const shareToSocial = async (platform: string) => {
    let canvas = await getCardCanvas('front')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')

    if (platform === 'download') {
      const a = document.createElement('a'); a.download = name.replace(/\s/g,'_') + '_card.png'; a.href = dataUrl; a.click()
    } else if (platform === 'facebook') {
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href), '_blank')
    } else if (platform === 'x') {
      window.open('https://twitter.com/intent/tweet?text=' + shareText + '&url=' + encodeURIComponent(window.location.href), '_blank')
    } else if (platform === 'instagram' || platform === 'tiktok') {
      // Download for manual share
      const a = document.createElement('a'); a.download = name.replace(/\s/g,'_') + '_card.png'; a.href = dataUrl; a.click()
      alert(platform === 'instagram' ? 'Kortet har laddats ner! Oppna Instagram och dela det som en story eller post.' : 'Kortet har laddats ner! Oppna TikTok och anvand det i ditt naesta klipp.')
    }
    setShareOpen(false)
  }

  const cardProps = { name, teamName, tier, avg, bestSeries, over200, matches, division, hand, style: bStyle, ballBrand, achievements, rating, st, avatarUrl }

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 360, background: isDark ? '#0d1520' : '#f0f4f8', zIndex: 100, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 40px rgba(0,0,0,0.4)', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid ' + (isDark ? '#2a3858' : '#d0d8e8'), flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: 1.5 }}>SPELARKORT</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#fff' : '#0d1f35', marginTop: 2 }}>{name}</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: muted, fontSize: 24, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>×</button>
      </div>

      {/* Card */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 16px', gap: 12 }}>
        <div onClick={() => setFlipped(f => !f)} style={{ perspective: '1000px', cursor: 'pointer', width: 220, height: 330 }}>
          <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.7s cubic-bezier(0.4,0.2,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} ref={frontRef}>
              <CardFront {...cardProps} />
            </div>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} ref={backRef}>
              <CardBack {...cardProps} />
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: muted }}>
          {flipped ? 'Klicka for att se framsidan' : 'Klicka for att vanda kortet'}
        </div>
      </div>

      {/* Tier info */}
      <div style={{ margin: '0 20px 16px', padding: '12px 14px', background: tier.bg, border: '1px solid ' + tier.border + '44', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: tier.color }}>{tier.label} tier</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>Spelstyrka {rating} / 99</div>
          </div>
          <div style={{ fontSize: 20, letterSpacing: 2 }}>
            <span style={{ color: '#f5c200' }}>{'★'.repeat(st.filled)}</span>
            <span style={{ color: isDark ? '#2a3858' : '#d0d8e8' }}>{'★'.repeat(st.empty)}</span>
          </div>
        </div>
      </div>

      {/* Owner actions */}
      {isOwner && (
        <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Share button */}
          <button onClick={() => setShareOpen(s => !s)}
            style={{ width: '100%', padding: '13px', background: tier.bg, border: '1px solid ' + tier.border + '66', borderRadius: 12, fontSize: 13, fontWeight: 700, color: tier.color, cursor: 'pointer' }}>
            Dela kortet
          </button>

          {/* Share options */}
          {shareOpen && (
            <div style={{ background: isDark ? '#172030' : '#fff', border: '1px solid ' + (isDark ? '#2a3858' : '#d0d8e8'), borderRadius: 14, overflow: 'hidden' }}>
              {[
                { platform: 'instagram', label: 'Instagram', emoji: '📸', hint: 'Laddar ner for Stories/Post' },
                { platform: 'tiktok', label: 'TikTok', emoji: '🎵', hint: 'Laddar ner for TikTok' },
                { platform: 'facebook', label: 'Facebook', emoji: '👥', hint: 'Oppnar Facebook' },
                { platform: 'x', label: 'X / Twitter', emoji: '𝕏', hint: 'Oppnar X' },
                { platform: 'download', label: 'Ladda ner PNG', emoji: '⬇', hint: 'Framsida som PNG' },
              ].map((s, i) => (
                <button key={s.platform} onClick={() => shareToSocial(s.platform)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: 'transparent', border: 'none', borderBottom: i < 4 ? '1px solid ' + (isDark ? '#2a3858' : '#e8f0f8') : 'none', cursor: 'pointer', textAlign: 'left' as const }}
                  onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center' as const }}>{s.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#fff' : '#0d1f35' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: muted }}>{s.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Download both sides */}
          <button onClick={downloadCard} disabled={downloading}
            style={{ width: '100%', padding: '13px', background: 'transparent', border: '1px solid ' + (isDark ? '#2a3858' : '#d0d8e8'), borderRadius: 12, fontSize: 13, fontWeight: 600, color: muted, cursor: 'pointer', opacity: downloading ? 0.7 : 1 }}>
            {downloading ? 'Laddar ner...' : '⬇ Ladda ner framsida + baksida'}
          </button>
        </div>
      )}

      {/* Non-owner message */}
      {!isOwner && (
        <div style={{ padding: '0 20px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: muted }}>
            Ar det du? Claima profilen for att ladda ner och dela ditt kort.
          </div>
        </div>
      )}

      {/* Hidden render divs for download */}
      <div style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}>
        <div ref={frontRef}><CardFront {...cardProps} /></div>
        <div ref={backRef}><CardBack {...cardProps} /></div>
      </div>
    </div>
  )
}
