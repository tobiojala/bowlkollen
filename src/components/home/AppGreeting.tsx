'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useColors } from '@/components/ThemeProvider'
import BottomSheet from '@/components/BottomSheet'
import LiveHero from './LiveHero'
import { countdown, shortName } from '@/lib/utils'
import type { Match } from '@/lib/types'
import type { SportConfig } from '@/lib/sport-config'

const DAY_LABELS = [
  'Söndag',
  'Ny vecka, ny chans',
  'Laddar inför helgen',
  'Mitt i veckan',
  'Nästan helg',
  'Det händer snart',
  'Helg',
] as const

function timeGreeting(hour: number): string {
  if (hour < 5)  return 'Sent uppe'
  if (hour < 12) return 'God morgon'
  if (hour < 18) return 'Hej'
  return 'God kväll'
}

// Expanding ring — three of these staggered make the live halo
function Ripple({ delay }: { delay: number }) {
  return (
    <motion.div
      animate={{ scale: [1, 4.5], opacity: [0.45, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: '1.5px solid #f5c200',
        pointerEvents: 'none',
      }}
    />
  )
}

type Props = {
  sport: SportConfig
  now: number
  liveCount: number
  liveMatches?: Match[]
  nextMatch?: Match | null
  teamPosition?: number | null
  teamDivision?: string | null
  userName?: string | null
  isMatchDay: boolean
}

export default function AppGreeting({
  sport, now, liveCount, liveMatches = [], nextMatch,
  teamPosition, teamDivision, userName, isMatchDay,
}: Props) {
  const { C, isDark } = useColors()
  const [sheetOpen, setSheetOpen] = useState(false)

  const date     = new Date(now)
  const hour     = date.getHours()
  const dayIdx   = date.getDay()
  const greeting = timeGreeting(hour)
  const dayLine  = isMatchDay ? sport.matchDayLabel : DAY_LABELS[dayIdx]

  const heroType = liveCount > 0   ? 'live'
    : nextMatch                     ? 'countdown'
    : teamPosition != null          ? 'position'
    : 'idle'

  const cd = heroType === 'countdown' && nextMatch ? countdown(nextMatch.date, now) : null

  return (
    <>
      <section style={{
        minHeight: 'calc(100vh - 154px)',
        display: 'flex', flexDirection: 'column',
        padding: '28px 24px 24px',
        position: 'relative',
        // No overflow:hidden here — it blocks touch events in iOS Safari
      }}>

        {/* Ambient orb */}
        <motion.div
          animate={{ x: ['-6%', '8%', '-6%'], y: ['-3%', '7%', '-3%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: '80%', paddingTop: '80%', borderRadius: '50%',
            background: heroType === 'live'
              ? 'radial-gradient(circle,rgba(245,194,0,0.08) 0%,transparent 68%)'
              : heroType === 'countdown'
              ? 'radial-gradient(circle,rgba(91,130,180,0.07) 0%,transparent 68%)'
              : 'radial-gradient(circle,rgba(255,255,255,0.03) 0%,transparent 68%)',
            top: '15%', left: '10%',
            pointerEvents: 'none',
          }}
        />

        {/* ── Greeting ───────────────────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 14, color: C.muted, fontWeight: 500, letterSpacing: 0.3 }}>
            {greeting}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.text, lineHeight: 1.2, marginTop: 2 }}>
            {userName ? `${userName}` : dayLine}
          </div>
          {userName && (
            <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{dayLine}</div>
          )}
        </div>

        {/* ── Hero metric ────────────────────────────────────────────────── */}
        <div style={{
          flex: 1, position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>

          {/* LIVE: tappable big number opens bottom sheet */}
          {heroType === 'live' && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setSheetOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'center', padding: '28px 32px',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',  // removes 300ms iOS tap delay
              } as React.CSSProperties}
            >
              {/* Live dot + 2 expanding rings (GPU-only: scale + opacity) */}
              <div style={{ position: 'relative', width: 14, height: 14, margin: '0 auto 28px' }}>
                <Ripple delay={0} />
                <Ripple delay={1.3} />
                {/* Static dot — no boxShadow animation (not GPU-compositable) */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: '#f5c200',
                }} />
              </div>

              {/* The big number — static color, no textShadow animation */}
              <div
                className="num"
                style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, color: C.text }}
              >
                {liveCount}
              </div>

              <div style={{ fontSize: 14, color: C.muted, marginTop: 14, letterSpacing: 0.3 }}>
                {liveCount === 1 ? sport.eventLabel : sport.eventsLabel} live just nu
              </div>

              {/* Tap hint — breathes to draw attention */}
              <motion.div
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  marginTop: 20, fontSize: 12, fontWeight: 600,
                  color: '#f5c200', letterSpacing: '0.08em',
                }}
              >
                SE MATCHER →
              </motion.div>
            </motion.button>
          )}

          {/* COUNTDOWN: ticking number */}
          {heroType === 'countdown' && nextMatch && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.5, color: C.muted, marginBottom: 22 }}>
                NÄSTA {sport.eventLabel.toUpperCase()} OM
              </div>
              <motion.div
                suppressHydrationWarning
                animate={{ opacity: [1, 0.65, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                className="num"
                style={{
                  fontSize: cd && cd.length <= 5 ? 76 : 54,
                  fontWeight: 900, lineHeight: 1, color: C.text,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {cd ?? 'Nu!'}
              </motion.div>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 18, lineHeight: 1.5 }}>
                {shortName(nextMatch.home?.name ?? '')}
                <span style={{ margin: '0 10px', opacity: 0.3 }}>–</span>
                {shortName(nextMatch.away?.name ?? '')}
              </div>
            </div>
          )}

          {/* POSITION: team rank */}
          {heroType === 'position' && teamPosition != null && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.5, color: C.muted, marginBottom: 22 }}>
                DITT LAG LIGGER
              </div>
              <div className="num" style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, color: C.text }}>
                {teamPosition}
                <span style={{ fontSize: 42, color: C.muted, fontWeight: 600 }}>:a</span>
              </div>
              {teamDivision && (
                <div style={{ fontSize: 14, color: C.muted, marginTop: 18 }}>{teamDivision}</div>
              )}
            </div>
          )}

          {/* IDLE */}
          {heroType === 'idle' && (
            <div style={{ textAlign: 'center' }}>
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 56, lineHeight: 1, marginBottom: 16 }}
              >
                {sport.emoji}
              </motion.div>
              <div style={{ fontSize: 16, color: C.muted }}>Välkommen till {sport.name}</div>
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <motion.div
            animate={{ y: [0, 5, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.10)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.muted, fontSize: 12,
            }}
          >
            ↓
          </motion.div>
        </div>
      </section>

      {/* Live matches sheet — slides up when user taps the "3" */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={`${liveCount} ${liveCount === 1 ? sport.eventLabel : sport.eventsLabel} live`}
      >
        <LiveHero matches={liveMatches} now={now} />
      </BottomSheet>
    </>
  )
}
