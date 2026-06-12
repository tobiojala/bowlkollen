'use client'

import { useState } from 'react'
import { CreditCard, Swords, TrendingUp, TrendingDown } from 'lucide-react'
import {
  LightningIcon, StarIcon, TrophyIcon, FireIcon, TargetIcon, CrownIcon,
} from '@phosphor-icons/react'
import { MiniCurve } from '@/components/mockup/Curves'
import { stdDev } from '../helpers'
import { ACHIEVEMENTS, MOCK_FOLLOWERS, PLAYER_LEVEL, PLAYER_BK_RATING, MATCHES, COLORS } from '../data'

const { GOLD, GREEN, MUTED } = COLORS

const BADGE_ICONS = {
  Star:      StarIcon,
  Lightning: LightningIcon,
  Trophy:    TrophyIcon,
  Fire:      FireIcon,
  Target:    TargetIcon,
  Crown:     CrownIcon,
} as const
type BadgeIconName = keyof typeof BADGE_ICONS

function BadgeIcon({ name, size, color, weight = 'duotone' }: {
  name: string; size: number; color: string; weight?: 'duotone' | 'fill' | 'bold' | 'regular'
}) {
  const Icon = BADGE_ICONS[name as BadgeIconName]
  return Icon ? <Icon size={size} color={color} weight={weight} /> : null
}

interface IdentitySectionProps {
  matchAvgs: number[]
  seasonAvg: number
  formDiff: number
  recentAvg: number
  lastSeasonAvg: number
  bkBarPct: number
  bkTopPct: number
  onOpenCurve: () => void
}

