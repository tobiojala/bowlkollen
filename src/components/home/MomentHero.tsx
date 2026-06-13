'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { dark } from '@/lib/colors'
import { shortName } from '@/lib/utils'
import { countdown } from '@/app/home/helpers'
import type { Moment } from '@/app/home/moments'

const ROTATE_MS = 6500

// The lead story on the homepage. Picks the most relevant moment, renders it
// big and emotional, and auto-rotates through the rest. Tap a dot to pin one.
export default function MomentHero({ moments, C, isDark, now, sample }: {
  moments: Moment[]
  C: typeof dark
  isDark: boolean
  now: number
  sample?: boolean   // true → these are example stories shown before real data exists
}) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const stuck = useRef(false)

  // Keep index valid if the moment list changes underneath us.
  const safe = Math.min(idx, Math.max(0, moments.length - 1))
  const m = moments[safe]

  useEffect(() => {
    if (paused || stuck.current || moments.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % moments.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [paused, moments.length])

  if (!m) return null

  // hue-driven palette so each kind of story has its own colour signature
  const h = m.hue
  const glow = `hsl(${h}, 85%, 62%)`
  const accent = isDark ? `hsl(${h}, 90%, 70%)` : `hsl(${h}, 70%, 42%)`
  const cardBg = isDark
    ? `linear-gradient(135deg, hsla(${h},65%,16%,0.95) 0%, hsla(${h + 18},55%,10%,0.92) 70%, ${C.card} 130%)`
    : `linear-gradient(135deg, hsla(${h},75%,95%,1) 0%, hsla(${h + 18},70%,90%,1) 100%)`
  const border = `hsla(${h}, 65%, 55%, ${isDark ? 0.42 : 0.5})`

  const pin = (i: number) => { stuck.current = true; setIdx(i) }

  return (
    <section
      style={{ padding: '14px 16px 4px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.a
          key={m.id}
          href={m.href}
          initial={{ opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.99 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative',
            display: 'block',
            textDecoration: 'none',
            borderRadius: 20,
            padding: '18px 18px 20px',
            background: cardBg,
            border: `1px solid ${border}`,
            overflow: 'hidden',
            boxShadow: isDark
              ? `0 12px 40px -16px hsla(${h},80%,30%,0.6)`
              : `0 12px 30px -18px hsla(${h},60%,40%,0.5)`,
            WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}
        >
          {/* soft moving glow behind the headline */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0.35 }}
            animate={{ opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: -60, right: -40, width: 220, height: 220,
              borderRadius: '50%', background: `radial-gradient(circle, ${glow}55, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          {/* eyebrow row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, position: 'relative' }}>
            {m.pulse && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1], scale: [1, 0.85, 1] }}
                transition={{ duration: 1.3, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: glow,
                  boxShadow: `0 0 8px ${glow}` }}
              />
            )}
            {m.emoji && !m.pulse && <span style={{ fontSize: 14 }}>{m.emoji}</span>}
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.6, color: accent,
              fontVariantNumeric: 'tabular-nums' }}>
              {m.eyebrow}
            </span>
          </div>

          {/* body: live score / countdown get number treatment, others a headline */}
          {m.match && m.kind === 'live' ? (
            <LiveBody m={m} C={C} accent={accent} />
          ) : m.match && m.kind === 'countdown' ? (
            <CountdownBody m={m} C={C} accent={accent} now={now} />
          ) : (
            <div style={{ fontSize: 23, fontWeight: 900, lineHeight: 1.12, color: C.text,
              letterSpacing: -0.4, position: 'relative' }}>
              {m.headline}
            </div>
          )}

          {m.sub && (
            <div style={{ fontSize: 12.5, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.62)' : C.textMuted,
              marginTop: 8, position: 'relative' }}>
              {m.sub}
            </div>
          )}
        </motion.a>
      </AnimatePresence>

      {/* progress dots — tap to pin a story */}
      {moments.length > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
          {sample && (
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 1.4, color: C.textMuted,
              marginRight: 4, alignSelf: 'center' }}>EXEMPEL</span>
          )}
          {moments.map((mm, i) => (
            <button
              key={mm.id}
              onClick={(e) => { e.preventDefault(); pin(i) }}
              aria-label={`Story ${i + 1}`}
              style={{
                height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0,
                width: i === safe ? 22 : 6,
                background: i === safe ? `hsl(${mm.hue},85%,62%)` : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'),
                transition: 'width 0.3s ease, background 0.3s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function LiveBody({ m, C, accent }: { m: Moment; C: typeof dark; accent: string }) {
  const match = m.match!
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 19, fontWeight: 800, color: C.text, lineHeight: 1.1, flex: 1, minWidth: 0 }}>
          {shortName(match.home.name)}
        </span>
        <span style={{ fontSize: 30, fontWeight: 900, color: accent, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>
          {match.home_score ?? 0}–{match.away_score ?? 0}
        </span>
        <span style={{ fontSize: 19, fontWeight: 800, color: C.text, lineHeight: 1.1, flex: 1, minWidth: 0, textAlign: 'right' }}>
          {shortName(match.away.name)}
        </span>
      </div>
    </div>
  )
}

function CountdownBody({ m, C, accent, now }: { m: Moment; C: typeof dark; accent: string; now: number }) {
  const match = m.match!
  const cd = countdown(match.date, now)
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: C.text, lineHeight: 1.15, letterSpacing: -0.4 }}>
        {shortName(match.home.name)} <span style={{ color: accent }}>⚔</span> {shortName(match.away.name)}
      </div>
      {cd && (
        <div style={{ fontSize: 28, fontWeight: 900, color: accent, fontVariantNumeric: 'tabular-nums',
          marginTop: 6, letterSpacing: -0.5 }}>
          {cd}
        </div>
      )}
    </div>
  )
}
