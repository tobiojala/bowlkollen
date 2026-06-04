'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/cn'

const RemotionPlayer = dynamic(() => import('./RemotionPlayerEmbed'), { ssr: false })

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

type TierData = {
  label: string
  rarity: string
  accent: string
  cardBg: string
  panelBg: string
  borderColor: string
  glowColor: string
  holoColors: [string, string, string, string, string, string, string]
  shimmerColor: string
  tierGradient: string
  particles: boolean
  bg: string
  topBg: string
}

function calcRating(avg: number, best: number, over200: number, hasData: boolean) {
  if (!hasData) return Math.min(55, Math.round(avg * 0.3))
  return Math.min(99, Math.round(avg * 0.4 + (best / 4 / 10) * 0.4 + over200 * 1.5))
}

function getTier(rating: number): TierData {
  if (rating >= 95) return {
    label: 'LEGEND', rarity: 'HOLO RARE ✦✦✦',
    accent: '#f5c200',
    cardBg: 'linear-gradient(160deg, #1a1400 0%, #0d1118 50%, #1a0a00 100%)',
    panelBg: 'rgba(0,0,0,0.72)',
    borderColor: 'rgba(245,194,0,0.80)',
    glowColor: 'rgba(245,194,0,0.40)',
    holoColors: ['255,0,0', '255,165,0', '255,255,0', '0,200,100', '0,100,255', '160,0,255', '255,0,180'],
    shimmerColor: 'rgba(255,220,80,0.70)',
    tierGradient: 'linear-gradient(90deg, #8a5e00, #f5c200, #ffd940, #f5c200, #8a5e00)',
    particles: true,
    bg: 'rgba(245,194,0,0.12)',
    topBg: 'linear-gradient(135deg,#1a1400,#0d1520)',
  }
  if (rating >= 85) return {
    label: 'ELITE', rarity: 'ULTRA RARE ✦✦',
    accent: '#b8a9f0',
    cardBg: 'linear-gradient(160deg, #140d30 0%, #0d1118 50%, #1a0d3a 100%)',
    panelBg: 'rgba(5,3,20,0.72)',
    borderColor: 'rgba(127,119,221,0.75)',
    glowColor: 'rgba(127,119,221,0.35)',
    holoColors: ['180,150,255', '120,80,240', '200,160,255', '100,60,220', '220,200,255', '80,40,200', '160,120,255'],
    shimmerColor: 'rgba(180,160,255,0.65)',
    tierGradient: 'linear-gradient(90deg, #2a1a70, #7f77dd, #a090ee, #7f77dd, #2a1a70)',
    particles: false,
    bg: 'rgba(127,119,221,0.12)',
    topBg: 'linear-gradient(135deg,#1c1640,#0d1520)',
  }
  if (rating >= 75) return {
    label: 'PRO', rarity: 'RARE ✦',
    accent: '#5dcaa5',
    cardBg: 'linear-gradient(160deg, #071a10 0%, #0d1118 50%, #091f14 100%)',
    panelBg: 'rgba(0,8,5,0.72)',
    borderColor: 'rgba(29,158,117,0.75)',
    glowColor: 'rgba(29,158,117,0.30)',
    holoColors: ['0,255,150', '0,200,100', '80,255,180', '0,170,80', '100,255,200', '0,140,70', '40,220,140'],
    shimmerColor: 'rgba(80,210,160,0.60)',
    tierGradient: 'linear-gradient(90deg, #0a4a30, #1d9e75, #30c490, #1d9e75, #0a4a30)',
    particles: false,
    bg: 'rgba(29,158,117,0.12)',
    topBg: 'linear-gradient(135deg,#0a1f16,#0d1520)',
  }
  if (rating >= 60) return {
    label: 'VETERAN', rarity: 'UNCOMMON',
    accent: '#ef9f27',
    cardBg: 'linear-gradient(160deg, #180e00 0%, #0d1118 50%, #1a0e00 100%)',
    panelBg: 'rgba(8,5,0,0.72)',
    borderColor: 'rgba(186,117,23,0.65)',
    glowColor: 'rgba(186,117,23,0.25)',
    holoColors: ['255,200,0', '240,150,0', '255,220,80', '200,120,0', '255,180,40', '180,100,0', '255,160,0'],
    shimmerColor: 'rgba(240,160,40,0.55)',
    tierGradient: 'linear-gradient(90deg, #5a3000, #ba7517, #e09020, #ba7517, #5a3000)',
    particles: false,
    bg: 'rgba(186,117,23,0.12)',
    topBg: 'linear-gradient(135deg,#1a1206,#0d1520)',
  }
  return {
    label: 'ROOKIE', rarity: 'COMMON',
    accent: '#8899aa',
    cardBg: 'linear-gradient(160deg, #111820 0%, #0d1118 100%)',
    panelBg: 'rgba(0,3,8,0.72)',
    borderColor: 'rgba(100,120,160,0.45)',
    glowColor: 'rgba(100,120,160,0.15)',
    holoColors: ['180,200,220', '150,170,200', '200,215,230', '130,155,185', '210,220,235', '120,145,175', '190,205,225'],
    shimmerColor: 'rgba(180,200,220,0.45)',
    tierGradient: 'linear-gradient(90deg, #1a2535, #3d5070, #4a6080, #3d5070, #1a2535)',
    particles: false,
    bg: 'rgba(255,255,255,0.04)',
    topBg: 'linear-gradient(135deg,#141e2e,#0d1520)',
  }
}