export default function IdentitySection({
  matchAvgs, seasonAvg, formDiff, recentAvg, lastSeasonAvg,
  bkBarPct, bkTopPct, onOpenCurve,
}: IdentitySectionProps) {
  const [following, setFollowing] = useState(false)

  const allGames  = MATCHES.flatMap(m => m.games)
  const over200   = allGames.filter(g => g >= 200).length
  const sd        = stdDev(allGames)
  const consistency = sd < 20 ? 'Konsekvent' : sd < 30 ? 'Stabil' : sd < 40 ? 'Varierad' : 'Explosiv'
  const hitRate   = Math.round(over200 / allGames.length * 100)

  // Projected season avg if next 3 matches equal current form (recentAvg)
  const projMatchAvg    = recentAvg
  const projSeasonAvg   = Math.round(
    (matchAvgs.reduce((a, b) => a + b) + projMatchAvg * 3) / (matchAvgs.length + 3)
  )
  const projDiff        = projSeasonAvg - seasonAvg

  return (
    <div style={{ padding: '12px 24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.15 }}>Sara Holmberg</div>
          {/* Status badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, padding: '5px 12px', borderRadius: 20,
              background: 'rgba(93,202,165,0.12)', color: GREEN,
              border: '1px solid rgba(93,202,165,0.4)',
              boxShadow: 'inset 0 1px 0 rgba(93,202,165,0.28), 0 0 16px rgba(93,202,165,0.12)' }}>
              PRO
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 800, letterSpacing: 1.2,
              padding: '5px 12px', borderRadius: 20,
              background: 'rgba(245,194,0,0.10)', color: GOLD,
              border: '1px solid rgba(245,194,0,0.38)',
              boxShadow: 'inset 0 1px 0 rgba(245,194,0,0.25), 0 0 16px rgba(245,194,0,0.10)' }}>
              <LightningIcon size={11} weight="fill" color={GOLD} />Nivå {PLAYER_LEVEL.level}
            </span>
          </div>
        </div>
        <button onClick={() => setFollowing(f => !f)}
          style={{ marginTop: 4, flexShrink: 0, padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
            background: following ? 'rgba(255,255,255,0.06)' : 'rgba(93,202,165,0.12)',
            color: following ? MUTED : GREEN, fontSize: 12, fontWeight: 700,
            border: `1px solid ${following ? 'rgba(255,255,255,0.12)' : 'rgba(93,202,165,0.35)'}` }}>
          {following ? 'Följer ✓' : '+ Följ'}
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 6 }}>
        {(MOCK_FOLLOWERS.followers + (following ? 1 : 0)).toLocaleString('sv-SE')} följare · {MOCK_FOLLOWERS.following} följer
      </div>
      <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Örebro BK · Elitserien</div>

      {/* Achievement chips */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {ACHIEVEMENTS.filter(a => a.earned || a.near).map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 20,
            background: a.earned ? `${a.color}12` : 'rgba(245,194,0,0.05)',
            border: `1px solid ${a.earned ? a.color + '40' : 'rgba(245,194,0,0.28)'}`,
            boxShadow: a.earned ? `0 0 12px ${a.color}18` : 'none',
          }}>
            <BadgeIcon name={a.icon} size={11} color={a.earned ? a.color : GOLD} weight={a.earned ? 'fill' : 'duotone'} />
            <span style={{ fontSize: 10, fontWeight: 700, color: a.earned ? a.color : `${GOLD}bb` }}>{a.title}</span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button style={{ padding: '8px 18px', borderRadius: 20, cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 7,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }}>
          <CreditCard size={13} /> Spelarkort
        </button>
        <button style={{ padding: '8px 18px', borderRadius: 20, cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 7,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }}>
          <Swords size={13} /> H2H
        </button>
      </div>

      {/* BK Rating */}
      <div className="glass-row" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', padding: '14px 16px', marginTop: 16 }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(135deg, rgba(93,202,165,0.12) 0%, rgba(93,202,165,0.04) 50%, transparent 75%)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: 1.5, marginBottom: 4 }}>BK RATING</div>
            <div className="num" style={{ fontSize: 46, color: GREEN }}>{PLAYER_BK_RATING}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ position: 'relative', height: 6, borderRadius: 4,
              background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${bkBarPct}%`, borderRadius: 4,
                background: 'linear-gradient(90deg, rgba(93,202,165,0.3), rgba(93,202,165,0.7))' }} />
              <div style={{
                position: 'absolute', top: '50%', left: `${bkBarPct}%`,
                width: 12, height: 12, borderRadius: '50%',
                background: GREEN, transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 10px rgba(93,202,165,0.9)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Lägst</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Högst</span>
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div className="num" style={{ fontSize: 22, color: GREEN }}>Top {bkTopPct}%</div>
            <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>Elitserien Damer</div>
          </div>
        </div>
      </div>

      {/* PRESTANDA header */}
      <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: 1.5 }}>PRESTANDA</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Säsongskurva */}
      <div role="button" onClick={onOpenCurve} className="glass-row" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', padding: '18px 18px 0', cursor: 'pointer' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(160deg, rgba(245,194,0,0.10) 0%, rgba(245,194,0,0.03) 45%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: 1.5, marginBottom: 8 }}>SÄSONGSKURVA</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="num" style={{ fontSize: 46, color: 'rgba(255,255,255,0.95)', lineHeight: 1 }}>{seasonAvg}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: formDiff > 0 ? GREEN : '#e05555' }}>
                  {formDiff > 0 ? '+' : ''}{formDiff} form
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {/* Projected avg badge */}
              <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 4 }}>PROGNOS</div>
              <div className="num" style={{ fontSize: 20, color: projDiff > 0 ? GREEN : projDiff < 0 ? '#e05555' : MUTED }}>
                {projSeasonAvg}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>
                {projDiff > 0 ? `+${projDiff}` : projDiff} · 3 matcher
              </div>
            </div>
          </div>
          <MiniCurve matchAvgs={matchAvgs} seasonAvg={seasonAvg} projAvg={projMatchAvg} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 2px 14px' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)' }}>{MATCHES[0].date}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)' }}>{MATCHES[MATCHES.length - 1].date}</span>
          </div>
        </div>
      </div>

      {/* 2×2 stat hero cards */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* SNITT */}
          <div role="button" onClick={onOpenCurve} className="glass-row" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', padding: '16px 14px 14px', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 65%)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: 1.5, marginBottom: 10 }}>SNITT</div>
              <div className="num" style={{ fontSize: 46, color: 'rgba(255,255,255,0.95)', lineHeight: 1 }}>{seasonAvg}</div>
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 24, marginTop: 14 }}>
                {matchAvgs.slice(-10).map((avg, i) => {
                  const mn = Math.min(...matchAvgs), mx = Math.max(...matchAvgs)
                  const h = 5 + ((avg - mn) / (mx - mn || 1)) * 19
                  return <div key={i} style={{ flex: 1, height: h, borderRadius: 2,
                    background: avg >= seasonAvg ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)' }} />
                })}
              </div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>
                {MATCHES.length} matcher · <span style={{ color: 'rgba(255,255,255,0.3)' }}>{lastSeasonAvg} förra</span>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div role="button" onClick={onOpenCurve} className="glass-row" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', padding: '16px 14px 14px', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `linear-gradient(135deg, ${formDiff > 0 ? 'rgba(93,202,165,0.14)' : 'rgba(224,85,85,0.14)'} 0%, transparent 65%)` }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: 1.5, marginBottom: 10 }}>FORM</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {formDiff > 0
                  ? <TrendingUp size={16} color={GREEN} />
                  : <TrendingDown size={16} color="#e05555" />}
                <div className="num" style={{ fontSize: 46, color: formDiff > 0 ? GREEN : '#e05555', lineHeight: 1 }}>
                  {formDiff > 0 ? `+${formDiff}` : formDiff}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 24, marginTop: 14 }}>
                {MATCHES.slice(-4).map((m, i) => {
                  const avg = Math.round(m.games.reduce((a, b) => a + b) / m.games.length)
                  const h = 8 + ((avg - 150) / 120) * 16
                  return <div key={i} style={{ flex: 1, height: Math.max(4, h), borderRadius: 2,
                    background: avg >= seasonAvg ? `${GREEN}88` : 'rgba(255,255,255,0.12)' }} />
                })}
              </div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.62)', fontWeight: 700 }}>{recentAvg}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>vs</span>
                <span>{seasonAvg}</span>
              </div>
            </div>
          </div>

          {/* TRÄFF */}
          <div role="button" onClick={onOpenCurve} className="glass-row" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', padding: '16px 14px 14px', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(135deg, rgba(245,194,0,0.12) 0%, transparent 65%)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: 1.5, marginBottom: 10 }}>TRÄFF</div>
              <div className="num" style={{ fontSize: 46, color: GOLD, lineHeight: 1 }}>{hitRate}%</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 14 }}>
                {allGames.slice(-20).map((g, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: 2,
                    background: g >= 200 ? 'rgba(245,194,0,0.72)' : 'rgba(255,255,255,0.09)' }} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>
                {over200} av {allGames.length} spel ≥200p
              </div>
            </div>
          </div>

          {/* KARAKTÄR */}
          <div role="button" onClick={onOpenCurve} className="glass-row" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', padding: '16px 14px 14px', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 65%)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: 1.5, marginBottom: 10 }}>KARAKTÄR</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'rgba(255,255,255,0.92)', lineHeight: 1.1 }}>{consistency}</div>
              <div style={{ position: 'relative', height: 28, marginTop: 14 }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%',
                  height: 1, background: 'rgba(255,255,255,0.08)', transform: 'translateY(-50%)' }} />
                {allGames.slice(-12).map((g, i) => {
                  const mn = Math.min(...allGames), mx = Math.max(...allGames)
                  const pct = (g - mn) / (mx - mn || 1) * 92
                  return (
                    <div key={i} style={{
                      position: 'absolute', top: '50%', left: `${pct}%`,
                      width: 6, height: 6, borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: g >= seasonAvg ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)',
                    }} />
                  )
                })}
              </div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>±{sd}p std.avv.</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
