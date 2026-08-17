'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Megaphone, ListChecks, CalendarCheck, ChevronRight, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const INK = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.72)'
const INK3 = 'rgba(244,245,247,0.56)'
const INK4 = 'rgba(244,245,247,0.34)'
const GOLD = '#f5c200'
const SURFACE = '#14171c'
const SURFACE2 = '#1c2127'
const HAIR = 'rgba(244,245,247,0.08)'

const SEASON_ID = 2026
const todayISO = () => new Date().toISOString().slice(0, 10)

type NextMatch = { matchId: number; opp: string; date: string }
type MyTeam = { bitsTeamId: number; name: string; role: string; status: string; next: NextMatch | null }

function roleLabel(role: string) {
  return role === 'captain' ? 'Kapten' : role === 'board' || role === 'styrelse' ? 'Styrelse' : role === 'lagledare' ? 'Lagledare' : role === 'admin' ? 'Admin' : 'Spelare'
}
function shortDate(iso: string) {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00')
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
}

// The profile is the command center: your team + its admin actions live here
// (native's CaptainQuickActions). The public /lag/[id] page stays public-only.
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
      const [{ data: bt }, { data: matches }] = await Promise.all([
        supabase.from('bits_teams').select('bits_team_id, name').in('bits_team_id', ids),
        supabase.from('bits_matches')
          .select('bits_match_id, match_date, home_team_name, away_team_name, home_bits_team_id, away_bits_team_id')
          .or(`home_bits_team_id.in.(${ids.join(',')}),away_bits_team_id.in.(${ids.join(',')})`)
          .eq('season_id', SEASON_ID).eq('is_finished', false).gte('match_date', todayISO())
          .order('match_date', { ascending: true }),
      ])
      const nameById = new Map(((bt ?? []) as { bits_team_id: number; name: string }[]).map((t) => [t.bits_team_id, t.name]))
      const nextFor = (teamId: number): NextMatch | null => {
        const m = ((matches ?? []) as Record<string, unknown>[]).find(
          (x) => x.home_bits_team_id === teamId || x.away_bits_team_id === teamId)
        if (!m) return null
        const isHome = m.home_bits_team_id === teamId
        return { matchId: m.bits_match_id as number, date: m.match_date as string, opp: (isHome ? m.away_team_name : m.home_team_name) as string }
      }
      setTeams(rows.map((r) => ({
        bitsTeamId: r.bits_team_id, name: nameById.get(r.bits_team_id) ?? 'Lag',
        role: r.role ?? 'player', status: r.status, next: nextFor(r.bits_team_id),
      })))
    })()
  }, [])

  if (!teams || teams.length === 0) return null

  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: INK3, letterSpacing: '0.12em', padding: '36px 2px 4px' }}>MITT LAG</div>
      {teams.map((t) => {
        if (t.status !== 'verified') {
          return (
            <div key={t.bitsTeamId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: SURFACE, borderRadius: 16, opacity: 0.7 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,194,0,0.12)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={22} color={GOLD} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>{t.name}</div>
                <div style={{ fontSize: 14, color: INK3, marginTop: 2 }}>Väntar på granskning</div>
              </div>
              <Clock size={18} color={INK4} />
            </div>
          )
        }
        const isCaptain = t.role === 'captain'
        return (
          <div key={t.bitsTeamId} style={{ background: SURFACE, borderRadius: 16, overflow: 'hidden' }}>
            <Link href={`/lag/${t.bitsTeamId}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, textDecoration: 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,194,0,0.12)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={22} color={GOLD} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                <div style={{ fontSize: 14, color: INK3, marginTop: 2 }}>{roleLabel(t.role)}</div>
              </div>
              <ChevronRight size={20} color={INK4} />
            </Link>

            <ActionRow icon={<Megaphone size={20} color={INK2} />} label="Anslagstavla" href={`/lag/${t.bitsTeamId}/nyheter`} />
            {t.next && (isCaptain ? (
              <>
                <ActionRow icon={<ListChecks size={20} color={INK2} />} label="Laguttagning" sub={`mot ${t.next.opp} · ${shortDate(t.next.date)}`} href={`/lag/${t.bitsTeamId}/laguttagning/${t.next.matchId}`} />
                <ActionRow icon={<CalendarCheck size={20} color={INK2} />} label="Tillgänglighet" sub={`mot ${t.next.opp}`} href={`/lag/${t.bitsTeamId}/tillganglighet/${t.next.matchId}`} />
              </>
            ) : (
              <ActionRow icon={<CalendarCheck size={20} color={INK2} />} label={`Kan du spela mot ${t.next.opp}?`} sub={shortDate(t.next.date)} href={`/lag/${t.bitsTeamId}/tillganglighet/${t.next.matchId}`} />
            ))}
          </div>
        )
      })}
    </>
  )
}

function ActionRow({ icon, label, sub, href }: { icon: React.ReactNode; label: string; sub?: string; href: string }) {
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: `1px solid ${HAIR}`, textDecoration: 'none', background: SURFACE2 }}>
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
        {sub && <div style={{ fontSize: 13, color: INK3, marginTop: 1 }}>{sub}</div>}
      </div>
      <ChevronRight size={18} color={INK4} />
    </Link>
  )
}
