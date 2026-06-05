'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, stagger } from '@/lib/motion'
import type { MatchResult } from '@/lib/player-stats'

type Filter = 'alla' | 'bästa' | 'hemma' | 'borta'

export default function PlayerMatchLog({ results, teamId, seasonAvg, isDark }: {
  results: MatchResult[]
  teamId: string | null
  seasonAvg: number
  isDark: boolean
}) {
  const [filter, setFilter] = useState<Filter>('alla')

  const BORDER = isDark ? 'rgba(42,56,88,1)' : 'rgba(232,224,212,1)'
  const MUTED  = isDark ? '#6b7a99' : '#6b7a8d'
  const GOLD   = '#f5c200'
  const BLUE   = '#7ab4e8'

  const processed = results
    .map(r => {
      const games  = (r.games ?? []).filter(g => g > 0)
      const total  = games.reduce((a, b) => a + b, 0)
      const avg    = games.length ? Math.round(total / games.length) : 0
      const isHome = r.matches?.home_team_id === teamId
      return { r, games, total, avg, isHome }
    })
    .filter(({ games }) => games.length > 0)
    .filter(({ isHome }) => {
      if (filter === 'hemma') return isHome === true
      if (filter === 'borta') return isHome === false
      return true
    })
    .sort(filter === 'bästa' ? (a, b) => b.total - a.total : (a, b) => (b.r.matches?.date ?? '').localeCompare(a.r.matches?.date ?? ''))
    .slice(0, filter === 'bästa' ? 5 : undefined)

  const tabs: { key: Filter; label: string }[] = [
    { key: 'alla',   label: 'Alla'   },
    { key: 'bästa',  label: 'Bästa'  },
    { key: 'hemma',  label: 'Hemma'  },
    { key: 'borta',  label: 'Borta'  },
  ]

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px 8px', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: MUTED, letterSpacing: 2, marginRight: 4 }}>
          MATCHLOGG
        </span>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{ padding: '6px 12px', minHeight: 34, borderRadius: 20,
              border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
              background: filter === t.key ? 'rgba(245,194,0,0.15)' : 'rgba(255,255,255,0.05)',
              color: filter === t.key ? GOLD : 'rgba(255,255,255,0.3)',
              outline: `1px solid ${filter === t.key ? 'rgba(245,194,0,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Rows */}
      {processed.length === 0 ? (
        <div style={{ padding: '24px 20px', textAlign: 'center', fontSize: 13, color: MUTED }}>
          Inga matcher
        </div>
      ) : (
        <motion.div variants={stagger(0.04)} initial="hidden" animate="visible">
          {processed.map(({ r, games, total, avg }) => {
            const m    = r.matches
            const opp  = m ? (r.matches?.home_team_id === teamId ? m.away.name : m.home.name) : '—'
            const date = m?.date ? new Date(m.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : ''
            const hs = m?.home_score, as_ = m?.away_score
            const myScore = hs !== null && as_ !== null
              ? (m?.home_team_id === teamId ? `${hs}–${as_}` : `${as_}–${hs}`)
              : null
            const won = hs != null && as_ != null
              ? (m?.home_team_id === teamId ? hs > as_ : as_ > hs)
              : null
            const drew = hs === as_

            return (
              <motion.div key={r.id} variants={fadeUp}
                style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 20px', borderTop: `1px solid ${BORDER}` }}>
                {/* Result bar */}
                <div style={{ width: 3, height: 36, borderRadius: 2, flexShrink: 0,
                  background: won === null ? MUTED : drew ? MUTED : won ? '#5dcaa5' : '#e05555' }} />

                {/* Opponent + games */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'white',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      vs {opp}
                    </span>
                    {myScore && (
                      <span style={{ fontSize: 10, color: MUTED, flexShrink: 0 }}>{myScore}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {games.map((g, gi) => (
                      <span key={gi} style={{
                        fontSize: g >= 250 ? 13 : 11,
                        fontWeight: g >= 200 ? 700 : 400,
                        color: g >= 250 ? BLUE : g >= 200 ? GOLD : MUTED,
                        fontVariantNumeric: 'tabular-nums',
                      }}>{g}</span>
                    ))}
                  </div>
                </div>

                {/* Total + date */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                    color: avg >= seasonAvg ? GOLD : MUTED, lineHeight: 1 }}>{total}</div>
                  <div style={{ fontSize: 9, color: MUTED, marginTop: 3 }}>{date}</div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