function initials(n: string) {
  return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function starDisplay(rating: number) {
  const s = Math.round(rating / 20)
  return { filled: s, empty: 5 - s }
}

type FrontProps = {
  name: string; teamName: string; avatarUrl: string | null
  avg: number; bestSeries: number; over200: number
  tier: TierData; rating: number
  mousePos: { x: number; y: number }; isHovered: boolean; shimmerKey: number
}

function CardFront({ name, teamName, avatarUrl, avg, bestSeries, over200, tier, rating, mousePos, isHovered, shimmerKey }: FrontProps) {
  const st = starDisplay(rating)
  const mx = mousePos.x, my = mousePos.y
  const intensity = Math.min(1, Math.hypot(mx - 0.5, my - 0.5) * 2.6)
  const hc = tier.holoColors
  const angle = Math.round(mx * 120 + 30)

  const holoStyle = {
    background: `
      radial-gradient(ellipse 75% 90% at ${Math.round(mx * 100)}% ${Math.round(my * 100)}%,
        rgba(${hc[0]}, ${(0.22 * intensity).toFixed(3)}),
        rgba(${hc[2]}, ${(0.17 * intensity).toFixed(3)}) 25%,
        rgba(${hc[4]}, ${(0.15 * intensity).toFixed(3)}) 50%,
        rgba(${hc[6]}, ${(0.12 * intensity).toFixed(3)}) 70%,
        transparent 85%
      ),
      repeating-linear-gradient(
        ${angle}deg,
        rgba(${hc[0]}, 0.045) 0%, rgba(${hc[1]}, 0.045) 7%,
        rgba(${hc[2]}, 0.045) 14%, rgba(${hc[3]}, 0.045) 21%,
        rgba(${hc[4]}, 0.045) 28%, rgba(${hc[5]}, 0.045) 35%,
        rgba(${hc[6]}, 0.045) 42%, rgba(${hc[0]}, 0.045) 49%
      )
    `,
  }

  return (
    <div style={{ position: 'relative', width: 220, height: 330, borderRadius: 18, overflow: 'hidden', background: tier.cardBg }}>

      {/* Full-art photo */}
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} crossOrigin="anonymous"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 100 }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: `rgba(${hc[0]}, 0.12)`,
            border: `2px solid ${tier.borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, fontWeight: 900, color: tier.accent, letterSpacing: -1,
          }}>
            {initials(name)}
          </div>
        </div>
      )}

      {/* Dark vignette — heavier at bottom */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0.95) 100%)',
      }} />

      {/* Holographic prismatic overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 18,
        mixBlendMode: 'screen',
        opacity: isHovered ? 1 : 0.38,
        transition: 'opacity 200ms',
        pointerEvents: 'none',
        ...holoStyle,
      }} />

      {/* Shimmer stripe — retriggered by key */}
      <div key={shimmerKey} style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: '26%',
        background: `linear-gradient(90deg, transparent 0%, ${tier.shimmerColor} 50%, transparent 100%)`,
        animation: 'shimmerSweep 2s ease-in-out 1 forwards',
        pointerEvents: 'none',
      }} />

      {/* Card border + inner glow */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none',
        border: `1.5px solid ${tier.borderColor}`,
        boxShadow: `inset 0 0 28px ${tier.glowColor}, inset 0 1.5px 0 rgba(255,255,255,0.22)`,
      }} />

      {/* Top row */}
      <div style={{ position: 'absolute', top: 11, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          fontSize: 7.5, fontWeight: 800, letterSpacing: 1.4,
          padding: '3px 10px', borderRadius: 20,
          background: tier.tierGradient, color: '#fff',
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          boxShadow: `0 2px 8px ${tier.glowColor}`,
        }}>
          {tier.label}
        </div>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.58)', letterSpacing: 1, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
          2025/26
        </div>
      </div>

      {/* Gold particles (LEGEND only) */}
      {tier.particles && (
        <>
          {([
            { left: '14%', bottom: '42%', delay: '0s', size: 4 },
            { left: '78%', bottom: '56%', delay: '0.7s', size: 3 },
            { left: '52%', bottom: '50%', delay: '1.3s', size: 3.5 },
            { left: '24%', bottom: '62%', delay: '0.4s', size: 2.5 },
            { left: '68%', bottom: '44%', delay: '1.8s', size: 3 },
          ] as Array<{ left: string; bottom: string; delay: string; size: number }>).map((p, i) => (
            <div key={i} style={{
              position: 'absolute', left: p.left, bottom: p.bottom,
              width: p.size, height: p.size, borderRadius: '50%',
              background: tier.accent,
              animation: `${i % 2 === 0 ? 'particleRise' : 'particleRise2'} ${2 + i * 0.4}s ease-out infinite`,
              animationDelay: p.delay,
              boxShadow: `0 0 4px ${tier.accent}`,
              pointerEvents: 'none',
            }} />
          ))}
        </>
      )}

      {/* Bottom frosted glass info panel */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 13px 14px',
        background: tier.panelBg,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderTop: '1px solid rgba(255,255,255,0.09)',
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: 0.1, lineHeight: 1.1, marginBottom: 2, textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
          {name}
        </div>
        <div style={{ fontSize: 8, fontWeight: 700, color: tier.accent, letterSpacing: 1.5, marginBottom: 9, textTransform: 'uppercase' }}>
          {teamName}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 9 }}>
          {[
            { v: avg > 0 ? avg : '—', l: 'SNITT' },
            { v: bestSeries || '—', l: 'BÄSTA' },
            { v: over200, l: '200+' },
          ].map(s => (
            <div key={s.l} style={{
              flex: 1, textAlign: 'center',
              background: 'rgba(255,255,255,0.07)',
              border: '0.5px solid rgba(255,255,255,0.11)',
              borderRadius: 8, padding: '5px 2px',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: -0.5 }}>{s.v}</div>
              <div style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.48)', marginTop: 2, letterSpacing: 0.9 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, lineHeight: 1 }}>
              <span style={{ color: tier.accent }}>{'★'.repeat(st.filled)}</span>
              <span style={{ color: 'rgba(255,255,255,0.12)' }}>{'★'.repeat(st.empty)}</span>
            </div>
            <div style={{ fontSize: 6.5, color: tier.accent, letterSpacing: 0.8, fontWeight: 700, marginTop: 2 }}>
              BK RATING {rating}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.40)', letterSpacing: 0.9, fontWeight: 600 }}>
              {tier.rarity}
            </div>
            <div style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.22)', letterSpacing: 1.5, marginTop: 1 }}>
              #001 / 500
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type BackProps = {
  name: string; teamName: string; tier: TierData; avg: number
  bestSeries: number; over200: number; matches: number; division: string
  hand: string | null; style: string | null; ballBrand: string | null
  achievements: string[]; rating: number
}

function CardBack({ name, teamName, tier, avg, bestSeries, over200, matches, division, hand, style: bStyle, ballBrand, achievements, rating }: BackProps) {
  return (
    <div style={{ position: 'relative', width: 220, height: 330, borderRadius: 18, overflow: 'hidden', background: '#0d1520', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ height: 76, background: tier.topBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.10, background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.12) 8px, rgba(255,255,255,0.12) 9px)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: tier.borderColor, opacity: 0.4 }} />
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1, zIndex: 2, color: '#fff' }}>
          Bowl<span style={{ color: '#f5c200' }}>kollen</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>

        {/* Season stats */}
        <div style={{ background: tier.bg, border: `0.5px solid ${tier.borderColor}55`, borderRadius: 10, padding: '7px 9px' }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: tier.accent, marginBottom: 5 }}>SÄSONGSSTATISTIK 2025/26</div>
          {([
            ['Snittpoäng', avg > 0 ? avg : '—'],
            ['Bästa serie', bestSeries || '—'],
            ['200+ spel', over200],
            ['Matcher', matches],
            ['Division', division],
          ] as [string, string | number][]).map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2.5px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{l}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px 9px' }}>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: tier.accent, marginBottom: 5 }}>MERITER</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {achievements.map((a: string) => (
                <span key={a} style={{ fontSize: 7, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: tier.bg, color: tier.accent }}>{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Player profile */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px 9px' }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.30)', marginBottom: 5 }}>SPELARPROFIL</div>
          {([
            ['Hand', hand === 'right' ? 'Höger' : hand === 'left' ? 'Vänster' : '—'],
            ['Stil', bStyle || '—'],
            ['Klot', ballBrand || '—'],
          ] as [string, string][]).map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '2.5px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{l}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '6px 12px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>BOWLKOLLEN.SE</span>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>#001 / 500 · {tier.label}</span>
      </div>

      {/* Border */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none', border: `1.5px solid ${tier.borderColor}`, boxShadow: `inset 0 0 25px ${tier.glowColor}` }} />
    </div>
  )
}

export default function PlayerCard({
  name, teamName, avatarUrl, avg, bestSeries, over200, matches, division,
  hand, style: bStyle, ballBrand, bio, achievements = [], isDark, isOwner, onClose,
}: Props) {
  const [flipped, setFlipped]     = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [tilt, setTilt]           = useState({ x: 0, y: 0 })
  const [mousePos, setMousePos]   = useState({ x: 0.5, y: 0.5 })
  const [isHovered, setIsHovered] = useState(false)
  const [shimmerKey, setShimmerKey] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)

  const cardRef  = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef  = useRef<HTMLDivElement>(null)

  const rating = calcRating(avg, bestSeries, over200, avg > 0)
  const tier   = getTier(rating)
  const st     = starDisplay(rating)

  // Periodic shimmer
  useEffect(() => {
    const t = setInterval(() => setShimmerKey(k => k + 1), 4500)
    return () => clearInterval(t)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current || isFlipping) return
    const rect = cardRef.current.getBoundingClientRect()
    const mx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const my = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    setMousePos({ x: mx, y: my })
    setTilt({ x: -(my - 0.5) * 18, y: (mx - 0.5) * 18 })
  }, [isFlipping])

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
    setMousePos({ x: 0.5, y: 0.5 })
    setIsHovered(false)
  }, [])

  const handleFlip = () => {
    setIsFlipping(true)
    setFlipped(f => !f)
    setTimeout(() => setIsFlipping(false), 750)
  }

  const baseRotY = flipped ? 180 : 0
  const tx = isFlipping ? 0 : tilt.x
  const ty = isFlipping ? 0 : tilt.y
  const cardTransition = isFlipping ? 'transform 720ms cubic-bezier(0.4,0.2,0.2,1)' : 'transform 80ms linear'

  const shareText = encodeURIComponent(`Kolla mitt Bowlkollen spelarkort! Snitt ${avg}, BK Rating ${rating} – ${tier.label} tier 🎳 bowlkollen.se`)

  const getCardCanvas = async (side: 'front' | 'back') => {
    const html2canvas = (await import('html2canvas')).default
    const el = side === 'front' ? frontRef.current : backRef.current
    if (!el) return null
    return html2canvas(el, { scale: 3, backgroundColor: null, useCORS: true, allowTaint: true })
  }

  const downloadCard = async () => {
    setDownloading(true)
    try {
      const fc = await getCardCanvas('front')
      if (fc) { const a = document.createElement('a'); a.download = name.replace(/\s/g, '_') + '_front.png'; a.href = fc.toDataURL('image/png'); a.click() }
      await new Promise(r => setTimeout(r, 200))
      const bc = await getCardCanvas('back')
      if (bc) { const a = document.createElement('a'); a.download = name.replace(/\s/g, '_') + '_back.png'; a.href = bc.toDataURL('image/png'); a.click() }
    } catch (e) { console.error(e) }
    setDownloading(false)
  }

  const shareToSocial = async (platform: string) => {
    const canvas = await getCardCanvas('front')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    if (platform === 'video') {
      setVideoOpen(v => !v)
      return
    } else if (platform === 'download') {
      const a = document.createElement('a'); a.download = name.replace(/\s/g, '_') + '_card.png'; a.href = dataUrl; a.click()
    } else if (platform === 'facebook') {
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href), '_blank')
    } else if (platform === 'x') {
      window.open('https://twitter.com/intent/tweet?text=' + shareText + '&url=' + encodeURIComponent(window.location.href), '_blank')
    } else if (platform === 'instagram' || platform === 'tiktok') {
      const a = document.createElement('a'); a.download = name.replace(/\s/g, '_') + '_card.png'; a.href = dataUrl; a.click()
      alert(platform === 'instagram'
        ? 'Kortet har laddats ner! Öppna Instagram och dela det som en story eller post.'
        : 'Kortet har laddats ner! Öppna TikTok och använd det i ditt nästa klipp.')
    }
    setShareOpen(false)
  }

  const sharedProps = { name, teamName, tier, avg, bestSeries, over200, matches, division, hand, style: bStyle, ballBrand, achievements, rating }

  return (
    <div
      className={cn(
        'fixed top-0 right-0 bottom-0 z-100 flex w-full max-w-[360px] flex-col overflow-y-auto',
        'bg-light-bg shadow-[-4px_0_40px_rgba(0,0,0,0.4)] dark:bg-dark-bg',
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-between border-b px-5 py-4',
          'border-light-border dark:border-dark-border',
        )}
      >
        <div>
          <div className="text-[11px] font-bold tracking-widest text-dark-muted">SPELARKORT</div>
          <div className="mt-0.5 text-sm font-bold bk-text-primary">{name}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer border-0 bg-transparent px-2 py-1 text-2xl leading-none text-dark-muted"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col items-center gap-3.5 px-5 pt-7 pb-4">
        {/* Drop-shadow wrapper — must be separate from preserve-3d element */}
        <div style={{ filter: `drop-shadow(0 20px 36px rgba(0,0,0,0.55)) drop-shadow(0 4px 12px ${tier.glowColor})` }}>
        {/* Perspective wrapper */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          onClick={handleFlip}
          style={{ perspective: 900, width: 220, height: 330, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
        >
          {/* 3D flip+tilt container — no filter here, filter flattens preserve-3d */}
          <div style={{
            width: '100%', height: '100%', position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tx}deg) rotateY(${baseRotY + ty}deg)`,
            transition: cardTransition,
            willChange: 'transform',
          }}>
            {/* Front face */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
              <CardFront {...sharedProps} avatarUrl={avatarUrl} mousePos={mousePos} isHovered={isHovered} shimmerKey={shimmerKey} />
            </div>
            {/* Back face */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <CardBack {...sharedProps} />
            </div>
          </div>
        </div>
        </div>
        <div className="text-[11px] text-dark-muted">
          {flipped ? 'Klicka för att se framsidan' : 'Klicka för att vända kortet'}
        </div>
      </div>

      <div
        className="mx-5 mb-4 rounded-xl border p-3.5"
        style={{ background: tier.bg, borderColor: `${tier.borderColor}44` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold" style={{ color: tier.accent }}>
              {tier.label} tier
            </div>
            <div className="mt-0.5 text-[11px] text-dark-muted">BK Rating {rating} / 99</div>
          </div>
          <div className="text-xl tracking-widest">
            <span className="text-gold">{'★'.repeat(st.filled)}</span>
            <span className="text-light-border dark:text-dark-border">{'★'.repeat(st.empty)}</span>
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="flex flex-col gap-2.5 px-5 pb-6">
          <button
            type="button"
            onClick={() => setShareOpen(s => !s)}
            className="w-full cursor-pointer rounded-xl border px-3 py-3.25 text-[13px] font-bold"
            style={{
              background: tier.bg,
              borderColor: `${tier.borderColor}66`,
              color: tier.accent,
            }}
          >
            Dela kortet
          </button>
          {shareOpen && (
            <div
              className={cn(
                'overflow-hidden rounded-[14px] border',
                'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
              )}
            >
              {[
                { platform: 'video', label: 'Animerat kort (1080×1080)', emoji: '🎬', hint: 'Förhandsgranska & exportera' },
                { platform: 'instagram', label: 'Instagram', emoji: '📸', hint: 'Laddar ner PNG för Stories/Post' },
                { platform: 'tiktok', label: 'TikTok', emoji: '🎵', hint: 'Laddar ner PNG för TikTok' },
                { platform: 'facebook', label: 'Facebook', emoji: '👥', hint: 'Öppnar Facebook' },
                { platform: 'x', label: 'X / Twitter', emoji: '𝕏', hint: 'Öppnar X' },
                { platform: 'download', label: 'Ladda ner PNG', emoji: '⬇', hint: 'Framsida som PNG' },
              ].map((s, i) => (
                <button
                  key={s.platform}
                  type="button"
                  onClick={() => shareToSocial(s.platform)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-3.25 text-left',
                    'hover:bg-black/5 dark:hover:bg-white/3',
                    i < 5 && 'border-b border-light-border dark:border-dark-border',
                  )}
                >
                  <span className="w-7 text-center text-xl">{s.emoji}</span>
                  <div>
                    <div className="text-[13px] font-semibold bk-text-primary">{s.label}</div>
                    <div className="text-[11px] text-dark-muted">{s.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Animated video preview */}
          {videoOpen && (
            <RemotionPlayer
              name={name}
              teamName={teamName}
              avg={avg}
              bestSeries={bestSeries}
              over200={over200}
              rating={rating}
              tierLabel={tier.label}
              tierAccent={tier.accent}
              tierGlow={tier.glowColor}
              tierBg={tier.bg}
              tierRarity={tier.rarity}
              avatarUrl={avatarUrl}
              isDark={isDark}
              playerName={name}
            />
          )}

          <button
            type="button"
            onClick={downloadCard}
            disabled={downloading}
            className={cn(
              'w-full cursor-pointer rounded-xl border px-3 py-3.25 text-[13px] font-semibold',
              'border-light-border text-dark-muted dark:border-dark-border',
              downloading && 'opacity-70',
            )}
          >
            {downloading ? 'Laddar ner...' : '⬇ Ladda ner framsida + baksida'}
          </button>
        </div>
      )}

      {!isOwner && (
        <div className="px-5 pb-6 text-center">
          <div className="text-xs text-dark-muted">
            Är det du? Claima profilen för att ladda ner och dela ditt kort.
          </div>
        </div>
      )}

      {/* Hidden renders for html2canvas */}
      <div style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}>
        <div ref={frontRef}>
          <CardFront {...sharedProps} avatarUrl={avatarUrl} mousePos={{ x: 0.5, y: 0.5 }} isHovered={false} shimmerKey={0} />
        </div>
        <div ref={backRef}>
          <CardBack {...sharedProps} />
        </div>
      </div>
    </div>
  )
}
