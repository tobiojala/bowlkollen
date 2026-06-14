'use client'

import React from 'react'
import Link from 'next/link'
import { shortName } from '@/lib/utils'
import { divisionColor, divisionShort } from '@/lib/divisions'
import { useColors } from '@/components/ThemeProvider'

type Team = { id: string; name: string; club?: string }

type Props = {
  home: Team
  away: Team
  homeScore: number | null
  awayScore: number | null
  homePins: number
  awayPins: number
  status: 'live' | 'completed' | 'upcoming'
  division: string
  round?: number | null
  date: string
  venue?: string | null
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

  // Design-language palette — near-black tonal, gold budget. No per-team hues.
  const win    = isDark ? '#f4f5f7' : '#1a2535'              // winner / primary ink
  const muted  = isDark ? 'rgba(244,245,247,0.40)' : 'rgba(0,0,0,0.42)'
  const faint  = isDark ? 'rgba(244,245,247,0.24)' : 'rgba(0,0,0,0.28)'
  const gold   = '#f5c200'
  const green  = '#5dcaa5'
  // Gold marks the live/now focal point; a settled win reads as a positive (green).
  const resultC = isLive ? gold : green
  const pillBg = isDark ? 'rgba(244,245,247,0.06)' : 'rgba(0,0,0,0.05)'
  const divC   = divisionColor(division, isDark ? 'dark' : 'light')

  // Calm tonal elevation: a single step up from the page, fading back down.
  // Gold (the result) is the only saturated thing in the frame.
  const heroGrad = isDark
    ? 'linear-gradient(180deg, #14171c 0%, #0b0d10 100%)'
    : 'linear-gradient(180deg, #ffffff 0%, #f5f2ec 100%)'

  const dateStr = date ? new Date(date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }) : ''
  const timeStr = date ? new Date(date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <section style={{ background: heroGrad, paddingBottom: 24 }}>

      {/* Top bar: division + round + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 0', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: divC,
          background: pillBg, borderRadius: 999, padding: '3px 9px',
        }}>
          {divisionShort(division)}
        </span>
        {round && (
          <span style={{ fontSize: 11, color: muted }}>Omgång {round}</span>
        )}
        <div style={{ marginLeft: 'auto' }}>
          {isLive && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, color: gold, letterSpacing: '0.08em',
            }}>
              <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: gold }} />
              LIVE
            </span>
          )}
          {status === 'upcoming' && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: muted,
              background: pillBg, borderRadius: 999,
              padding: '4px 10px', letterSpacing: '0.08em',
            }}>
              KOMMANDE
            </span>
          )}
          {status === 'completed' && (
            <span style={{ fontSize: 10, fontWeight: 700, color: faint, letterSpacing: '0.08em' }}>
              AVSLUTAD
            </span>
          )}
        </div>
      </div>

      {/* Score block */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        gap: 8, padding: '28px 16px 20px', alignItems: 'center',
      }}>

        {/* Home team */}
        <Link href={'/teams/' + home.id} style={{ textDecoration: 'none' }}>
          <div style={{
            fontSize: 15, fontWeight: hasScore ? (homeWin ? 800 : 500) : 700,
            color: hasScore ? (homeWin ? win : muted) : win,
            lineHeight: 1.2, textAlign: 'right', letterSpacing: -0.2,
          }}>
            {shortName(home.name)}
          </div>
          <div style={{ fontSize: 10, color: faint, textAlign: 'right', marginTop: 4, letterSpacing: '0.04em' }}>
            Hemmalag
          </div>
        </Link>

        {/* Central score */}
        <div style={{ textAlign: 'center', minWidth: 96 }}>
          {hasScore ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
                <span className="num" style={{ fontSize: 68, fontWeight: 900, lineHeight: 1, color: homeWin ? resultC : faint }}>
                  {homeScore}
                </span>
                <span style={{ fontSize: 20, color: faint, fontWeight: 300, marginBottom: 4 }}>–</span>
                <span className="num" style={{ fontSize: 68, fontWeight: 900, lineHeight: 1, color: awayWin ? resultC : faint }}>
                  {awayScore}
                </span>
              </div>
              <div style={{ fontSize: 9, color: muted, letterSpacing: '0.12em', marginTop: 6 }}>
                MATCHPOÄNG
              </div>
              {homePins > 0 && (
                <div style={{
                  marginTop: 8, fontSize: 12, color: muted, fontVariantNumeric: 'tabular-nums',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <span className="num" style={{ fontSize: 14, color: homeWin ? win : muted }}>{homePins.toLocaleString('sv')}</span>
                  <span style={{ opacity: 0.4 }}>–</span>
                  <span className="num" style={{ fontSize: 14, color: awayWin ? win : muted }}>{awayPins.toLocaleString('sv')}</span>
                  <span style={{ fontSize: 10, opacity: 0.6 }}>pins</span>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 22, color: faint, fontWeight: 300, letterSpacing: 4 }}>vs</div>
          )}
        </div>

        {/* Away team */}
        <Link href={'/teams/' + away.id} style={{ textDecoration: 'none' }}>
          <div style={{
            fontSize: 15, fontWeight: hasScore ? (awayWin ? 800 : 500) : 700,
            color: hasScore ? (awayWin ? win : muted) : win,
            lineHeight: 1.2, letterSpacing: -0.2,
          }}>
            {shortName(away.name)}
          </div>
          <div style={{ fontSize: 10, color: faint, marginTop: 4, letterSpacing: '0.04em' }}>
            Bortalag
          </div>
        </Link>
      </div>

      {/* Date + venue strip */}
      {(dateStr || venue) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '0 16px', flexWrap: 'wrap',
        }}>
          {dateStr && (
            <span style={{ fontSize: 11, color: muted, textTransform: 'capitalize' }}>
              {dateStr}{timeStr ? ` · ${timeStr}` : ''}
            </span>
          )}
          {venue && (
            <span style={{ fontSize: 11, color: faint }}>· {venue}</span>
          )}
        </div>
      )}
    </section>
  )
}
