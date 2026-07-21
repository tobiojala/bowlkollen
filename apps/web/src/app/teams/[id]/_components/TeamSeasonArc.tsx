'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useColors } from '@/components/ThemeProvider'
import { teamColor, teamInitials, shortName } from '@/lib/utils'
import { SEASON } from '@/lib/constants'
import type { Match } from '@/lib/types'

type Props = {
  teamId:  string
  matches: Match[]
}

const STEP  = 48
const CY    = 52
const R     = 9
const PAD   = 24
const SVG_H = 96

function resultColor(m: Match, teamId: string): string {
  if (m.status !== 'completed' || m.home_score === null) return 'transparent'
  const home = m.home_team_id === teamId
  const won  = home ? m.home_score > m.away_score! : m.away_score! > m.home_score
  const lost = home ? m.home_score < m.away_score! : m.away_score! < m.home_score
  return won ? '#22c55e' : lost ? '#e05555' : '#f59e0b'
}

export default function TeamSeasonArc({ teamId, matches }: Props) {
  const { C, isDark } = useColors()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const arc = [...matches]
    .filter(m => m.date >= SEASON.CURRENT)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (arc.length === 0) return null

  const isHome   = (m: Match) => m.home_team_id === teamId
  const svgW     = PAD * 2 + (arc.length - 1) * STEP
  const selected = arc.find(m => m.id === selectedId) ?? null

  // Find the "now" split index — last completed match
  const nowIdx = arc.reduce((last, m, i) => m.status === 'completed' && m.home_score !== null ? i : last, -1)

  return (
    <div className="pb-1">
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <svg width={svgW} height={SVG_H} style={{ display: 'block' }}>

          {/* Completed segment of the spine */}
          {nowIdx >= 0 && (
            <line
              x1={PAD} y1={CY}
              x2={PAD + nowIdx * STEP} y2={CY}
              stroke={isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)'}
              strokeWidth={2}
            />
          )}

          {/* Upcoming segment — dashed */}
          {nowIdx < arc.length - 1 && (
            <line
              x1={PAD + Math.max(nowIdx, 0) * STEP} y1={CY}
              x2={PAD + (arc.length - 1) * STEP} y2={CY}
              stroke={C.border}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}

          {arc.map((m, i) => {
            const x         = PAD + i * STEP
            const isTop     = i % 2 === 0
            const color     = resultColor(m, teamId)
            const completed = m.status === 'completed' && m.home_score !== null
            const isUpcoming = m.status === 'upcoming' || m.status === 'live'
            const isSelected = selectedId === m.id
            const opp       = isHome(m) ? m.away : m.home
            const lbl       = teamInitials(opp?.name ?? '').slice(0, 3)
            const nodeColor = completed ? color : C.border
            const delay     = i * 0.04

            return (
              <g
                key={m.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedId(isSelected ? null : m.id)}
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle cx={x} cy={CY} r={R + 6}
                    fill="none" stroke={nodeColor} strokeWidth={1.5} opacity={0.45} />
                )}

                {/* Node */}
                <motion.circle
                  cx={x} cy={CY}
                  fill={completed ? color : 'transparent'}
                  stroke={nodeColor}
                  strokeWidth={completed ? 0 : 1.5}
                  opacity={isUpcoming ? 0.5 : 1}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' } as React.CSSProperties}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: isUpcoming ? 0.5 : 1 }}
                  transition={{ delay: 0.2 + delay, type: 'spring', stiffness: 280, damping: 22 }}
                  r={R}
                />

                {/* Label */}
                <motion.text
                  x={x}
                  y={isTop ? CY - R - 7 : CY + R + 14}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight={isSelected ? 800 : 500}
                  fill={isSelected ? nodeColor : C.muted}
                  style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'system-ui,sans-serif' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + delay }}
                >
                  {lbl}
                </motion.text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Selected match mini-card */}
      <AnimatePresence>
        {selected && (() => {
          const opp      = isHome(selected) ? selected.away : selected.home
          const myScore  = isHome(selected) ? selected.home_score : selected.away_score
          const oppScore = isHome(selected) ? selected.away_score : selected.home_score
          const won      = myScore !== null && oppScore !== null && myScore > oppScore
          const lost     = myScore !== null && oppScore !== null && myScore < oppScore
          const rc       = won ? '#22c55e' : lost ? '#e05555' : '#f59e0b'
          const rl       = won ? 'V' : lost ? 'F' : 'O'
          const tc       = teamColor(opp?.name ?? '', isDark)
          const dateStr  = new Date(selected.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })

          return (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              <Link
                href={'/matches/' + selected.id}
                className="mx-5 mb-3 flex items-center gap-3 rounded-2xl border p-3 no-underline"
                style={{ background: C.card, borderColor: C.border }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-black"
                  style={{ background: tc.bg, border: '1.5px solid ' + tc.border, color: tc.text }}
                >
                  {teamInitials(opp?.name ?? '')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold" style={{ color: C.text }}>
                    {shortName(opp?.name ?? '')}
                  </div>
                  <div className="text-[11px]" style={{ color: C.muted }}>
                    {isHome(selected) ? 'Hemma' : 'Borta'} · {dateStr}
                  </div>
                </div>
                {myScore !== null ? (
                  <div className="shrink-0 text-right">
                    <div className="text-base font-black" style={{ color: won ? '#22c55e' : C.text }}>
                      {myScore} – {oppScore}
                    </div>
                    <div className="text-[10px] font-bold" style={{ color: rc }}>{rl}</div>
                  </div>
                ) : (
                  <div className="shrink-0 text-[11px]" style={{ color: C.muted }}>Kommande</div>
                )}
              </Link>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
