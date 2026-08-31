'use client'

import { useState } from 'react'
import { CreditCard, Swords, Trophy, Share2, Star, Zap, Flame, Target, Crown } from 'lucide-react'
import ProfileTrend from '@/components/ProfileTrend'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { ActionRow, ActionButton } from '@/components/ui/primitives'
import { cumulativeAvgPoints, rollingRatingPoints, type TrendPoint } from '@/lib/profile'
import type { ProfileData, ProfileIdentity } from '@/lib/profile'
import { COLORS } from '../data'

const { GOLD } = COLORS
const INK  = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.64)'
const INK3 = 'rgba(244,245,247,0.40)'
const INK4 = 'rgba(244,245,247,0.24)'

type HeroMetric = 'snitt' | 'bk' | 'ranking'

export type Achievement = {
  icon: string; title: string; earned: boolean; near: boolean; color: string
}

const BADGE_ICONS = { Star, Lightning: Zap, Trophy, Fire: Flame, Target, Crown } as const
function BadgeIcon({ name, size, color, filled }: { name: string; size: number; color: string; filled?: boolean }) {
  const Icon = BADGE_ICONS[name as keyof typeof BADGE_ICONS]
  return Icon ? <Icon size={size} color={color} fill={filled ? color : 'none'} strokeWidth={2} /> : null
}

interface IdentitySectionProps {
  data: ProfileData
  identity: ProfileIdentity
  bkTopPct: number
  /** Official BITS licence average — primary hero display. Falls back to computed seasonAvg. */
  licenceAverage?: number
  /** Live BK Rating, or null for the "kommer snart" launch state. */
  bkRating: number | null
  level?: { level: number } | null
  achievements?: readonly Achievement[]
  /** Curve data for the BK card (when live) and the ranking card (when present). */
  bkProgress?: number[]
  rankingPts?: number[]
  /** When the viewer owns this profile, hide the follow button. */
  isOwner?: boolean
  /** The live route renders its own real FollowButton — set false to drop this
   * placeholder one (avoids two follow buttons). Defaults true for the mockup. */
  showFollow?: boolean
  onOpenCurve: (metric?: HeroMetric) => void
  onOpenChallenges: () => void
  onOpenBkRating: () => void
  /** Optional real-action handlers wired by the live route (no-op in the mockup). */
  onOpenCard?: () => void
  onOpenH2H?: () => void
  onShare?: () => void
  /** public_id of the profile's player — resolves their approved photo. */
  avatarPublicId?: string
}

