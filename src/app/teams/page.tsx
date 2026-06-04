'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { useRouter } from 'next/navigation'
import { safeClubLogoUrl } from '@/lib/club-logo-url'

type Club = {
  bits_id: number
  name: string
  county: string | null
  hall_name: string | null
  logo_url: string | null
}

type BitsTeam = {
  bits_team_id: number
  name: string
  bits_club_id: number
  team_type_desc: string | null
}

// A team from the `teams` table that has played matches — has a real division
type RealTeam = {
  id: string
  name: string
  club: string
  division: string | null
}

const TIER_ORDER = ['Elitserien', 'Allsvenskan', 'Division 1', 'Division 2+', 'Övrigt']
const DIV_FILTERS = ['Alla', 'Elitserien', 'Allsvenskan', 'Division 1', 'Division 2+']

function divTier(div: string | null): string {
  if (!div) return 'Övrigt'
  if (div.includes('Elitserien')) return 'Elitserien'
  if (div.includes('Allsvenskan')) return 'Allsvenskan'
  if (div.startsWith('Div 1') || div.startsWith('Division 1')) return 'Division 1'
  return 'Division 2+'
}

function divColor(div: string | null): string {
  const t = divTier(div)
  if (t === 'Elitserien') return '#f5c200'
  if (t === 'Allsvenskan') return '#5a82b4'
  if (t === 'Division 1') return '#38a088'
  if (t === 'Division 2+') return '#9b6dbd'
  return 'rgba(160,175,200,0.55)'
}

function divFilterColor(f: string): string {
  if (f === 'Elitserien') return '#f5c200'
  if (f === 'Allsvenskan') return '#5a82b4'
  if (f === 'Division 1') return '#38a088'
  if (f === 'Division 2+') return '#9b6dbd'
  return '#f5c200'
}

function divLabel(div: string | null): string {
  if (!div) return '?'
  return div
    .replace('Sydallsvenskan', 'Syd Allsv').replace('Mellanallsvenskan', 'Mellan Allsv')
    .replace('Nordallsvenskan', 'Nord Allsv').replace('Södra Allsvenskan', 'S. Allsv')
    .replace('Norra Allsvenskan', 'N. Allsv').replace('Allsvenskan', 'Allsv')
    .replace('Elitserien', 'Elit')
    .replace(' Herrar', ' H').replace(' Damer', ' D')
    .replace('Div 1 ', 'D1 ').replace('Division 1 ', 'D1 ')
    .replace('Div 2 ', 'D2 ').replace('Division 2 ', 'D2 ')
    .replace('Norra ', 'N.').replace('Södra ', 'S.')
    .replace('Götaland', 'Götal').replace('Norrland', 'Norrl').replace('Svealand', 'Sveal')
}

function clubHue(name: string) {
  return name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
}

function clubInitials(name: string) {
  return name
    .replace(/^(IK|BK|SK|IF|IFK|FK|BSK|IBK)\s/, '')
    .split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
}

