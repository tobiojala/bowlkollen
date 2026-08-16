'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, ChevronRight } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

const INK = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.72)'
const INK3 = 'rgba(244,245,247,0.56)'
const GOLD = '#f5c200'

type Selection = { teamId: number; teamName: string; matchId: number; date: string; opponent: string; bord: number; isReserve: boolean }

function shortDate(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

// "Du är uttagen" — native's SelectedCard: shows when a captain has published a
// lineup you're in. Reads get_my_selections (same RPC native uses).
export default function SelectedCard() {
  const [rows, setRows] = useState<Selection[]>([])

  useEffect(() => {
    ;(async () => {
      const db = createClient() as unknown as SupabaseClient
      const { data } = await db.rpc('get_my_selections')
      setRows(((data ?? []) as Record<string, unknown>[]).map((r) => ({
        teamId: r.bits_team_id as number,
        teamName: (r.team_name as string | null) ?? 'Lag',
        matchId: r.bits_match_id as number,
        date: (r.match_date as string | null) ?? '',
        opponent: (r.opponent as string | null) ?? '',
        bord: r.bord as number,
        isReserve: (r.is_reserve as boolean | null) ?? false,
      })))
    })()
  }, [])

  if (rows.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((s) => (
        <Link key={`${s.teamId}-${s.matchId}`} href={`/lag/${s.teamId}`}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, textDecoration: 'none',
            background: 'rgba(245,194,0,0.10)', border: '1px solid rgba(245,194,0,0.30)' }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, flexShrink: 0, background: 'rgba(245,194,0,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={20} color={GOLD} fill={GOLD} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>
              Du är uttagen · {s.isReserve ? 'Reserv' : `Banpar ${s.bord}`}
            </div>
            <div style={{ fontSize: 14, color: INK2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.teamName} mot {s.opponent}{s.date ? ` · ${shortDate(s.date)}` : ''}
            </div>
          </div>
          <ChevronRight size={18} color={INK3} />
        </Link>
      ))}
    </div>
  )
}
