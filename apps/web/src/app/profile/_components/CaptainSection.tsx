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
const HAIR = 'rgba(244,245,247,0.08)'

type ClubClaim = {
  id: string; team_id: string; role: string; status: string
  teams: { name: string; club: string } | null
}

function roleLabel(role: string) {
  return role === 'captain' ? 'Kapten' : role === 'board' ? 'Styrelse' : role === 'admin' ? 'Admin' : 'Ledare'
}

// Captain/board shortcut — the web port of native's CaptainQuickActions. Reads
// club_claims and doorways into the team admin hub (lineup, availability, notis).
export default function CaptainSection() {
  const [claims, setClaims] = useState<ClubClaim[] | null>(null)

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setClaims([]); return }
      const { data } = await supabase
        .from('club_claims')
        .select('id, team_id, role, status, teams:team_id(name, club)')
        .eq('user_id', session.user.id)
      setClaims((data as unknown as ClubClaim[]) ?? [])
    })()
  }, [])

  if (!claims || claims.length === 0) return null

  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: INK3, letterSpacing: '0.12em', padding: '36px 2px 4px' }}>LAGLEDNING</div>
      {claims.map((c) => {
        const teamName = c.teams?.name ?? 'Ditt lag'
        const pending = c.status !== 'verified' && c.status !== 'approved'
        const inner = (
          <>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,194,0,0.12)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} color={GOLD} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamName}</div>
              <div style={{ fontSize: 14, color: INK3, marginTop: 2 }}>
                {pending ? 'Väntar på granskning' : `${roleLabel(c.role)} · laguttagning, tillgänglighet, anslagstavla`}
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
          ? <div key={c.id} style={{ ...style, opacity: 0.7 }}>{inner}</div>
          : <Link key={c.id} href={`/team/${c.team_id}/intern`} style={style}>{inner}</Link>
      })}
    </>
  )
}
