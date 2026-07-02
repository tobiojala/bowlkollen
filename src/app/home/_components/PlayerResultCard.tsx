'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { SCORE } from '@/lib/constants'
import { FeedActions } from '@/components/FeedActions'
import type { FeedPlayerResult } from '@/lib/types'

export function PlayerResultCard({ item }: { item: FeedPlayerResult }) {
  const dateStr  = new Date(item.date + 'T12:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
  const isGold   = item.total >= SCORE.SERIES_HIGH
  const isStrong = !isGold && item.total >= SCORE.SERIES_STRONG
  const accent   = isGold ? COLOR.gold : isStrong ? COLOR.green : COLOR.ink

  const avg      = item.games.length > 0 ? Math.round(item.total / item.games.length) : 0
  const highGame = item.games.length > 0 ? Math.max(...item.games) : 0

  return (
    <div style={{ borderBottom: `1px solid ${COLOR.hairline}` }}>
    <Link href={`/players/${item.playerId}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          padding: `${SPACE[3]}px ${SPACE[4]}px ${SPACE[3]}px`,
          transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >
        {/* Date + name — tighter now that SPELARE label is gone */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SPACE[2] }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLOR.ink, lineHeight: 1.3, letterSpacing: '-0.02em' }}>
            {item.playerName}
          </div>
          <span style={{ fontSize: TYPE.label, color: COLOR.ink2, flexShrink: 0, marginLeft: SPACE[3] }}>{dateStr}</span>
        </div>

        {/* Hero score */}
        <div style={{ margin: `${SPACE[2]}px 0 0` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontFamily: FONT.display, fontSize: 42, fontWeight: 900,
              lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
              color: accent,
            }}>
              {item.total}
            </span>
            <span style={{ fontSize: TYPE.caption, fontWeight: 600, color: COLOR.ink3 }}>pins</span>
          </div>

          <span style={{ fontSize: TYPE.caption, fontWeight: 600, color: COLOR.ink2, display: 'block', marginTop: SPACE[1] }}>
            {item.division}
          </span>

          {/* Opponent + average */}
          <span style={{
            fontSize: TYPE.caption, color: COLOR.ink2,
            display: 'block', marginTop: SPACE[2],
          }}>
            {item.opponent ? `mot ${item.opponent} · ` : ''}snitt{' '}
            <span style={{ color: COLOR.ink, fontFamily: FONT.display, fontWeight: 700 }}>{avg}</span>
          </span>
        </div>

        {/* Game bars */}
        {item.games?.length > 0 && (
          <div style={{ marginTop: SPACE[6] }}>
            {/* Bars — stagger spring rise from bottom */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              {item.games.map((g, i) => {
                const bh    = Math.max(6, ((g - 150) / 150) * 48)
                const bCol  = g >= SCORE.ELITE ? COLOR.gold : COLOR.ink
                const delay = 0.1 + i * 0.07
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[2] }}>
                    <motion.div
                      style={{
                        width: 44, height: bh,
                        borderRadius: '4px 4px 0 0',
                        background: bCol,
                        transformOrigin: 'bottom',
                      }}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ type: 'spring', stiffness: 100, damping: 12, delay }}
                    />
                    {/* Game score — TYPE.caption so it's actually readable */}
                    <motion.span
                      style={{
                        fontSize: TYPE.caption, fontWeight: 700,
                        fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums',
                        color: bCol,
                      }}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.25, delay: delay + 0.22 }}
                    >
                      {g}
                    </motion.span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Link>

    <FeedActions
      followType="player"
      followId={item.playerId}
      saveKey={`player_${item.playerId}_${item.matchId}`}
      shareTitle={`${item.playerName} · ${item.total} pins`}
      shareUrl={`/players/${item.playerId}`}
    />
    </div>
  )
}
