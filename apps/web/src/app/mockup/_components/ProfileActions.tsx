'use client'

import type { LucideIcon } from 'lucide-react'
import { CreditCard, Swords, BarChart3, Trophy, Share2 } from 'lucide-react'

// Profile action row in the home-feed circle language: 76px ring + matte sheen +
// inner disc. Neutral ring — these are actions, not toggles, so nothing reads as
// "always active". Mirrors StoryRail's chip so the whole app speaks one circle.

const SHEEN = 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0) 65%)'
const BG = '#0b0d10'
const SURFACE = '#14171c'
const INK2 = 'rgba(244,245,247,0.72)'
const INK3 = 'rgba(244,245,247,0.56)'
const INK4 = 'rgba(244,245,247,0.34)'

const SIZE = 54

function Circle({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} aria-label={label}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0, WebkitTapHighlightColor: 'transparent' }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
      <span style={{ position: 'relative', width: SIZE, height: SIZE, borderRadius: '50%', padding: 2, boxSizing: 'border-box', background: INK4, flexShrink: 0 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none', background: SHEEN }} />
        <span style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', background: SURFACE, border: `2px solid ${BG}`, color: INK2 }}>
          <Icon size={22} strokeWidth={2} />
        </span>
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: INK3, whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )
}

export function ProfileActions({ onOpenCard, onOpenH2H, onOpenSeason, onOpenChallenges, onShare }: {
  onOpenCard: () => void
  onOpenH2H: () => void
  onOpenSeason: () => void
  onOpenChallenges: () => void
  onShare: () => void
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginTop: 24 }}>
      <Circle icon={CreditCard} label="Spelarkort" onClick={onOpenCard} />
      <Circle icon={Swords}     label="H2H"        onClick={onOpenH2H} />
      <Circle icon={BarChart3}  label="Säsongen"   onClick={onOpenSeason} />
      <Circle icon={Trophy}     label="Utmaningar" onClick={onOpenChallenges} />
      <Circle icon={Share2}     label="Dela"       onClick={onShare} />
    </div>
  )
}
