'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sun, Moon, ChevronLeft, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { shortName } from '@/lib/utils'

type NavConfig = {
  logo: boolean
  title: string | null
  backHref: string | null
}

function getConfig(pathname: string): NavConfig {
  if (pathname === '/')          return { logo: true,  title: null,           backHref: null }
  if (pathname === '/schema')    return { logo: false, title: 'Schema',        backHref: null }
  if (pathname === '/league')    return { logo: false, title: 'Serietabell',   backHref: null }
  if (pathname === '/teams')     return { logo: false, title: 'Lag',           backHref: null }
  if (pathname === '/players')   return { logo: false, title: 'Spelare',       backHref: null }
  if (pathname === '/profile')   return { logo: false, title: 'Min profil',    backHref: null }
  if (pathname === '/mer')       return { logo: false, title: 'Utforska',       backHref: null }
  if (pathname === '/hallar')    return { logo: false, title: 'Bowlinghallar',  backHref: null }
  if (pathname === '/klotshopar') return { logo: false, title: 'Klotshopar',   backHref: null }
  if (pathname.startsWith('/hallar/'))    return { logo: false, title: 'Bowlinghall', backHref: '/hallar' }
  if (pathname === '/sllm')      return { logo: false, title: 'SLLM 2026',     backHref: null }
  if (pathname === '/login')     return { logo: false, title: 'Logga in',      backHref: null }
  if (pathname.startsWith('/players/'))  return { logo: false, title: 'Spelarprofil', backHref: '/players' }
  if (pathname.startsWith('/teams/'))    return { logo: false, title: 'Lag',          backHref: '/teams' }
  if (pathname.startsWith('/matches/'))  return { logo: false, title: 'Match',        backHref: '/schema' }
  if (pathname.startsWith('/club/'))     return { logo: false, title: 'Klubb',        backHref: '/teams' }
  return { logo: true, title: null, backHref: null }
}

type PlayerResult = { kind: 'player'; id: string; name: string; teamName: string }
type TeamResult   = { kind: 'team';   id: string; name: string; club: string; city: string; href: string }

