'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { COLOR, SPACE, RADIUS, TYPE } from '@/lib/brand'
import { divisionColor } from '@/lib/divisions'
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

type OurTeam = {
  id: string
  name: string
  club: string | null
  club_slug: string | null
  team_path: string | null
  division: string | null
}

type Props = { params: Promise<{ bitsId: string }> }

function teamTypeLabel(t: BitsTeam): string {
  const desc = t.team_type_desc ?? ''
  if (desc.includes('A - Lag')) return 'A-lag'
  if (desc.includes('B - Lag')) return 'B-lag'
  if (desc.includes('C - Lag')) return 'C-lag'
  if (desc.includes('F - Lag')) return 'F-lag'
  if (desc.includes('DA - Lag')) return 'Damer A'
  if (desc.includes('DB - Lag')) return 'Damer B'
  if (desc.includes('JH - Lag') || desc.includes('Junior')) return 'Junior'
  return desc || ''
}

export default function ClubPage({ params }: Props) {
  const [club,       setClub]       = useState<Club | null>(null)
  const [bitsTeams,  setBitsTeams]  = useState<BitsTeam[]>([])
  const [ourTeams,   setOurTeams]   = useState<OurTeam[]>([])
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

      const [{ data: bt }, { data: ot }, { data: matchDiv }] = await Promise.all([
        supabase.from('bits_teams')
          .select('bits_team_id, bits_club_id, name, hall_name, team_type, team_type_desc, team_alias')
          .eq('bits_club_id', numId).order('name'),
        supabase.from('teams')
          .select('id, name, club, club_slug, team_path')
          .eq('club', (c as Club).name),
        supabase.from('matches')
          .select('home_team_id, away_team_id, division')
          .not('division', 'is', null).eq('status', 'completed').limit(200),
      ])

      const divMap: Record<string, string> = {}
      matchDiv?.forEach((m: { home_team_id: string | null; away_team_id: string | null; division: string | null }) => {
        if (m.division) {
          if (m.home_team_id) divMap[m.home_team_id] = m.division
          if (m.away_team_id) divMap[m.away_team_id] = m.division
        }
      })

      if (bt) setBitsTeams(bt as BitsTeam[])
      if (ot) setOurTeams((ot as OurTeam[]).map(t => ({ ...t, division: divMap[t.id] ?? null })))
      setLoading(false)
    })
  }, [params])

  function findOurTeam(bt: BitsTeam): OurTeam | null {
    const n = bt.name.toLowerCase()
    return ourTeams.find(t =>
      t.name.toLowerCase() === n ||
      t.name.toLowerCase().includes(n) ||
      n.includes(t.name.toLowerCase())
    ) ?? null
  }

  const hue = (club?.name ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360

  if (loading) return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: COLOR.ink3 }}>Laddar...</div>
    </main>
  )

  if (!club) return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: COLOR.ink3 }}>Klubben hittades inte</div>
    </main>
  )

  const initials      = club.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
  const teamsWithData = bitsTeams.filter(bt => findOurTeam(bt) !== null)

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

        {/* Header */}
        <div style={{
          background: `linear-gradient(160deg, hsl(${hue},40%,7%) 0%, hsl(${hue},52%,14%) 60%, hsl(${hue},40%,9%) 100%)`,
          padding: `${SPACE[4]}px ${SPACE[4]}px ${SPACE[6]}px`,
        }}>
          <Link href="/teams" style={{
            fontSize: 12, color: 'rgba(244,245,247,0.45)', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: SPACE[6],
          }}>
            ← Alla klubbar
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4] }}>
            <div style={{
              width: 64, height: 64, borderRadius: RADIUS.lg, flexShrink: 0, overflow: 'hidden',
              background: club.logo_url && !logoFailed ? 'rgba(255,255,255,0.06)' : `hsla(${hue},50%,45%,0.15)`,
              border: club.logo_url && !logoFailed ? '1px solid rgba(255,255,255,0.12)' : `2px solid hsla(${hue},50%,45%,0.5)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: `hsl(${hue},50%,65%)`,
            }}>
              {club.logo_url && !logoFailed
                ? <Image src={club.logo_url} alt={club.name} width={80} height={80} onError={() => setLogoFailed(true)} style={{ objectFit: 'contain', padding: 8 }} />
                : initials
              }
            </div>

            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: SPACE[1] }}>
                {club.name}
              </h1>
              <div style={{ fontSize: TYPE.label, color: 'rgba(244,245,247,0.5)' }}>
                {[club.county, club.hall_name].filter(Boolean).join(' · ')}
              </div>
              <div style={{ display: 'flex', gap: SPACE[2], marginTop: SPACE[2], flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLOR.gold, background: `${COLOR.gold}18`, border: `1px solid ${COLOR.gold}30`, borderRadius: RADIUS.sm, padding: '3px 10px' }}>
                  {bitsTeams.length} lag
                </span>
                {teamsWithData.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLOR.green, background: `${COLOR.green}18`, border: `1px solid ${COLOR.green}30`, borderRadius: RADIUS.sm, padding: '3px 10px' }}>
                    {teamsWithData.length} med resultat
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Teams list */}
        <div style={{ padding: `${SPACE[4]}px ${SPACE[3]}px` }}>
          {bitsTeams.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: `${SPACE[8]}px ${SPACE[6]}px`,
              background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.lg,
            }}>
              <div style={{ fontSize: 32, marginBottom: SPACE[3] }}>🎳</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink, marginBottom: SPACE[2] }}>
                Inga aktiva lag
              </div>
              <div style={{ fontSize: TYPE.body, color: COLOR.ink3 }}>
                Den här klubben har inga registrerade lag i BITS just nu
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink, letterSpacing: '-0.01em', padding: `0 ${SPACE[1]}px ${SPACE[3]}px` }}>
                Lag ({bitsTeams.length})
              </div>
              <div className="club-teams">
                {bitsTeams.map(bt => {
                  const ourTeam  = findOurTeam(bt)
                  // Link straight to the team page — the two-segment
                  // /{club_slug}/{team_path} URL has no route and 404s.
                  const href     = ourTeam ? `/teams/${ourTeam.id}` : null
                  const typeLabel = teamTypeLabel(bt)
                  const divC      = ourTeam?.division ? divisionColor(ourTeam.division) : null

                  const inner = (
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: RADIUS.md, flexShrink: 0,
                        background: ourTeam ? `${COLOR.green}12` : COLOR.surface,
                        border: ourTeam ? `1px solid ${COLOR.green}30` : `1px solid ${COLOR.hairline}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ourTeam ? COLOR.green : COLOR.ink3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {bt.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], flexWrap: 'wrap' as const }}>
                          {divC && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: divC, background: `${divC}20`, borderRadius: 4, padding: '2px 7px' }}>
                              {ourTeam!.division}
                            </span>
                          )}
                          {typeLabel && !ourTeam?.division && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: ourTeam ? COLOR.green : COLOR.ink3, background: ourTeam ? `${COLOR.green}12` : `${COLOR.ink3}12`, borderRadius: 4, padding: '2px 7px' }}>
                              {typeLabel}
                            </span>
                          )}
                          {bt.hall_name && (
                            <span style={{ fontSize: 11, color: COLOR.ink3 }}>{bt.hall_name}</span>
                          )}
                          {!ourTeam && (
                            <span style={{ fontSize: 10, color: COLOR.ink3, fontStyle: 'italic' }}>Inte i Bowlkollen än</span>
                          )}
                        </div>
                      </div>

                      {ourTeam && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLOR.ink3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      )}
                    </div>
                  )

                  return (
                    <div key={bt.bits_team_id} style={{
                      background: COLOR.surface,
                      border: `1px solid ${COLOR.hairline}`,
                      borderRadius: RADIUS.lg,
                      padding: `${SPACE[3]}px ${SPACE[4]}px`,
                      display: 'flex', alignItems: 'center', gap: SPACE[3],
                      opacity: ourTeam ? 1 : 0.6,
                    }}>
                      {href ? (
                        <Link href={href} style={{ flex: 1, minWidth: 0, textDecoration: 'none', display: 'flex' }}>
                          {inner}
                        </Link>
                      ) : inner}
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
