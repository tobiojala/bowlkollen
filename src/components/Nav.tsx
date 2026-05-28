'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sun, Moon, ChevronLeft, Search, X, Menu, MapPin, ShoppingBag, Droplets, User } from 'lucide-react'
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
  if (pathname === '/tavlingar')  return { logo: false, title: 'Tävlingar',     backHref: null }
  if (pathname === '/mer')        return { logo: false, title: 'Utforska',      backHref: '/' }
  if (pathname === '/hallar')    return { logo: false, title: 'Bowlinghallar',  backHref: '/hallar' }
  if (pathname === '/klotshopar') return { logo: false, title: 'Klotshopar',   backHref: '/klotshopar' }
  if (pathname.startsWith('/hallar/'))      return { logo: false, title: 'Bowlinghall',  backHref: '/hallar' }
  if (pathname === '/oljeprofiler')         return { logo: false, title: 'Oljeprofiler', backHref: '/mer' }
  if (pathname === '/sllm')      return { logo: false, title: 'SLLM 2026',     backHref: null }
  if (pathname === '/legal')     return { logo: false, title: 'Legal',          backHref: '/' }
  if (pathname === '/login')     return { logo: false, title: 'Logga in',      backHref: null }
  if (pathname.startsWith('/players/'))       return { logo: false, title: 'Spelarprofil',  backHref: '/players' }
  if (pathname.startsWith('/teams/'))         return { logo: false, title: 'Lag',            backHref: '/teams' }
  if (pathname.startsWith('/matches/'))       return { logo: false, title: 'Match',          backHref: '/schema' }
  if (pathname.startsWith('/club/'))          return { logo: false, title: 'Klubb',          backHref: '/teams' }
  if (pathname.startsWith('/compare/teams/')) return { logo: false, title: 'Lagsjämförelse', backHref: null }
  if (pathname.startsWith('/compare/'))       return { logo: false, title: 'Jämförelse',     backHref: '/players' }
  return { logo: true, title: null, backHref: null }
}

type PlayerResult = { kind: 'player'; id: string; name: string; teamName: string }
type TeamResult   = { kind: 'team';   id: string; name: string; club: string; city: string; href: string }

