'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { STALE } from '@/lib/constants'

type CompHistoryRow = {
  bits_competition_id: number
  competition_name: string
  start_date: string | null
  place: number | null
  total_pins: number
  total_games: number
  rank_points: number | null
}

const INITIAL = 6

// A player's BITS competition history (separate from league seriesnitt). Fetched
// via the public_id RPC; renders nothing until there's data (or if the RPC/table
// isn't there yet), so it's safe to ship ahead of the migration + backfill.
export function CompetitionHistory({ playerId }: { playerId: string }) {
  const [expanded, setExpanded] = useState(false)
  const { data = [] } = useQuery<CompHistoryRow[]>({
    queryKey: ['player-competitions', playerId],
    staleTime: STALE.MEDIUM,
    retry: false,
    queryFn: async () => {
      const db = createClient()
      const { data, error } = await db.rpc('get_player_competition_results', { p_public_id: playerId })
      if (error) return []
      return (data ?? []) as CompHistoryRow[]
    },
  })

  if (!data.length) return null
  const shown = expanded ? data : data.slice(0, INITIAL)

  return (
    <section style={{ padding: `${SPACE[8]}px 20px 0` }}>
      <div style={{ color: COLOR.ink3, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', marginBottom: SPACE[3] }}>
        TÄVLINGAR · {data.length}
      </div>
      <div>
        {shown.map((r, i) => {
          const snitt = r.total_games > 0 ? Math.round(r.total_pins / r.total_games) : null
          const gold = r.place === 1
          const year = r.start_date ? new Date(r.start_date + 'T12:00:00').getFullYear() : null
          return (
            <Link key={`${r.bits_competition_id}-${i}`} href={`/tavlingar/${r.bits_competition_id}`} style={{
              display: 'flex', alignItems: 'center', gap: SPACE[3], textDecoration: 'none',
              padding: `${SPACE[3]}px 0`, borderTop: `1px solid ${COLOR.hairline}`,
            }}>
              <span style={{ width: 30, textAlign: 'center', flexShrink: 0, fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 15, fontWeight: 800, color: gold ? COLOR.gold : COLOR.ink3 }}>
                {r.place != null ? `${r.place}:a` : '–'}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.competition_name}</span>
                {year && <span style={{ display: 'block', fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 1 }}>{year}</span>}
              </span>
              {snitt != null && (
                <span style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ display: 'block', fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 800, color: COLOR.ink }}>{snitt}</span>
                  <span style={{ display: 'block', fontSize: TYPE.label, color: COLOR.ink3 }}>snitt</span>
                </span>
              )}
            </Link>
          )
        })}
      </div>
      {data.length > INITIAL && (
        <button onClick={() => setExpanded(v => !v)} style={{
          marginTop: SPACE[3], background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: 14, fontWeight: 600, color: COLOR.gold,
        }}>
          {expanded ? 'Visa färre' : `Visa alla ${data.length}`}
        </button>
      )}
    </section>
  )
}
