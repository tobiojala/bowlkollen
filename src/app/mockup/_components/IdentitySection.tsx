'use client'

import { useState } from 'react'
import { CreditCard, Swords, Trophy, Share2, Star, Zap, Flame, Target, Crown } from 'lucide-react'
import { HeroCurve } from '@/components/mockup/Curves'
import { HeroNumber, ActionRow, ActionButton } from '@/components/ui/primitives'
import { ACHIEVEMENTS, MOCK_FOLLOWERS, PLAYER_LEVEL, PLAYER_BK_RATING, MATCHES, COLORS } from '../data'

const { GOLD } = COLORS
const INK  = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.64)'
const INK3 = 'rgba(244,245,247,0.40)'
const INK4 = 'rgba(244,245,247,0.24)'

const BADGE_ICONS = {
  Star:      Star,
  Lightning: Zap,
  Trophy:    Trophy,
  Fire:      Flame,
  Target:    Target,
  Crown:     Crown,
} as const
type BadgeIconName = keyof typeof BADGE_ICONS

function BadgeIcon({ name, size, color, filled }: {
  name: string; size: number; color: string; filled?: boolean
}) {
  const Icon = BADGE_ICONS[name as BadgeIconName]
  return Icon ? <Icon size={size} color={color} fill={filled ? color : 'none'} strokeWidth={2} /> : null
}

interface IdentitySectionProps {
  matchAvgs: number[]
  seasonAvg: number
  formDiff: number
  recentAvg: number
  lastSeasonAvg: number
  bkTopPct: number
  onOpenCurve: () => void
  onOpenChallenges: () => void
}

export default function IdentitySection({
  matchAvgs, seasonAvg, formDiff, recentAvg, lastSeasonAvg,
  bkTopPct, onOpenCurve, onOpenChallenges,
}: IdentitySectionProps) {
  const [following, setFollowing] = useState(false)

  // Projected season avg if next 3 matches hold current form
  const projSeasonAvg = Math.round(
    (matchAvgs.reduce((a, b) => a + b) + recentAvg * 3) / (matchAvgs.length + 3)
  )
  const projDiff = projSeasonAvg - seasonAvg

  return (
    <div style={{ padding: '20px 20px 0' }}>

      {/* Identity header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: '#1c2127', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 900, color: GOLD, letterSpacing: -0.5 }}>SH</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.15 }}>Sara Holmberg</div>
          <div style={{ fontSize: 13, color: INK2, marginTop: 3 }}>Örebro BK · Elitserien</div>
        </div>
        <button onClick={() => setFollowing(f => !f)}
          style={{ flexShrink: 0, minHeight: 40, padding: '0 18px', borderRadius: 999, cursor: 'pointer', border: 'none',
            background: following ? '#1c2127' : INK,
            color: following ? INK2 : '#0b0d10', fontSize: 13, fontWeight: 700,
            transition: 'background 0.15s, color 0.15s' }}>
          {following ? 'Följer' : 'Följ'}
        </button>
      </div>
      <div style={{ fontSize: 13, color: INK3, padding: '8px 0 0 62px' }}>
        <span style={{ color: INK2, fontWeight: 600 }}>{(MOCK_FOLLOWERS.followers + (following ? 1 : 0)).toLocaleString('sv-SE')}</span> följare
        <span style={{ padding: '0 6px', color: INK4 }}>·</span>
        <span style={{ color: INK2, fontWeight: 600 }}>{MOCK_FOLLOWERS.following}</span> följer
      </div>

      {/* Level + achievement chips — quiet, tonal; gold only when nearly earned */}
      <div className="noscroll" style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', scrollbarWidth: 'none' } as React.CSSProperties}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 999,
          background: '#14171c', color: INK2 }}>
          <Zap size={11} color={INK2} />Nivå {PLAYER_LEVEL.level}
        </span>
        {ACHIEVEMENTS.filter(a => a.earned || a.near).map((a, i) => (
          <span key={i} className={a.near ? 'badge-near' : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 999,
              background: a.near ? 'rgba(245,194,0,0.10)' : '#14171c',
              color: a.near ? GOLD : INK2 }}>
            <BadgeIcon name={a.icon} size={11} color={a.near ? GOLD : INK3} filled={a.earned} />
            {a.title}
          </span>
        ))}
      </div>

      {/* Hero: the one home for snitt, form, percentile and rating */}
      <div className="hero-in" style={{ marginTop: 24 }}>
        <HeroNumber
          label="Säsongssnitt"
          value={seasonAvg}
          delta={formDiff}
          deltaSuffix=" form"
          caption={<>Top {bkTopPct}% i Elitserien Damer · BK Rating <span style={{ color: INK, fontWeight: 700 }}>{PLAYER_BK_RATING}</span></>}
        />
        <div onClick={onOpenCurve} style={{ marginTop: 18, cursor: 'pointer' }}>
          <HeroCurve matchAvgs={matchAvgs} seasonAvg={seasonAvg} projAvg={recentAvg} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: INK4 }}>{MATCHES[0].date}</span>
            <span style={{ fontSize: 12, color: INK3 }}>{MATCHES.length} matcher · förra säsongen {lastSeasonAvg}</span>
            <span style={{ fontSize: 12, color: INK3 }}>
              Prognos <span style={{ fontWeight: 700, color: projDiff >= 0 ? '#5dcaa5' : '#e05555', fontVariantNumeric: 'tabular-nums' }}>{projSeasonAvg}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action row */}
      <ActionRow className="mt-6 -mx-1">
        <ActionButton icon={CreditCard} label="Spelarkort" />
        <ActionButton icon={Swords}     label="H2H" />
        <ActionButton icon={Trophy}     label="Utmaningar" onClick={onOpenChallenges} />
        <ActionButton icon={Share2}     label="Dela" />
      </ActionRow>
    </div>
  )
}
