'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { SCORE } from '@/lib/constants'
import { FeedActions } from '@/components/FeedActions'
import type { BitsTopScore } from '@/lib/types'

function dateStr(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

export function BitsScoreCard({ item }: { item: BitsTopScore }) {
  const isGold   = item.total >= SCORE.SERIES_HIGH
  const isStrong = !isGold && item.total >= SCORE.SERIES_STRONG
  const accent   = isGold ? COLOR.gold : isStrong ? COLOR.green : COLOR.ink
  const highGame = item.series.length > 0 ? Math.max(...item.series) : 0
  const maxBar   = Math.max(...item.series, 1)

  const gameAvg  = item.series.length > 0 ? item.total / item.series.length : null
  const avgDelta = gameAvg !== null && item.average !== null ? Math.round(gameAvg - item.average) : null

  return (
    <div style={{ borderBottom: `1px solid ${COLOR.hairline}` }}>
      <div style={{ padding: `${SPACE[3]}px ${SPACE[4]}px 0` }}>
        {/* Name + date on same row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SPACE[2] }}>
          {item.publicId ? (
            <Link href={`/players/${item.publicId}`} style={{
              fontSize: 20, fontWeight: 700, color: COLOR.ink, lineHeight: 1.3, letterSpacing: '-0.02em',
              textDecoration: 'none', display: 'inline-block',
            }}>
              {item.playerName}
            </Link>
          ) : (
            <div style={{ fontSize: 20, fontWeight: 700, color: COLOR.ink, lineHeight: 1.3, letterSpacing: '-0.02em' }}>
              {item.playerName}
            </div>
          )}
          <span style={{ fontSize: TYPE.label, color: COLOR.ink2, flexShrink: 0, marginLeft: SPACE[3] }}>
            {dateStr(item.date)}
          </span>
        </div>
      </div>

      <Link href={`/matcher/${item.matchId}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{ padding: `${SPACE[2]}px ${SPACE[4]}px ${SPACE[3]}px`, transition: 'opacity 0.15s ease' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          {/* Hero score */}
          <div style={{ margin: 0 }}>
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
            <span style={{ fontSize: TYPE.caption, color: COLOR.ink2, display: 'block', marginTop: SPACE[2] }}>
              mot {item.opponent}
            </span>
            {avgDelta !== null && (
              <span style={{
                fontSize: TYPE.caption, fontWeight: 700, display: 'block', marginTop: SPACE[2],
                color: avgDelta > 0 ? COLOR.green : avgDelta < 0 ? COLOR.red : COLOR.ink2,
              }}>
                {avgDelta > 0 ? '+' : ''}{avgDelta} mot snitt {item.average}
              </span>
            )}
          </div>

          {/* Serie bars */}
          {item.series.length > 0 && (
            <div style={{ marginTop: SPACE[6] }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                {item.series.map((g, i) => {
                  const bh   = Math.max(6, (g / maxBar) * 48)
                  const bCol = g >= SCORE.ELITE ? COLOR.gold : COLOR.ink
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[2] }}>
                      <motion.div
                        style={{ width: 44, height: bh, borderRadius: '4px 4px 0 0', background: bCol, transformOrigin: 'bottom' }}
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ type: 'spring', stiffness: 100, damping: 12, delay: 0.1 + i * 0.07 }}
                      />
                      <motion.span
                        style={{ fontSize: TYPE.caption, fontWeight: 700, fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums', color: bCol }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.25, delay: 0.17 + i * 0.07 }}
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
      followType={item.publicId ? 'player' : undefined}
      followId={item.publicId ?? undefined}
      saveKey={`score_${item.matchId}_${item.playerName}`}
      shareTitle={`${item.playerName} · ${item.total} pins`}
      shareUrl={item.publicId ? `/players/${item.publicId}` : `/matcher/${item.matchId}`}
    />
    </div>
  )
}
