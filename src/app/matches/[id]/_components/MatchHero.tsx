'use client'

import React from 'react'
import Link from 'next/link'
import { shortName } from '@/lib/utils'
import { divisionColor } from '@/lib/divisions'
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

function teamHue(name: string) {
  return name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
}

export default function MatchHero({
  home, away, homeScore, awayScore, homePins, awayPins,
  status, division, round, date, venue,
}: Props) {
  const { C, isDark } = useColors()

  const homeWin  = homeScore !== null && awayScore !== null && homeScore > awayScore
  const awayWin  = homeScore !== null && awayScore !== null && awayScore > homeScore
  const hasScore = homeScore !== null && awayScore !== null
  const isLive   = status === 'live'

  const hHue = teamHue(home.name)
  const aHue = teamHue(away.name)
  const divC = divisionColor(division)

  const dateStr = date ? new Date(date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }) : ''
  const timeStr = date ? new Date(date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : ''

  // Gradient blends home team hue (left) into away team hue (right)
  const heroGrad = isDark
    ? `linear-gradient(135deg, hsl(${hHue},45%,7%) 0%, hsl(${(hHue + aHue) / 2},40%,10%) 50%, hsl(${aHue},45%,7%) 100%)`
    : `linear-gradient(135deg, hsl(${hHue},30%,91%) 0%, hsl(${(hHue + aHue) / 2},24%,94%) 50%, hsl(${aHue},30%,91%) 100%)`

  const overlay = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,'

  return (
    <section style={{ background: heroGrad, paddingBottom: 24 }}>

      {/* Top bar: division + status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 16px 0', flexWrap: 'wrap' as const,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: divC,
          background: divC + (isDark ? '18' : '22'),
          borderRadius: 6, padding: '3px 8px',
        }}>
          {division}
        </span>
        {round && (
          <span style={{ fontSize: 11, color: overlay + '0.45)' }}>
            Omgång {round}
          </span>
        )}
        <div style={{ marginLeft: 'auto' }}>
          {isLive && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, fontWeight: 800, color: '#e05555',
              background: 'rgba(224,85,85,0.14)', borderRadius: 20,
              padding: '4px 10px', letterSpacing: '0.08em',
            }}>
              <span className="live-dot" style={{ background: '#e05555' }} />
              LIVE
            </span>
          )}
          {status === 'upcoming' && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#7ab4e8',
              background: 'rgba(122,180,232,0.14)', borderRadius: 20,
              padding: '4px 10px', letterSpacing: '0.08em',
            }}>
              KOMMANDE
            </span>
          )}
          {status === 'completed' && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: overlay + '0.38)',
              letterSpacing: '0.08em',
            }}>
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
            color: hasScore ? (homeWin ? (isDark ? '#fff' : '#111') : overlay + '0.45)') : (isDark ? '#e8edf5' : '#1a2535'),
            lineHeight: 1.2, textAlign: 'right',
          }}>
            {shortName(home.name)}
          </div>
          <div style={{ fontSize: 10, color: overlay + '0.38)', textAlign: 'right', marginTop: 4, letterSpacing: '0.04em' }}>
            Hemmalag
          </div>
        </Link>

        {/* Central score */}
        <div style={{ textAlign: 'center', minWidth: 96 }}>
          {hasScore ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span className="num" style={{
                  fontSize: 68, lineHeight: 1,
                  color: homeWin ? (isDark ? '#ffffff' : '#111') : overlay + '0.30)',
                }}>
                  {homeScore}
                </span>
                <span style={{ fontSize: 20, color: overlay + '0.25)', fontWeight: 300, marginBottom: 4 }}>–</span>
                <span className="num" style={{
                  fontSize: 68, lineHeight: 1,
                  color: awayWin ? (isDark ? '#ffffff' : '#111') : overlay + '0.30)',
                }}>
                  {awayScore}
                </span>
              </div>
              <div style={{ fontSize: 9, color: overlay + '0.35)', letterSpacing: '0.12em', marginTop: 6 }}>
                MATCHPOÄNG
              </div>
              {homePins > 0 && (
                <div style={{
                  marginTop: 8, fontSize: 12, color: overlay + '0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <span className="num" style={{ fontSize: 14, color: homeWin ? (isDark ? '#e8edf5' : '#222') : overlay + '0.35)' }}>{homePins.toLocaleString('sv')}</span>
                  <span style={{ opacity: 0.4 }}>–</span>
                  <span className="num" style={{ fontSize: 14, color: awayWin ? (isDark ? '#e8edf5' : '#222') : overlay + '0.35)' }}>{awayPins.toLocaleString('sv')}</span>
                  <span style={{ fontSize: 10, opacity: 0.4 }}>pins</span>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 22, color: overlay + '0.28)', fontWeight: 300, letterSpacing: 4 }}>vs</div>
          )}
        </div>

        {/* Away team */}
        <Link href={'/teams/' + away.id} style={{ textDecoration: 'none' }}>
          <div style={{
            fontSize: 15, fontWeight: hasScore ? (awayWin ? 800 : 500) : 700,
            color: hasScore ? (awayWin ? (isDark ? '#fff' : '#111') : overlay + '0.45)') : (isDark ? '#e8edf5' : '#1a2535'),
            lineHeight: 1.2,
          }}>
            {shortName(away.name)}
          </div>
          <div style={{ fontSize: 10, color: overlay + '0.38)', marginTop: 4, letterSpacing: '0.04em' }}>
            Bortalag
          </div>
        </Link>
      </div>

      {/* Date + venue strip */}
      {(dateStr || venue) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '0 16px',
          flexWrap: 'wrap' as const,
        }}>
          {dateStr && (
            <span style={{ fontSize: 11, color: overlay + '0.42)', textTransform: 'capitalize' as const }}>
              {dateStr}{timeStr ? ` · ${timeStr}` : ''}
            </span>
          )}
          {venue && (
            <span style={{ fontSize: 11, color: overlay + '0.38)' }}>
              · {venue}
            </span>
          )}
        </div>
      )}
    </section>
  )
}
