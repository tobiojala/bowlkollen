'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { COLOR, SPACE, RADIUS, TYPE } from '@/lib/brand'
import FollowButton from '@/components/FollowButton'

type Club = {
  bits_id: number
  name: string
  county: string | null
  hall_name: string | null
  is_active: boolean
  logo_url: string | null
}

type BitsTeam = {
  bits_team_id: number
  bits_club_id: number
  name: string
  hall_name: string | null
  team_type: number | null
  team_type_desc: string | null
  team_alias: string | null
}

type Props = { params: Promise<{ bitsId: string }> }

// A BITS team's tier label (A-lag / Damer A / Junior …) from its type description.
export function teamTypeLabel(desc: string | null): string {
  const d = desc ?? ''
  if (d.includes('DA - Lag')) return 'Damer A'
  if (d.includes('DB - Lag')) return 'Damer B'
  if (d.includes('A - Lag')) return 'A-lag'
  if (d.includes('B - Lag')) return 'B-lag'
  if (d.includes('C - Lag')) return 'C-lag'
  if (d.includes('F - Lag')) return 'F-lag'
  if (d.includes('JH - Lag') || d.includes('Junior')) return 'Junior'
  return d
}

export default function ClubPage({ params }: Props) {
  const [club,       setClub]       = useState<Club | null>(null)
  const [bitsTeams,  setBitsTeams]  = useState<BitsTeam[]>([])
  const [loading,    setLoading]    = useState(true)
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    params.then(async ({ bitsId }) => {
      const numId = Number(bitsId)
      const supabase = createClient()

      const { data: c } = await supabase
        .from('bits_clubs')
        .select('bits_id, name, county, hall_name, is_active, logo_url')
        .eq('bits_id', numId).single()
      if (!c) { setLoading(false); return }
      setClub(c as Club)

      // BITS-native: every team here has a canonical /lag/[bits_team_id] page.
      const { data: bt } = await supabase.from('bits_teams')
        .select('bits_team_id, bits_club_id, name, hall_name, team_type, team_type_desc, team_alias')
        .eq('bits_club_id', numId).order('name')
      if (bt) setBitsTeams(bt as BitsTeam[])
      setLoading(false)
    })
  }, [params])

  const hue = (club?.name ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360

  if (loading) return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: COLOR.ink3 }}>Laddar…</div>
    </main>
  )
  if (!club) return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: COLOR.ink3 }}>Klubben hittades inte</div>
    </main>
  )

  const initials = club.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg }}>
      <style>{`
        .club-wrap { max-width: 600px; margin: 0 auto; padding-bottom: 48px; }
        .club-teams { display: flex; flex-direction: column; gap: 8px; }
        @media (min-width: 1024px) {
          .club-wrap { max-width: 1160px; }
          .club-teams { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
        }
      `}</style>
      <div className="club-wrap">

        {/* Header — a subtle per-club identity wash over the near-black ground */}
        <div style={{
          background: `linear-gradient(160deg, hsl(${hue},40%,7%) 0%, hsl(${hue},52%,14%) 60%, hsl(${hue},40%,9%) 100%)`,
          padding: `${SPACE[4]}px ${SPACE[4]}px ${SPACE[6]}px`,
        }}>
          <Link href="/teams" style={{
            fontSize: TYPE.caption, color: COLOR.ink2, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 2, marginBottom: SPACE[6],
          }}>
            <ChevronLeft size={15} /> Alla klubbar
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4] }}>
            <div style={{
              width: 64, height: 64, borderRadius: RADIUS.lg, flexShrink: 0, overflow: 'hidden',
              background: club.logo_url && !logoFailed ? 'rgba(244,245,247,0.06)' : `hsla(${hue},50%,45%,0.15)`,
              border: club.logo_url && !logoFailed ? `1px solid ${COLOR.hairline}` : `2px solid hsla(${hue},50%,45%,0.5)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: `hsl(${hue},50%,72%)`,
            }}>
              {club.logo_url && !logoFailed
                ? <Image src={club.logo_url} alt={club.name} width={80} height={80} onError={() => setLogoFailed(true)} style={{ objectFit: 'contain', padding: 8 }} />
                : initials}
            </div>

            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COLOR.ink, letterSpacing: '-0.02em', marginBottom: SPACE[1] }}>
                {club.name}
              </h1>
              <div style={{ fontSize: TYPE.caption, color: COLOR.ink2 }}>
                {[club.county, club.hall_name].filter(Boolean).join(' · ')}
              </div>
              {bitsTeams.length > 0 && (
                <div style={{ marginTop: SPACE[2] }}>
                  <span style={{ fontSize: TYPE.label, fontWeight: 700, color: COLOR.gold, background: `${COLOR.gold}18`, border: `1px solid ${COLOR.gold}30`, borderRadius: RADIUS.sm, padding: '3px 10px' }}>
                    {bitsTeams.length} {bitsTeams.length === 1 ? 'lag' : 'lag'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teams — each is a doorway to its BITS team page */}
        <div style={{ padding: `${SPACE[4]}px ${SPACE[3]}px` }}>
          {bitsTeams.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: `${SPACE[8]}px ${SPACE[6]}px`,
              background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.lg,
            }}>
              <div style={{ fontSize: TYPE.body, fontWeight: 700, color: COLOR.ink, marginBottom: SPACE[2] }}>
                Inga aktiva lag
              </div>
              <div style={{ fontSize: TYPE.body, color: COLOR.ink3 }}>
                Den här klubben har inga registrerade lag i BITS just nu.
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink2, letterSpacing: '0.04em', textTransform: 'uppercase', padding: `0 ${SPACE[1]}px ${SPACE[3]}px` }}>
                Lag · {bitsTeams.length}
              </div>
              <div className="club-teams">
                {bitsTeams.map(bt => {
                  const label = teamTypeLabel(bt.team_type_desc)
                  return (
                    <div key={bt.bits_team_id} style={{
                      background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.lg,
                      padding: `${SPACE[3]}px ${SPACE[4]}px`, display: 'flex', alignItems: 'center', gap: SPACE[3],
                    }}>
                      <Link href={`/lag/${bt.bits_team_id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: RADIUS.md, flexShrink: 0,
                          background: `${COLOR.gold}12`, border: `1px solid ${COLOR.gold}22`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Users size={18} color={COLOR.gold} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {bt.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], flexWrap: 'wrap' as const }}>
                            {label && (
                              <span style={{ fontSize: TYPE.label, fontWeight: 700, color: COLOR.ink2, background: COLOR.surface2, borderRadius: 4, padding: '2px 7px' }}>
                                {label}
                              </span>
                            )}
                            {bt.hall_name && <span style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{bt.hall_name}</span>}
                          </div>
                        </div>
                        <ChevronRight size={16} color={COLOR.ink3} style={{ flexShrink: 0 }} />
                      </Link>
                      <FollowButton entityType="team" entityId={String(bt.bits_team_id)} size="sm" />
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

      </div>
    </main>
  )
}