function ClubAvatar({ bitsId, name, storedUrl, isDark, tc, tclo, ini }: {
  bitsId: number; name: string; storedUrl: string | null
  isDark: boolean; tc: string; tclo: string; ini: string
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const src = safeClubLogoUrl(storedUrl, bitsId)
  const showImg = !imgFailed && !!src

  return (
    <div style={{
      width: 42, height: 42, borderRadius: 11, flexShrink: 0,
      background: showImg ? (isDark ? 'rgba(255,255,255,0.06)' : '#fff') : tclo,
      border: showImg ? (isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.08)') : `1.5px solid ${tc}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 800, color: tc, letterSpacing: 0.5,
      overflow: 'hidden',
    }}>
      {showImg
        ? <img src={src} alt={name} onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
        : ini
      }
    </div>
  )
}

export default function TeamsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()

  const [clubs, setClubs]           = useState<Club[]>([])
  // Map bits_club_id → bits_teams (for fallback team names when no matches)
  const [bitsTeams, setBitsTeams]   = useState<Record<number, BitsTeam[]>>({})
  // Map club name (from teams.club) → real teams with division
  const [realTeams, setRealTeams]   = useState<Record<string, RealTeam[]>>({})
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [county, setCounty]         = useState('Alla')
  const [divFilter, setDivFilter]   = useState('Alla')
  const [expanded, setExpanded]     = useState<Set<number>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      // Club metadata
      supabase.from('bits_clubs')
        .select('bits_id, name, county, hall_name, logo_url')
        .eq('is_active', true).order('name'),
      // Team names from BITS (correct columns)
      supabase.from('bits_teams')
        .select('bits_team_id, name, bits_club_id, team_type_desc'),
      // Real teams with club name (to match back to bits_clubs)
      supabase.from('teams')
        .select('id, name, club'),
      // Recent matches to derive division per team
      supabase.from('matches')
        .select('home_team_id, away_team_id, division')
        .not('division', 'is', null)
        .eq('status', 'completed')
        .limit(600),
    ]).then(([{ data: c }, { data: bt }, { data: t }, { data: m }]) => {
      if (c) setClubs(c as Club[])

      // Build bits_teams map: bits_club_id → teams[]
      if (bt) {
        const map: Record<number, BitsTeam[]> = {}
        ;(bt as BitsTeam[]).forEach(team => {
          if (!map[team.bits_club_id]) map[team.bits_club_id] = []
          map[team.bits_club_id].push(team)
        })
        setBitsTeams(map)
      }

      // Build teamId → division from matches
      const teamDiv: Record<string, string> = {}
      if (m) {
        m.forEach((match: any) => {
          if (match.division) {
            if (match.home_team_id) teamDiv[match.home_team_id] = match.division
            if (match.away_team_id) teamDiv[match.away_team_id] = match.division
          }
        })
      }

      // Build clubName → real teams[] with division
      if (t) {
        const map: Record<string, RealTeam[]> = {}
        ;(t as any[]).forEach(team => {
          const div = teamDiv[team.id] ?? null
          const clubName = team.club ?? ''
          if (!map[clubName]) map[clubName] = []
          // Deduplicate: one entry per (name, division)
          const alreadyExists = map[clubName].some(x => x.id === team.id)
          if (!alreadyExists) {
            map[clubName].push({ id: team.id, name: team.name, club: clubName, division: div })
          }
        })
        // Sort each club's teams by tier
        Object.keys(map).forEach(k => {
          map[k].sort((a, b) =>
            TIER_ORDER.indexOf(divTier(a.division)) - TIER_ORDER.indexOf(divTier(b.division))
          )
        })
        setRealTeams(map)
      }

      setLoading(false)
    })
  }, [])

  const counties = useMemo(() => {
    const set = new Set<string>()
    clubs.forEach(c => { if (c.county) set.add(c.county) })
    return ['Alla', ...Array.from(set).sort()]
  }, [clubs])

  // For each club, get the best available teams list:
  // prefer realTeams (have division), fall back to bitsTeams (just names)
  function getTeamsForClub(club: Club): { id: string; name: string; division: string | null; isReal: boolean }[] {
    const real = realTeams[club.name] ?? []
    if (real.length > 0) return real.map(t => ({ ...t, isReal: true }))
    // Fallback: bits_teams (no division info)
    const bits = bitsTeams[club.bits_id] ?? []
    return bits.map(t => ({ id: String(t.bits_team_id), name: t.name, division: null, isReal: false }))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return clubs.filter(c => {
      if (county !== 'Alla' && c.county !== county) return false
      if (q && !c.name.toLowerCase().includes(q) && !c.hall_name?.toLowerCase().includes(q)) return false
      if (divFilter !== 'Alla') {
        const teams = getTeamsForClub(c)
        if (!teams.some(t => divTier(t.division) === divFilter)) return false
      }
      return true
    })
  }, [clubs, search, county, divFilter, realTeams, bitsTeams])

  const toggle = (id: number) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  // Theme tokens
  const bg         = isDark ? '#10161e' : '#f0f2f5'
  const cardBg     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.88)'
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)'
  const rowBorder  = isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
  const expandBg   = isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)'
  const txt        = isDark ? '#ffffff' : '#1a2535'
  const muted      = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)'
  const inputBg    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const inputBorder= isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.09)'

  if (loading) {
    const sk = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
    const S = ({ w = '100%', h = 11, r = 5 }: { w?: string | number; h?: number; r?: number }) => (
      <div style={{ width: w, height: h, borderRadius: r, background: sk, flexShrink: 0 }} />
    )
    return (
      <main style={{ minHeight: '100vh', background: bg, fontFamily: 'system-ui, sans-serif' }}>
        <style>{`@keyframes sk{0%,100%{opacity:.4}50%{opacity:.9}}.sk>*{animation:sk 1.6s ease-in-out infinite}`}</style>
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ height: 44, borderRadius: 14, background: sk }} />
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '10px 16px 0', overflow: 'hidden' }}>
          {[56, 64, 72, 56, 68].map((w, i) => (
            <div key={i} style={{ width: w, height: 28, borderRadius: 20, background: sk, flexShrink: 0 }} />
          ))}
        </div>
        <div className="sk" style={{ maxWidth: 600, margin: '0 auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ borderRadius: 16, padding: '13px 14px', background: cardBg, border: cardBorder, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: sk, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <S w={`${45 + (i % 4) * 12}%`} h={13} />
                <S w="35%" h={9} />
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0, 1, ...(i % 3 === 0 ? [2] : [])].map(j => (
                    <div key={j} style={{ width: 44, height: 18, borderRadius: 6, background: sk }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: bg, fontFamily: 'system-ui, sans-serif' }}>

      {/* Search */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: inputBg, border: inputBorder, borderRadius: 14, padding: '10px 14px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Sök klubb eller hall..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: txt }} />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: muted, fontSize: 18, lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* County chips */}
      <div style={{ display: 'flex', gap: 7, padding: '10px 16px 0', overflowX: 'auto', scrollbarWidth: 'none' } as React.CSSProperties}>
        {counties.map(c => {
          const active = county === c
          return (
            <button key={c} onClick={() => setCounty(c)} style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 700,
              border: active ? '1px solid rgba(245,194,0,0.50)' : isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.12)',
              background: active ? 'rgba(245,194,0,0.10)' : 'transparent',
              color: active ? '#f5c200' : muted,
              WebkitTapHighlightColor: 'transparent',
            }}>
              {c}
            </button>
          )
        })}
      </div>

      {/* Division filter chips */}
      <div style={{ display: 'flex', gap: 7, padding: '7px 16px 0', overflowX: 'auto', scrollbarWidth: 'none' } as React.CSSProperties}>
        {DIV_FILTERS.map(f => {
          const active = divFilter === f
          const clr = divFilterColor(f)
          return (
            <button key={f} onClick={() => setDivFilter(f)} style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 700,
              border: active ? `1px solid ${clr}66` : isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.12)',
              background: active ? `${clr}18` : 'transparent',
              color: active ? clr : muted,
              WebkitTapHighlightColor: 'transparent',
            }}>
              {f}
            </button>
          )
        })}
      </div>

      {/* Count */}
      <div style={{ padding: '8px 20px 4px', fontSize: 11, color: muted, fontWeight: 500 }}>
        {filtered.length} klubbar{divFilter !== 'Alla' ? ` · ${divFilter}` : ''}{county !== 'Alla' ? ` · ${county}` : ''}
      </div>

      {/* Club list */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '4px 12px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {filtered.map(club => {
          const teams     = getTeamsForClub(club)
          const isExpanded = expanded.has(club.bits_id)
          const hue  = clubHue(club.name)
          const tc   = `hsl(${hue},50%,45%)`
          const tclo = isDark ? `hsl(${hue},40%,14%)` : `hsl(${hue},40%,92%)`
          const ini  = clubInitials(club.name)

          // Unique division badges — deduplicate same tier+gender
          const seen = new Set<string>()
          const badges = teams.filter(t => {
            if (!t.division) return false
            const key = t.division
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })

          return (
            <div key={club.bits_id} style={{
              borderRadius: 16, overflow: 'hidden',
              background: cardBg, border: cardBorder,
              boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 1px 5px rgba(0,0,0,0.06)',
            }}>
              {/* Club header */}
              <button onClick={() => toggle(club.bits_id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left', WebkitTapHighlightColor: 'transparent',
              }}>
                {/* Avatar — BITS logo with color-initials fallback */}
                <ClubAvatar bitsId={club.bits_id} name={club.name} storedUrl={club.logo_url} isDark={isDark} tc={tc} tclo={tclo} ini={ini} />

                {/* Name + county + division badges */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                    {club.name}
                  </div>
                  <div style={{ fontSize: 11, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: badges.length > 0 ? 7 : 0 }}>
                    {[club.county, club.hall_name].filter(Boolean).join(' · ')}
                  </div>
                  {badges.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {badges.map(t => {
                        const clr = divColor(t.division)
                        return (
                          <span key={t.id} style={{
                            fontSize: 9, fontWeight: 800, letterSpacing: 0.4,
                            color: clr, background: `${clr}1a`, border: `1px solid ${clr}44`,
                            borderRadius: 5, padding: '2px 6px', whiteSpace: 'nowrap',
                          }}>
                            {divLabel(t.division)}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Team count + arrow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {teams.length > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: muted,
                      background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                      borderRadius: 8, padding: '3px 8px',
                    }}>
                      {teams.length} lag
                    </span>
                  )}
                  <div style={{
                    color: muted, fontSize: 20, fontWeight: 300, lineHeight: 1,
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.18s ease',
                  }}>
                    ›
                  </div>
                </div>
              </button>

              {/* Expanded team rows */}
              {isExpanded && (
                <div style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)' }}>
                  {teams.length === 0 ? (
                    <div style={{ padding: '14px 16px', fontSize: 12, color: muted }}>Inga registrerade lag</div>
                  ) : teams.map((t, i) => {
                    const clr = divColor(t.division)
                    return (
                      <button key={t.id}
                        onClick={() => t.isReal ? router.push(`/teams/${t.id}`) : router.push(`/clubs/${club.bits_id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '11px 14px 11px 16px', width: '100%',
                          background: expandBg, border: 'none',
                          borderTop: i > 0 ? rowBorder : 'none',
                          cursor: 'pointer', textAlign: 'left',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = expandBg)}
                      >
                        <div style={{ width: 3, height: 32, borderRadius: 2, background: clr, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.name}
                          </div>
                          <div style={{ fontSize: 11, marginTop: 1, fontWeight: 700, color: t.division ? clr : muted }}>
                            {t.division ?? 'Inga matcher registrerade'}
                          </div>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    )
                  })}

                  {/* Club page link */}
                  <button
                    onClick={() => router.push(`/clubs/${club.bits_id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      width: '100%', padding: '10px 14px',
                      background: 'transparent', border: 'none',
                      borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                      cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>Klubbsida</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: muted, fontSize: 14 }}>
            Inga klubbar hittades
          </div>
        )}
      </div>
    </main>
  )
}
