'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { useRouter } from 'next/navigation'
import { safeClubLogoUrl } from '@/lib/club-logo-url'

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

function divisionColor(d: string | null) {
  if (!d) return '#6b7a99'
  if (d.includes('Elitserien')) return '#4a90d9'
  if (d.includes('Allsvenskan')) return '#5ba85a'
  return '#8a9ab5'
}

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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()

  const [club, setClub] = useState<Club | null>(null)
  const [bitsTeams, setBitsTeams] = useState<BitsTeam[]>([])
  const [ourTeams, setOurTeams] = useState<OurTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    params.then(async ({ bitsId }) => {
      const numId = Number(bitsId)
      const supabase = createClient()

      // Fetch club first — need the name to filter teams table
      const { data: c } = await supabase
        .from('bits_clubs')
        .select('bits_id, name, county, hall_name, is_active, logo_url')
        .eq('bits_id', numId).single()

      if (!c) { setLoading(false); return }
      setClub(c as Club)

      // Now fetch bits_teams + matching teams filtered by club name, + matches for division
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

      // Build teamId → division map
      const divMap: Record<string, string> = {}
      matchDiv?.forEach((m: any) => {
        if (m.division) {
          if (m.home_team_id) divMap[m.home_team_id] = m.division
          if (m.away_team_id) divMap[m.away_team_id] = m.division
        }
      })

      if (bt) setBitsTeams(bt as BitsTeam[])
      if (ot) setOurTeams((ot as any[]).map(t => ({ ...t, division: divMap[t.id] ?? null })))
      setLoading(false)
    })
  }, [params])

  // Match a bits team to one of our teams (by name similarity)
  function findOurTeam(bt: BitsTeam): OurTeam | null {
    const n = bt.name.toLowerCase()
    return ourTeams.find(t =>
      t.name.toLowerCase() === n ||
      t.name.toLowerCase().includes(n) ||
      n.includes(t.name.toLowerCase())
    ) ?? null
  }

  const logoSrc = club ? safeClubLogoUrl(club.logo_url, club.bits_id) : null

  const bg = isDark ? '#10161e' : '#f0f2f5'
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)'
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)'
  const textPrimary = isDark ? '#ffffff' : '#1a2535'
  const textSecondary = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'

  if (loading) return (
    <main style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: textSecondary }}>Laddar...</div>
    </main>
  )

  if (!club) return (
    <main style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: textSecondary }}>Klubben hittades inte</div>
    </main>
  )

  const initials = club.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
  const hue = club.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const teamsWithData = bitsTeams.filter(bt => findOurTeam(bt) !== null)

  return (
    <main style={{ minHeight: '100vh', background: bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>

        {/* Header */}
        <div style={{
          background: isDark ? 'linear-gradient(135deg, #0d1a2e 0%, #1a2840 100%)' : 'linear-gradient(135deg, #e8f0f8 0%, #d0e0f0 100%)',
          padding: '20px 20px 24px',
        }}>
          <button onClick={() => router.push('/teams')} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 12, color: textSecondary, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20,
          }}>
            ← Alla klubbar
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, flexShrink: 0, overflow: 'hidden',
              background: logoSrc && !logoFailed ? (isDark ? 'rgba(255,255,255,0.06)' : '#fff') : `hsla(${hue},50%,45%,0.15)`,
              border: logoSrc && !logoFailed ? (isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.10)') : `2px solid hsla(${hue},50%,45%,0.5)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: `hsl(${hue},50%,55%)`,
            }}>
              {logoSrc && !logoFailed
                ? <img src={logoSrc} alt={club.name} onError={() => setLogoFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                : initials
              }
            </div>

            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: textPrimary, marginBottom: 4 }}>
                {club.name}
              </h1>
              <div style={{ fontSize: 13, color: textSecondary }}>
                {[club.county, club.hall_name].filter(Boolean).join(' · ')}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(245,194,0,0.12)', border: '1px solid rgba(245,194,0,0.25)',
                  borderRadius: 8, padding: '4px 10px',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#f5c200' }}>{bitsTeams.length} lag</span>
                </div>
                {teamsWithData.length > 0 && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(56,160,136,0.12)', border: '1px solid rgba(56,160,136,0.25)',
                    borderRadius: 8, padding: '4px 10px',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#38a088' }}>{teamsWithData.length} med resultat</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Teams list */}
        <div style={{ padding: '16px 12px' }}>
          {bitsTeams.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              background: cardBg, border: cardBorder, borderRadius: 16,
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎳</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>
                Inga aktiva lag
              </div>
              <div style={{ fontSize: 13, color: textSecondary }}>
                Den här klubben har inga registrerade lag i BITS just nu
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, color: textSecondary, letterSpacing: 1.5, textTransform: 'uppercase', padding: '0 4px 12px' }}>
                Lag ({bitsTeams.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bitsTeams.map(bt => {
                  const ourTeam = findOurTeam(bt)
                  const href = ourTeam?.club_slug && ourTeam?.team_path
                    ? `/${ourTeam.club_slug}/${ourTeam.team_path}`
                    : ourTeam ? `/teams/${ourTeam.id}` : null
                  const typeLabel = teamTypeLabel(bt)

                  const inner = (
                    <div style={{
                      background: cardBg, border: cardBorder, borderRadius: 16,
                      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                      opacity: ourTeam ? 1 : 0.65,
                    }}>
                      {/* Type badge */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: ourTeam
                          ? isDark ? 'rgba(56,160,136,0.12)' : 'rgba(56,160,136,0.10)'
                          : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        border: ourTeam ? '1px solid rgba(56,160,136,0.30)' : cardBorder,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ourTeam ? '#38a088' : textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {bt.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {ourTeam?.division && (
                            <span style={{
                              fontSize: 10, fontWeight: 800,
                              color: divisionColor(ourTeam.division),
                              background: divisionColor(ourTeam.division) + '20',
                              borderRadius: 5, padding: '2px 7px',
                            }}>
                              {ourTeam.division}
                            </span>
                          )}
                          {typeLabel && !ourTeam?.division && (
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              color: ourTeam ? '#38a088' : textSecondary,
                              background: ourTeam ? 'rgba(56,160,136,0.12)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                              borderRadius: 5, padding: '2px 7px',
                            }}>
                              {typeLabel}
                            </span>
                          )}
                          {bt.hall_name && (
                            <span style={{ fontSize: 11, color: textSecondary }}>{bt.hall_name}</span>
                          )}
                          {!ourTeam && (
                            <span style={{ fontSize: 10, color: textSecondary, fontStyle: 'italic' }}>Inte i Bowlkollen än</span>
                          )}
                        </div>
                      </div>

                      {ourTeam && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      )}
                    </div>
                  )

                  return href ? (
                    <a key={bt.bits_team_id} href={href} style={{ textDecoration: 'none', display: 'block' }}>
                      {inner}
                    </a>
                  ) : (
                    <div key={bt.bits_team_id}>{inner}</div>
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