export default function IdentitySection({
  data, identity, bkTopPct, licenceAverage, bkRating, level, achievements = [],
  bkProgress, rankingPts, isOwner = false, showFollow = true,
  onOpenCurve, onOpenChallenges, onOpenBkRating, onOpenCard, onOpenH2H, onShare, avatarPublicId,
}: IdentitySectionProps) {
  const [following, setFollowing] = useState(false)
  const [activeHero, setActiveHero] = useState(0)

  const { seasonAvg, recentAvg, lastSeasonAvg, projSeasonAvg, matches } = data

  // Trend lines mirror native ProfileTrend: snitt = our running league-series
  // average, BK = rolling rating recomputed each match, ranking = raw per-match points.
  const snittPoints = cumulativeAvgPoints(matches)
  const bkPoints    = rollingRatingPoints(matches)
  const rankingPoints: TrendPoint[] = (rankingPts ?? []).map((v, i) => ({
    avg: v, date: matches[i]?.date ?? '', label: matches[i]?.opp ?? '',
  }))

  type HeroCard = {
    key: HeroMetric; label: string; value: number; delta: number; deltaSuffix: string
    caption: string; color: string; points: TrendPoint[]
    baseline?: number; proj?: number
    footerLeft: string; footerRight?: string; ready?: boolean
  }

  const heroCards: HeroCard[] = [
    {
      // The curve is OUR running league-series average, so the card headline is
      // our seriesnitt (matches the curve tail). BITS' official snitt is a broader,
      // scalar figure — surfaced in the caption, never conflated with this curve.
      key: 'snitt', label: 'Seriesnitt', value: seasonAvg, delta: recentAvg - seasonAvg, deltaSuffix: 'form',
      caption: [
        licenceAverage != null ? `BITS-snitt ${licenceAverage}` : null,
        `Topp ${bkTopPct}% i ligan`,
      ].filter(Boolean).join(' · '),
      color: '#f5c200', points: snittPoints, baseline: seasonAvg, proj: projSeasonAvg,
      footerLeft: `${matches.length} matcher`,
      footerRight: lastSeasonAvg ? `Förra säsongen ${lastSeasonAvg}` : undefined,
    },
    {
      key: 'bk', label: 'BK Rating', value: bkRating ?? 0,
      delta: bkRating !== null && bkPoints.length ? bkRating - bkPoints[0].avg : 0, deltaSuffix: 'i år',
      caption: `Bowlkollens prestationsbetyg · Topp ${bkTopPct}% i ligan`,
      color: '#30d47e', points: bkPoints, ready: bkRating !== null,
      footerLeft: 'Betyg 0–100 mot fältet', footerRight: `Topp ${bkTopPct}%`,
    },
    ...(rankingPts?.length ? [{
      key: 'ranking' as const, label: 'Rankingpoäng', value: rankingPts.reduce((a, b) => a + b),
      delta: rankingPts[rankingPts.length - 1], deltaSuffix: 'senaste',
      caption: 'Poäng till seriens individuella ranking',
      color: '#9ca5b3', points: rankingPoints,
      footerLeft: 'Max 8 poäng per match',
    }] : []),
  ]

  const visibleAchievements = achievements.filter(a => a.earned || a.near)

  return (
    <div style={{ padding: '20px 20px 0' }}>

      {/* Identity header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <PlayerAvatar publicId={avatarPublicId} name={identity.name} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.15 }}>{identity.name}</div>
          <div style={{ fontSize: 13, color: INK2, marginTop: 3 }}>{identity.teamLabel}</div>
        </div>
        {!isOwner && showFollow && (
          <button onClick={() => setFollowing(f => !f)}
            style={{ flexShrink: 0, minHeight: 40, padding: '0 18px', borderRadius: 999, cursor: 'pointer', border: 'none',
              background: following ? '#1c2127' : INK,
              color: following ? INK2 : '#0b0d10', fontSize: 13, fontWeight: 700,
              transition: 'background 0.15s, color 0.15s' }}>
            {following ? 'Följer' : 'Följ'}
          </button>
        )}
      </div>
      <div style={{ fontSize: 13, color: INK3, padding: '8px 0 0 62px' }}>
        <span style={{ color: INK2, fontWeight: 600 }}>{(identity.followers + (following ? 1 : 0)).toLocaleString('sv-SE')}</span> följare
        <span style={{ padding: '0 6px', color: INK4 }}>·</span>
        <span style={{ color: INK2, fontWeight: 600 }}>{identity.following}</span> följer
      </div>

      {/* Level + achievement chips — quiet, tonal; gold only when nearly earned */}
      {(level || visibleAchievements.length > 0) && (
        <div className="noscroll" style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', scrollbarWidth: 'none' } as React.CSSProperties}>
          {level && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 999,
              background: '#14171c', color: INK2 }}>
              <Zap size={11} color={INK2} />Nivå {level.level}
            </span>
          )}
          {visibleAchievements.map((a, i) => (
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
      )}

      {/* Hero deck: a pill toggle over one card at a time — tap, don't swipe, so
          each card's graph keeps its horizontal drag-scrub (parity with native
          HeroDeck). */}
      <div className="hero-in" style={{ marginTop: 24 }}>
        {heroCards.length > 1 && (
          <div style={{ display: 'flex', gap: 4, width: 'fit-content', margin: '0 auto 16px',
            background: '#14171c', borderRadius: 999, padding: 4 }}>
            {heroCards.map((c, i) => (
              <button key={c.key} onClick={() => setActiveHero(i)} aria-label={c.label}
                style={{ border: 'none', cursor: 'pointer', minHeight: 40, padding: '0 16px', borderRadius: 999,
                  background: i === activeHero ? '#1c2127' : 'transparent',
                  color: i === activeHero ? INK : INK3, fontSize: 13, fontWeight: 600,
                  transition: 'background 0.15s, color 0.15s' }}>
                {c.label}
              </button>
            ))}
          </div>
        )}
        {[heroCards[activeHero]].map(c => (
            <div key={c.key}>
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
                    background: `linear-gradient(180deg, ${c.color}0f, transparent)` }}>
                    <svg width="100%" height="84" viewBox="0 0 360 84" preserveAspectRatio="none" style={{ display: 'block' }}>
                      <line x1="2" y1="60" x2="358" y2="60" stroke="rgba(244,245,247,0.10)" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="2" y1="42" x2="358" y2="42" stroke="rgba(244,245,247,0.07)" strokeWidth="1" strokeDasharray="4,4" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div onClick={() => c.key === 'bk' ? onOpenBkRating() : onOpenCurve(c.key)}
                  style={{ cursor: 'pointer' }}>
                  <ProfileTrend
                    points={c.points}
                    label={c.label}
                    restValue={c.value}
                    delta={c.delta}
                    deltaSuffix={c.deltaSuffix}
                    caption={c.caption}
                    accent={c.color}
                    baseline={c.baseline}
                    projValue={c.proj}
                    footerLeft={c.footerLeft}
                    footerRight={c.footerRight}
                    lineWidth={5}
                    tailLength={9}
                    yPad={0.05}
                  />
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Action row */}
      <ActionRow className="mt-6 -mx-1">
        <ActionButton icon={CreditCard} label="Spelarkort" onClick={onOpenCard} />
        <ActionButton icon={Swords}     label="H2H"        onClick={onOpenH2H} />
        <ActionButton icon={Trophy}     label="Utmaningar" onClick={onOpenChallenges} />
        <ActionButton icon={Share2}     label="Dela"       onClick={onShare} />
      </ActionRow>
    </div>
  )
}
