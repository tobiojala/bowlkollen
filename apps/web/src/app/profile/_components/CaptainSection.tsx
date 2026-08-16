'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, ChevronRight, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const INK = '#f4f5f7'
const INK3 = 'rgba(244,245,247,0.56)'
const INK4 = 'rgba(244,245,247,0.34)'
const GOLD = '#f5c200'
const SURFACE = '#14171c'

type MyTeam = { bitsTeamId: number; name: string; role: string; status: string }

function roleLabel(role: string) {
  return role === 'captain' ? 'Kapten' : role === 'board' ? 'Styrelse' : role === 'admin' ? 'Admin' : 'Spelare'
}

// Web port of native's CaptainQuickActions — reads team_claims (the same
// bits_team_id model native uses, so captaincy matches across platforms) and
// doorways into /lag/[bits_team_id], which carries the full captain toolbar.
export default function CaptainSection() {
  const [teams, setTeams] = useState<MyTeam[] | null>(null)

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setTeams([]); return }
      const { data: claims } = await supabase
        .from('team_claims').select('bits_team_id, role, status').eq('user_id', session.user.id)
      const rows = (claims ?? []) as { bits_team_id: number; role: string | null; status: string }[]
      if (!rows.length) { setTeams([]); return }
      const ids = rows.map((r) => r.bits_team_id)
      const { data: bt } = await supabase.from('bits_teams').select('bits_team_id, name').in('bits_team_id', ids)
      const nameById = new Map(((bt ?? []) as { bits_team_id: number; name: string }[]).map((t) => [t.bits_team_id, t.name]))
      setTeams(rows.map((r) => ({
        bitsTeamId: r.bits_team_id, name: nameById.get(r.bits_team_id) ?? 'Lag',
        role: r.role ?? 'player', status: r.status,
      })))
    })()
  }, [])

  if (!teams || teams.length === 0) return null

  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: INK3, letterSpacing: '0.12em', padding: '36px 2px 4px' }}>MITT LAG</div>
      {teams.map((t) => {
        const pending = t.status !== 'verified'
        const inner = (
          <>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,194,0,0.12)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} color={GOLD} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
              <div style={{ fontSize: 14, color: INK3, marginTop: 2 }}>
                {pending ? 'Väntar på granskning' : `${roleLabel(t.role)} · öppna laget`}
              </div>
            </div>
            {pending ? <Clock size={18} color={INK4} /> : <ChevronRight size={20} color={INK4} />}
          </>
        )
        const style: React.CSSProperties = {
          display: 'flex', alignItems: 'center', gap: 14, padding: 16,
          background: SURFACE, borderRadius: 16, textDecoration: 'none', color: INK,
        }
        return pending
          ? <div key={t.bitsTeamId} style={{ ...style, opacity: 0.7 }}>{inner}</div>
          : <Link key={t.bitsTeamId} href={`/lag/${t.bitsTeamId}`} style={style}>{inner}</Link>
      })}
    </>
  )
}
