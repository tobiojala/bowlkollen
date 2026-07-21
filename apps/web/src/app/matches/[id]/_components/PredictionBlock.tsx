'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useColors } from '@/components/ThemeProvider'
import { useSession, useMatchPredictions, useMyPrediction, keys } from '@/lib/queries'
import { shortName } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

type Pick = 'W' | 'L'

type Props = {
  matchId: string
  homeTeam: { id: string; name: string }
  awayTeam: { id: string; name: string }
  status: 'upcoming' | 'live' | 'completed'
  homeScore: number | null
  awayScore: number | null
}

export default function PredictionBlock({ matchId, homeTeam, awayTeam, status, homeScore, awayScore }: Props) {
  const { C, isDark } = useColors()
  const qc = useQueryClient()
  const { data: session }    = useSession()
  const { data: counts }     = useMatchPredictions(matchId)
  const userId               = session?.user?.id ?? null
  const { data: myPick }     = useMyPrediction(matchId, userId)

  const [submitting, setSubmitting] = useState(false)
  const [localPick, setLocalPick]   = useState<Pick | null>(null)

  const activePick = localPick ?? myPick ?? null

  const total = counts?.total ?? 0
  const wPct  = total > 0 ? Math.round((counts!.W / total) * 100) : 50
  const lPct  = total > 0 ? 100 - wPct : 50

  const correctPick: Pick | null =
    homeScore !== null && awayScore !== null
      ? homeScore > awayScore ? 'W' : awayScore > homeScore ? 'L' : null
      : null

  const wasRight = activePick !== null && correctPick !== null && activePick === correctPick

  const submit = async (pick: Pick) => {
    if (!userId || submitting || activePick === pick) return
    setSubmitting(true)
    setLocalPick(pick)
    try {
      await createClient().from('match_predictions').upsert({
        match_id: matchId, user_id: userId, prediction: pick,
      })
      qc.invalidateQueries({ queryKey: keys.matchPredictions(matchId) })
      if (userId) qc.invalidateQueries({ queryKey: keys.myPrediction(matchId, userId) })
    } finally {
      setSubmitting(false)
    }
  }

  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const cardBg    = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'
  const gold      = '#f5c200'
  const green     = '#5dcaa5'
  const red       = '#e05555'

  const teamBtnStyle = (pick: Pick): React.CSSProperties => {
    const isActive  = activePick === pick
    const isCorrect = status === 'completed' && correctPick === pick
    const isWrong   = status === 'completed' && activePick === pick && correctPick !== pick
    const borderC   = isCorrect ? green : isWrong ? red : isActive ? gold : border
    const bgC       = isCorrect
      ? (isDark ? 'rgba(93,202,165,0.08)' : 'rgba(93,202,165,0.06)')
      : isWrong
      ? (isDark ? 'rgba(224,85,85,0.08)' : 'rgba(224,85,85,0.06)')
      : isActive
      ? (isDark ? 'rgba(245,194,0,0.08)' : 'rgba(245,194,0,0.06)')
      : 'transparent'

    return {
      flex: 1, padding: '14px 10px', borderRadius: 14, cursor: userId ? 'pointer' : 'default',
      border: `1.5px solid ${borderC}`, background: bgC, textAlign: 'center',
      transition: 'border-color 0.2s, background 0.2s',
      WebkitTapHighlightColor: 'transparent',
    }
  }

  const labelColor = (pick: Pick) => {
    if (status === 'completed') {
      if (correctPick === pick) return green
      if (activePick === pick)  return red
    }
    return activePick === pick ? gold : C.muted
  }

  return (
    <div style={{ margin: '0 12px 16px', background: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '8px 14px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="section-label" style={{ color: C.muted }}>Prediktion</span>
        {total > 0 && (
          <span style={{ fontSize: 10, color: C.muted }}>
            {total.toLocaleString('sv')} {total === 1 ? 'röst' : 'röster'}
          </span>
        )}
      </div>

      <div style={{ padding: '14px 14px 16px' }}>
        {/* Team buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {/* Home */}
          <button
            onClick={() => submit('W')}
            disabled={!userId || submitting || status !== 'upcoming'}
            style={{ ...teamBtnStyle('W'), border: `1.5px solid ${activePick === 'W' ? (status === 'completed' ? (wasRight ? green : red) : gold) : border}` } as React.CSSProperties}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: labelColor('W'), marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shortName(homeTeam.name)}
            </div>
            {(activePick || total > 0) && (
              <div style={{ fontSize: 20, fontWeight: 900, color: labelColor('W'), fontVariantNumeric: 'tabular-nums' }}>
                {wPct}%
              </div>
            )}
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Hemma</div>
          </button>

          {/* Away */}
          <button
            onClick={() => submit('L')}
            disabled={!userId || submitting || status !== 'upcoming'}
            style={{ ...teamBtnStyle('L'), border: `1.5px solid ${activePick === 'L' ? (status === 'completed' ? (!wasRight && activePick === 'L' ? red : green) : gold) : border}` } as React.CSSProperties}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: labelColor('L'), marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shortName(awayTeam.name)}
            </div>
            {(activePick || total > 0) && (
              <div style={{ fontSize: 20, fontWeight: 900, color: labelColor('L'), fontVariantNumeric: 'tabular-nums' }}>
                {lPct}%
              </div>
            )}
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Borta</div>
          </button>
        </div>

        {/* Split bar — only visible once there are votes */}
        {total > 0 && (
          <div style={{ height: 5, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 10 }}>
            <motion.div
              initial={{ width: '50%' }}
              animate={{ width: `${wPct}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 28 }}
              style={{ height: '100%', borderRadius: 999, background: activePick === 'W' ? gold : green }}
            />
          </div>
        )}

        {/* Status message */}
        {status === 'completed' && activePick && (
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: wasRight ? green : red }}>
            {wasRight ? '✓ Du gissade rätt' : '✗ Inte den här gången'}
            {!wasRight && total > 0 && (
              <span style={{ fontWeight: 400, color: C.muted }}>
                {' '}· {activePick === 'W' ? lPct : wPct}% gissade också fel
              </span>
            )}
          </div>
        )}

        {status === 'live' && activePick && (
          <div style={{ textAlign: 'center', fontSize: 11, color: C.muted }}>
            Match pågår · du röstade på {activePick === 'W' ? shortName(homeTeam.name) : shortName(awayTeam.name)}
          </div>
        )}

        {!userId && status === 'upcoming' && (
          <div style={{ textAlign: 'center', fontSize: 12, color: C.muted }}>
            <Link href="/login" style={{ color: gold, textDecoration: 'none', fontWeight: 600 }}>Logga in</Link>
            {' '}för att rösta
          </div>
        )}

        {userId && !activePick && status === 'upcoming' && (
          <div style={{ textAlign: 'center', fontSize: 11, color: C.muted }}>
            {total === 0 ? 'Var den första att rösta' : 'Tryck på ett lag för att rösta'}
          </div>
        )}
      </div>
    </div>
  )
}