export default function Nav() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [players, setPlayers] = useState<PlayerResult[]>([])
  const [teams, setTeams] = useState<TeamResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Focus input when search opens
  useEffect(() => {
    if (searching) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setPlayers([]); setTeams([]) }
  }, [searching])

  // Close search on route change
  useEffect(() => { setSearching(false) }, [pathname])

  // Debounced search across players + teams
  useEffect(() => {
    if (!query.trim()) { setPlayers([]); setTeams([]); return }
    const t = setTimeout(async () => {
      const supabase = createClient()
      const [{ data: ps }, { data: allTeams }, { data: ts }] = await Promise.all([
        supabase.from('players').select('id, name, team_id').ilike('name', `%${query}%`).limit(5),
        supabase.from('teams').select('id, name'),
        supabase.from('teams').select('id, name, club, city, club_slug, team_path')
          .or(`club.ilike.%${query}%,name.ilike.%${query}%,city.ilike.%${query}%`)
          .limit(10),
      ])
      const teamMap: Record<string, string> = {}
      allTeams?.forEach((t: any) => { teamMap[t.id] = t.name })
      setPlayers((ps || []).map((p: any) => ({ kind: 'player', id: p.id, name: p.name, teamName: shortName(teamMap[p.team_id] || '') })))

      // Deduplicate by club name, keep one entry per club
      const seen = new Set<string>()
      const clubResults: TeamResult[] = []
      for (const t of (ts || [])) {
        const club = t.club || shortName(t.name)
        if (seen.has(club)) continue
        seen.add(club)
        const href = t.club_slug ? `/${t.club_slug}` : `/teams/${t.id}`
        clubResults.push({ kind: 'team', id: t.id, name: shortName(t.name), club, city: t.city || '', href })
        if (clubResults.length >= 4) break
      }
      setTeams(clubResults)
    }, 220)
    return () => clearTimeout(t)
  }, [query])

  const hideNav = pathname.includes('/intern') || pathname.includes('/laguttagning') || pathname.includes('/tillganglighet')
  if (hideNav) return null

  const cfg = getConfig(pathname)
  const avatar = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email || ''
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const navBg = isDark
    ? (scrolled ? 'rgba(8,14,24,0.97)' : 'rgba(8,14,24,0.95)')
    : (scrolled ? 'rgba(245,242,236,0.97)' : 'rgba(245,242,236,0.95)')
  const borderBottom = `0.5px solid ${scrolled || searching ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : 'transparent'}`
  const mutedColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'
  const iconBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const textColor = isDark ? '#ffffff' : '#1a2535'

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: navBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom,
        transition: 'border-color 0.2s, background 0.2s',
        zIndex: 40,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 12px',
      }}>

        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {searching ? (
            <button onClick={() => setSearching(false)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0', WebkitTapHighlightColor: 'transparent' }}>
              <X size={20} color={mutedColor} />
            </button>
          ) : cfg.logo ? (
            <a href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: textColor, letterSpacing: -0.5 }}>
                Bowl<span style={{ color: '#f5c200' }}>kollen</span>
              </span>
            </a>
          ) : cfg.backHref ? (
            <a href={cfg.backHref} style={{ display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none', padding: '4px 6px 4px 0', WebkitTapHighlightColor: 'transparent' }}>
              <ChevronLeft size={22} color={isDark ? '#f5c200' : '#1a2535'} strokeWidth={2.5} />
              <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#f5c200' : '#1a2535' }}>Tillbaka</span>
            </a>
          ) : (
            <div />
          )}
        </div>

        {/* Center — search input or page title */}
        <div style={{ textAlign: 'center' }}>
          {searching ? (
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Sök spelare..."
              style={{
                width: 180, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 15, fontWeight: 500, color: textColor,
                textAlign: 'center',
              }}
            />
          ) : cfg.title ? (
            <span style={{ fontSize: 15, fontWeight: 700, color: textColor, letterSpacing: -0.2 }}>
              {cfg.title}
            </span>
          ) : null}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          {!searching && cfg.logo && (
            <a href="/sllm" style={{
              fontSize: 10, fontWeight: 700, color: '#f5c200',
              background: 'rgba(245,194,0,0.1)', border: '1px solid rgba(245,194,0,0.25)',
              borderRadius: 20, padding: '3px 9px', textDecoration: 'none', letterSpacing: 0.3,
            }}>
              SLLM
            </a>
          )}

          {/* Search pill */}
          {!searching && (
            <button onClick={() => setSearching(true)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: iconBg,
              border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: 20, padding: '5px 10px',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}>
              <Search size={13} color={mutedColor} />
              <span style={{ fontSize: 12, fontWeight: 600, color: mutedColor }}>Sök</span>
            </button>
          )}

          {!searching && (
            <button onClick={toggle} style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}>
              {isDark ? <Sun size={15} color={mutedColor} /> : <Moon size={15} color={mutedColor} />}
            </button>
          )}

          {!searching && (user ? (
            <a href="/profile" style={{ textDecoration: 'none', flexShrink: 0 }}>
              {avatar ? (
                <img src={avatar} alt={name} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(245,194,0,0.35)', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,194,0,0.12)', border: '1.5px solid rgba(245,194,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#f5c200' }}>
                  {initials}
                </div>
              )}
            </a>
          ) : (
            <a href="/login" style={{
              fontSize: 12, fontWeight: 600, color: mutedColor,
              background: iconBg,
              border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: 20, padding: '6px 12px', textDecoration: 'none',
            }}>
              Logga in
            </a>
          ))}
        </div>
      </header>

      {/* Search results dropdown */}
      {searching && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 38, background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)' }}
            onClick={() => setSearching(false)} />
          <div style={{
            position: 'fixed', top: 56, left: 0, right: 0, zIndex: 39,
            background: isDark ? '#172030' : '#ffffff',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            maxHeight: '60vh', overflowY: 'auto',
          }}>
            {!query.trim() && (
              <div style={{ padding: '16px 20px', fontSize: 13, color: mutedColor }}>
                Sök efter spelare, lag eller klubb...
              </div>
            )}
            {query.trim() && players.length === 0 && teams.length === 0 && (
              <div style={{ padding: '20px', fontSize: 13, color: mutedColor, textAlign: 'center' }}>
                Inga resultat hittades
              </div>
            )}

            {/* Players section */}
            {players.length > 0 && (
              <>
                <div style={{ padding: '10px 20px 4px', fontSize: 10, fontWeight: 700, color: mutedColor, letterSpacing: 1.5 }}>SPELARE</div>
                {players.map((p, i) => {
                  const hue = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                  const tc = `hsl(${hue},50%,45%)`
                  const tclo = isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`
                  const divider = `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                  return (
                    <a key={p.id} href={`/players/${p.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderTop: i > 0 ? divider : 'none', textDecoration: 'none', background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: tclo, border: `1.5px solid ${tc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tc, flexShrink: 0 }}>
                        {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{p.name}</div>
                        {p.teamName && <div style={{ fontSize: 11, color: mutedColor, marginTop: 1 }}>{p.teamName}</div>}
                      </div>
                      <ChevronLeft size={15} color={mutedColor} style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
                    </a>
                  )
                })}
              </>
            )}

            {/* Teams section */}
            {teams.length > 0 && (
              <>
                <div style={{ padding: '10px 20px 4px', fontSize: 10, fontWeight: 700, color: mutedColor, letterSpacing: 1.5, borderTop: players.length > 0 ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` : 'none' }}>LAG & KLUBBAR</div>
                {teams.map((t, i) => {
                  const hue = t.club.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                  const tc = `hsl(${hue},50%,45%)`
                  const tclo = isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`
                  const ini = t.club.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                  const divider = `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                  return (
                    <a key={t.id} href={t.href}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderTop: i > 0 ? divider : 'none', textDecoration: 'none', background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: tclo, border: `1.5px solid ${tc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tc, flexShrink: 0 }}>
                        {ini}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{t.club}</div>
                        {t.city && <div style={{ fontSize: 11, color: mutedColor, marginTop: 1 }}>{t.city}</div>}
                      </div>
                      <ChevronLeft size={15} color={mutedColor} style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
                    </a>
                  )
                })}
              </>
            )}

            {(players.length > 0 || teams.length > 0) && (
              <div style={{ display: 'flex', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <a href="/players" style={{ flex: 1, padding: '12px', fontSize: 12, fontWeight: 600, color: '#f5c200', textDecoration: 'none', textAlign: 'center' }}>
                  Alla spelare →
                </a>
                <a href="/teams" style={{ flex: 1, padding: '12px', fontSize: 12, fontWeight: 600, color: '#f5c200', textDecoration: 'none', textAlign: 'center', borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                  Alla lag →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
