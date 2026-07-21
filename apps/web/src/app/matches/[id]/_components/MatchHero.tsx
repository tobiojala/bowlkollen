'use client'

import React from 'react'
import Link from 'next/link'
import { shortName } from '@/lib/utils'
import { divisionColor, divisionShort, getDivision } from '@/lib/divisions'
import { useColors } from '@/components/ThemeProvider'
import { calcMatchpoang } from '@/lib/scoring'

const FONT_D = "var(--font-display, 'Barlow Condensed', system-ui)"
const GOLD   = '#f5c200'
const GREEN  = '#5dcaa5'
const RED    = '#e05555'

type Team = { id: string; name: string; club?: string }

type Props = {
  home: Team; away: Team
  homeScore: number | null; awayScore: number | null
  homePins: number; awayPins: number
  status: 'live' | 'completed' | 'upcoming'
  division: string; round?: number | null
  date: string; venue?: string | null
}

export default function MatchHero({
  home, away, homeScore, awayScore, homePins, awayPins,
  status, division, round, date, venue,
}: Props) {
  const { isDark } = useColors()

  const hasScore = homeScore !== null && awayScore !== null
  const homeWin  = hasScore && (homeScore as number) > (awayScore as number)
  const awayWin  = hasScore && (awayScore as number) > (homeScore as number)
  const isLive   = status === 'live'
  const isUp     = status === 'upcoming'
  const [homeMp, awayMp] = hasScore ? calcMatchpoang(homeScore as number, awayScore as number) : [null, null]

  const ink    = isDark ? '#f4f5f7' : '#1a2535'
  const muted  = isDark ? 'rgba(244,245,247,0.42)' : 'rgba(0,0,0,0.42)'
  const faint  = isDark ? 'rgba(244,245,247,0.22)' : 'rgba(0,0,0,0.22)'
  const pillBg = isDark ? 'rgba(244,245,247,0.06)' : 'rgba(0,0,0,0.05)'
  const divC   = divisionColor(division, isDark ? 'dark' : 'light')
  const tier   = getDivision(division)?.tier ?? 3
  const wash   = tier === 1 ? '50' : tier === 2 ? '36' : '22'
  const heroGrad = isDark
    ? 'linear-gradient(180deg, #14171c 0%, #0b0d10 100%)'
    : 'linear-gradient(180deg, #ffffff 0%, #f5f2ec 100%)'
  const resultC = isLive ? GOLD : GREEN

  const dateStr = date ? new Date(date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }) : ''
  const timeStr = date ? new Date(date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : ''

  // Team name styles: winner bold, loser fades
  const homeNameStyle = {
    fontSize: 20, lineHeight: 1.15, textAlign: 'right' as const,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
    fontWeight: hasScore ? (homeWin ? 900 : 300) : 700,
    color: hasScore ? (homeWin ? ink : faint) : ink,
    letterSpacing: -0.3,
  }
  const awayNameStyle = {
    ...homeNameStyle, textAlign: 'left' as const,
    fontWeight: hasScore ? (awayWin ? 900 : 300) : 700,
    color: hasScore ? (awayWin ? ink : faint) : ink,
  }

  return (
    <section style={{ position: 'relative', paddingBottom: 24, overflow: 'hidden' }}>
      {/* Base gradient */}
      <div style={{ position: 'absolute', inset: 0, background: heroGrad }} />
      {/* Division wash */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${divC}${wash} 0%, transparent 65%)`, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Top bar ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 0', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: divC, background: `${divC}18`, borderRadius: 4, padding: '3px 8px', letterSpacing: 0.8 }}>
            {divisionShort(division)}
          </span>
          {round && <span style={{ fontSize: 11, color: muted }}>Omgång {round}</span>}
          <div style={{ marginLeft: 'auto' }}>
            {isLive && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.08em' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, display: 'block', animation: 'pulse-dot 1.2s ease-in-out infinite' }} />
                LIVE
              </span>
            )}
            {status === 'completed' && (
              <span style={{ fontSize: 10, fontWeight: 700, color: faint, letterSpacing: '0.08em' }}>AVSLUTAD</span>
            )}
          </div>
        </div>

        {/* ── Score grid ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, padding: '24px 16px 16px', alignItems: 'center' }}>

          {/* Home */}
          <Link href={'/teams/' + home.id} style={{ textDecoration: 'none' }}>
            <div style={homeNameStyle}>{shortName(home.name)}</div>
            <div style={{ fontSize: 10, color: faint, textAlign: 'right', marginTop: 4, letterSpacing: '0.04em' }}>Hemmalag</div>
          </Link>

          {/* Central — score, time, or live */}
          <div style={{ textAlign: 'center', minWidth: 90 }}>
            {hasScore ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontFamily: FONT_D, fontSize: 80, fontWeight: 900, lineHeight: 1, color: homeWin ? resultC : faint }}>
                    {homeScore}
                  </span>
                  <span style={{ fontSize: 22, color: faint, fontWeight: 300, marginBottom: 4 }}>–</span>
                  <span style={{ fontFamily: FONT_D, fontSize: 80, fontWeight: 900, lineHeight: 1, color: awayWin ? resultC : faint }}>
                    {awayScore}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: muted, letterSpacing: '0.12em', marginTop: 2 }}>MATCHER</div>
                {homeMp !== null && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '3px 10px', borderRadius: 999, background: pillBg, fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: homeWin ? resultC : muted }}>{homeMp}</span>
                    <span style={{ color: faint, fontWeight: 300 }}>–</span>
                    <span style={{ color: awayWin ? resultC : muted }}>{awayMp}</span>
                    <span style={{ color: muted, fontSize: 9, letterSpacing: '0.08em', marginLeft: 2 }}>MP</span>
                  </div>
                )}
                {homePins > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, color: muted, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontFamily: FONT_D, fontSize: 15, color: homeWin ? ink : muted }}>{homePins.toLocaleString('sv')}</span>
                    <span style={{ opacity: 0.4 }}>–</span>
                    <span style={{ fontFamily: FONT_D, fontSize: 15, color: awayWin ? ink : muted }}>{awayPins.toLocaleString('sv')}</span>
                    <span style={{ fontSize: 10, opacity: 0.6 }}>pins</span>
                  </div>
                )}
              </>
            ) : isLive ? (
              <div style={{ fontSize: 20, color: GOLD, fontWeight: 800, letterSpacing: 2 }}>LIVE</div>
            ) : (
              <div>
                <div style={{ fontFamily: FONT_D, fontSize: 72, fontWeight: 900, lineHeight: 0.9, color: GOLD, letterSpacing: -2, fontVariantNumeric: 'tabular-nums' }}>
                  {timeStr}
                </div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: muted, marginTop: 8, textTransform: 'uppercase' }}>Kommande</div>
              </div>
            )}
          </div>

          {/* Away */}
          <Link href={'/teams/' + away.id} style={{ textDecoration: 'none' }}>
            <div style={awayNameStyle}>{shortName(away.name)}</div>
            <div style={{ fontSize: 10, color: faint, marginTop: 4, letterSpacing: '0.04em' }}>Bortalag</div>
          </Link>
        </div>

        {/* ── Date + venue strip ────────────────────────────────── */}
        {(dateStr || venue) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 16px', flexWrap: 'wrap' }}>
            {dateStr && (
              <span style={{ fontSize: 11, color: muted, textTransform: 'capitalize' }}>
                {dateStr}{(timeStr && !isUp) ? ` · ${timeStr}` : ''}
              </span>
            )}
            {venue && <span style={{ fontSize: 11, color: faint }}>· {venue}</span>}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.1 } }`}</style>
    </section>
  )
}