export default function Nav() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [claimedPlayerId, setClaimedPlayerId] = useState<string | null>(null)
  const [, setScrolled] = useState(false)
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  const [searching, setSearching] = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
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
    if (!user) { setClaimedPlayerId(null); return }
    const supabase = createClient()
    supabase.from('player_claims').select('player_id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setClaimedPlayerId(data?.player_id || null))
  }, [user])

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

  // Close overlays on route change
  useEffect(() => { setSearching(false); setMenuOpen(false) }, [pathname])

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
    ? 'rgba(255,255,255,0.06)'
    : 'rgba(255,255,255,0.30)'
  const borderBottom = isDark
    ? '0.5px solid rgba(255,255,255,0.22)'
    : '0.5px solid rgba(255,255,255,0.75)'
  const navShadow = isDark
    ? [
        'inset 0 1px 0 rgba(255,255,255,0.50)',
        'inset 0 -0.5px 0 rgba(255,255,255,0.06)',
        '0 4px 24px rgba(0,0,0,0.40)',
      ].join(', ')
    : [
        'inset 0 1px 0 rgba(255,255,255,0.90)',
        'inset 0 -0.5px 0 rgba(0,0,0,0.05)',
        '0 4px 20px rgba(0,0,0,0.09)',
      ].join(', ')
  const mutedColor = isDark ? 'rgba(255,255,255,0.82)' : 'rgba(20,30,55,0.60)'
  const iconBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.055)'
  const textColor = isDark ? '#ffffff' : '#1a2535'

  return (
    <>
      {/* Global gold glow below nav */}
      <div style={{
        position: 'fixed', top: 56, left: 0, right: 0, height: 90,
        background: isDark
          ? 'linear-gradient(180deg, rgba(245,194,0,0.07) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(245,194,0,0.05) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 39,
      }} />

      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        zIndex: 40,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        padding: '0 12px',
      }}>
        {/* Glass + lens warp — reuses same filter id as bottom pill */}
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          backdropFilter: 'blur(2px) saturate(160%) brightness(1.08)',
          WebkitBackdropFilter: 'blur(2px) saturate(160%) brightness(1.08)',
          background: navBg,
          filter: 'url(#bk-pill-lens)',
        }} />
        {/* Specular rim — sibling, no filter */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          borderBottom, boxShadow: navShadow, transition: 'box-shadow 0.25s',
        }} />

        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
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
        <div style={{ textAlign: 'center', overflow: 'hidden', minWidth: 0, padding: '0 8px', position: 'relative', zIndex: 1 }}>
          {searching ? (
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Sök spelare..."
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                fontSize: 15, fontWeight: 500, color: textColor,
                textAlign: 'center',
              }}
            />
          ) : cfg.title ? (
            <span style={{ fontSize: 15, fontWeight: 700, color: textColor, letterSpacing: -0.2, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cfg.title}
            </span>
          ) : null}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, position: 'relative', zIndex: 1 }}>
          {/* Search */}
          {!searching && (
            <button onClick={() => setSearching(true)} style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <Search size={16} color={mutedColor} />
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
            <a href={claimedPlayerId ? `/players/${claimedPlayerId}` : '/profile'} style={{ textDecoration: 'none', flexShrink: 0 }}>
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
              width: 32, height: 32, borderRadius: '50%',
              background: iconBg, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', flexShrink: 0,
            }}>
              <User size={16} color={mutedColor} />
            </a>
          ))}

          {!searching && (
            <button onClick={() => setMenuOpen(o => !o)} style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: menuOpen ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <Menu size={15} color={mutedColor} />
            </button>
          )}
        </div>
      </header>

      {/* Burger menu dropdown */}
      {menuOpen && !searching && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 38, background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)' }}
            onClick={() => setMenuOpen(false)} />
          <div style={{
            position: 'fixed', top: 60, right: 12, zIndex: 39, width: 236,
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.40)',
            backdropFilter: 'blur(6px) saturate(180%) brightness(1.12)',
            WebkitBackdropFilter: 'blur(6px) saturate(180%) brightness(1.12)',
            border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.85)'}`,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: isDark
              ? 'inset 0 1.5px 0 rgba(255,255,255,0.18), 0 12px 40px rgba(0,0,0,0.40)'
              : 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 12px 40px rgba(0,0,0,0.12)',
          }}>
            <div style={{ padding: '10px 16px 6px', fontSize: 9, fontWeight: 800, color: mutedColor, letterSpacing: 1.5 }}>
              UTFORSKA
            </div>
            {[
              { href: '/hallar',      icon: MapPin,      label: 'Bowlinghallar', sub: '174 hallar i Sverige' },
              { href: '/klotshopar',  icon: ShoppingBag, label: 'Klotshopar',    sub: '16 pro shops' },
              { href: '/oljeprofiler',icon: Droplets,    label: 'Oljeprofiler',  sub: 'Säsong 2025/2026' },
            ].map(({ href, icon: Icon, label, sub }) => (
              <a key={href} href={href}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                  textDecoration: 'none', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}
                onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(245,194,0,0.08)', border: '1px solid rgba(245,194,0,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color="#f5c200" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{label}</div>
                  <div style={{ fontSize: 10, color: mutedColor, marginTop: 1 }}>{sub}</div>
                </div>
              </a>
            ))}
            <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, padding: '10px 16px' }}>
              <a href="/mer" style={{ fontSize: 12, fontWeight: 600, color: mutedColor, textDecoration: 'none' }}>
                Visa mer →
              </a>
            </div>
          </div>
        </>
      )}

      {/* Search results dropdown */}
      {searching && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 38, background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)' }}
            onClick={() => setSearching(false)} />
          <div style={{
            position: 'fixed', top: 56, left: 0, right: 0, zIndex: 39,
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.40)',
            backdropFilter: 'blur(6px) saturate(180%) brightness(1.12)',
            WebkitBackdropFilter: 'blur(6px) saturate(180%) brightness(1.12)',
            borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.70)'}`,
            boxShadow: isDark
              ? 'inset 0 -1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.30)'
              : 'inset 0 -1px 0 rgba(255,255,255,0.80), 0 8px 24px rgba(0,0,0,0.08)',
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
