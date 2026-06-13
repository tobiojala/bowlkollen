'use client'

import { useState, useRef } from 'react'
import { CreditCard, Swords, Trophy, Share2, Star, Zap, Flame, Target, Crown } from 'lucide-react'
import { HeroCurve } from '@/components/mockup/Curves'
import { HeroNumber, ActionRow, ActionButton } from '@/components/ui/primitives'
import { ACHIEVEMENTS, MOCK_FOLLOWERS, PLAYER_LEVEL, PLAYER_BK_RATING, BK_READY, MATCHES, BK_PROGRESS, RANKING_PTS, COLORS } from '../data'

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

type HeroMetric = 'snitt' | 'bk' | 'ranking'

interface IdentitySectionProps {
  matchAvgs: number[]
  seasonAvg: number
  formDiff: number
  recentAvg: number
  lastSeasonAvg: number
  bkTopPct: number
  onOpenCurve: (metric?: HeroMetric) => void
  onOpenChallenges: () => void
  onOpenBkRating: () => void
}

export default function IdentitySection({
  matchAvgs, seasonAvg, formDiff, recentAvg, lastSeasonAvg,
  bkTopPct, onOpenCurve, onOpenChallenges, onOpenBkRating,
}: IdentitySectionProps) {
  const [following, setFollowing] = useState(false)
  const [activeHero, setActiveHero] = useState(0)
  const heroRowRef = useRef<HTMLDivElement>(null)

  // Projected season avg if next 3 matches hold current form
  const projSeasonAvg = Math.round(
    (matchAvgs.reduce((a, b) => a + b) + recentAvg * 3) / (matchAvgs.length + 3)
  )
  const projDiff = projSeasonAvg - seasonAvg

  const rankTotal = RANKING_PTS.reduce((a, b) => a + b)

  // The swipeable hero deck — one number per card, Revolut account-card style
  const heroCards: {
    key: HeroMetric; label: string; value: number; delta: number; deltaSuffix: string
    caption: React.ReactNode; color: string; data: number[]; proj?: number
    footer: React.ReactNode; ready?: boolean
  }[] = [
    {
      key: 'snitt', label: 'Säsongssnitt', value: seasonAvg, delta: formDiff, deltaSuffix: ' form',
      caption: <>Top {bkTopPct}% i Elitserien Damer · BK Rating <span style={{ color: INK, fontWeight: 700 }}>{PLAYER_BK_RATING}</span></>,
      color: '#f5c200', data: matchAvgs, proj: recentAvg,
      footer: (
        <>
          <span style={{ fontSize: 11, color: INK4 }}>{MATCHES[0].date}</span>
          <span style={{ fontSize: 12, color: INK3 }}>{MATCHES.length} matcher · förra säsongen {lastSeasonAvg}</span>
          <span style={{ fontSize: 12, color: INK3 }}>
            Prognos <span style={{ fontWeight: 700, color: projDiff >= 0 ? '#5dcaa5' : '#e05555', fontVariantNumeric: 'tabular-nums' }}>{projSeasonAvg}</span>
          </span>
        </>
      ),
    },
    {
      key: 'bk', label: 'BK Rating', value: PLAYER_BK_RATING, delta: PLAYER_BK_RATING - BK_PROGRESS[0], deltaSuffix: ' i år',
      caption: <>Bowlkollens prestationsbetyg · Top {bkTopPct}% i ligan</>,
      color: '#5dcaa5', data: BK_PROGRESS, ready: BK_READY,
      footer: (
        <>
          <span style={{ fontSize: 11, color: INK4 }}>{MATCHES[0].date}</span>
          <span style={{ fontSize: 12, color: INK3 }}>startade på {BK_PROGRESS[0]} · stigit hela säsongen</span>
          <span style={{ fontSize: 11, color: INK4 }}>{MATCHES[MATCHES.length - 1].date}</span>
        </>
      ),
    },
    {
      key: 'ranking', label: 'Rankingpoäng', value: rankTotal, delta: RANKING_PTS[RANKING_PTS.length - 1], deltaSuffix: ' senaste',
      caption: <>Poäng till seriens individuella ranking</>,
      color: '#7ab4e8', data: RANKING_PTS,
      footer: (
        <>
          <span style={{ fontSize: 11, color: INK4 }}>{MATCHES[0].date}</span>
          <span style={{ fontSize: 12, color: INK3 }}>max 8 poäng per match</span>
          <span style={{ fontSize: 11, color: INK4 }}>{MATCHES[MATCHES.length - 1].date}</span>
        </>
      ),
    },
  ]

  const handleHeroScroll = () => {
    const el = heroRowRef.current
    if (!el) return
    const child = el.firstElementChild as HTMLElement | null
    const step = (child?.offsetWidth ?? el.clientWidth) + 24
    setActiveHero(Math.min(heroCards.length - 1, Math.max(0, Math.round(el.scrollLeft / step))))
  }

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

      {/* Hero deck: one number per card — swipe for BK Rating and Rankingpoäng */}
      <div className="hero-in" style={{ marginTop: 24 }}>
        <div ref={heroRowRef} onScroll={handleHeroScroll} className="noscroll"
          style={{ display: 'flex', gap: 24, overflowX: 'auto', scrollSnapType: 'x mandatory',
            margin: '0 -20px', padding: '0 20px',
            scrollbarWidth: 'none' } as React.CSSProperties}>
          {heroCards.map(c => (
            <div key={c.key} style={{ minWidth: '100%', scrollSnapAlign: 'center' }}>
              {c.ready === false ? (
                /* "Kommer snart" launch state — no live number until the engine has data */
                <div onClick={onOpenBkRating} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{c.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 52, fontWeight: 900, color: INK4, letterSpacing: '-0.02em', lineHeight: 1 }}>–</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.color, background: `${c.color}1a`, borderRadius: 999, padding: '4px 12px' }}>Kommer snart</span>
                  </div>
                  <div style={{ fontSize: 13, color: INK2, marginTop: 14, lineHeight: 1.5 }}>
                    BK Rating öppnar när vi har tillräckligt med matchdata för att mäta dig mot fältet. Tryck för att se hur det räknas →
                  </div>
                  <div style={{ marginTop: 16, height: 84, borderRadius: 12, overflow: 'hidden',
                    background: `linear-gradient(180deg, ${c.color}0f, transparent)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="100%" height="84" viewBox="0 0 360 84" preserveAspectRatio="none" style={{ display: 'block' }}>
                      <line x1="2" y1="60" x2="358" y2="60" stroke="rgba(244,245,247,0.10)" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="2" y1="42" x2="358" y2="42" stroke="rgba(244,245,247,0.07)" strokeWidth="1" strokeDasharray="4,4" />
                    </svg>
                  </div>
                </div>
              ) : (
                <>
                  <HeroNumber
                    label={c.label}
                    value={c.value}
                    delta={c.delta}
                    deltaSuffix={c.deltaSuffix}
                    caption={c.caption}
                  />
                  <div onClick={() => c.key === 'bk' ? onOpenBkRating() : onOpenCurve(c.key)}
                    style={{ marginTop: 18, cursor: 'pointer' }}>
                    <HeroCurve data={c.data} seasonAvg={c.key === 'snitt' ? seasonAvg : undefined}
                      projAvg={c.proj} color={c.color} gid={`hero_${c.key}`} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                      {c.footer}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        {/* Deck dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          {heroCards.map((c, i) => (
            <div key={c.key} style={{ height: 6, borderRadius: 3, transition: 'all 0.25s ease',
              width: i === activeHero ? 18 : 6,
              background: i === activeHero ? 'rgba(244,245,247,0.7)' : 'rgba(244,245,247,0.18)' }} />
          ))}
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
