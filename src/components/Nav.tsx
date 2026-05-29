'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sun, Moon, ChevronLeft, Search, X, Menu, MapPin, ShoppingBag, Droplets, User } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { shortName } from '@/lib/utils'

type NavConfig = {
  backHref: string | null
}

function getConfig(pathname: string): NavConfig {
  if (pathname.startsWith('/hallar/'))           return { backHref: '/hallar' }
  if (pathname === '/mer')                       return { backHref: '/' }
  if (pathname === '/oljeprofiler')              return { backHref: '/mer' }
  if (pathname.startsWith('/players/'))          return { backHref: '/players' }
  if (pathname.startsWith('/teams/'))            return { backHref: '/teams' }
  if (pathname.startsWith('/matches/'))          return { backHref: '/schema' }
  if (pathname.startsWith('/club/'))             return { backHref: '/teams' }
  if (pathname.startsWith('/compare/teams/'))    return { backHref: null }
  if (pathname.startsWith('/compare/'))          return { backHref: '/players' }
  return { backHref: null }
}

type PlayerResult = { kind: 'player'; id: string; name: string; teamName: string }
type TeamResult   = { kind: 'team';   id: string; name: string; club: string; city: string; href: string }

export default function Nav() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [claimedPlayerId, setClaimedPlayerId] = useState<string | null>(null)
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  const [searching, setSearching] = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const [players, setPlayers] = useState<PlayerResult[]>([])
  const [teams, setTeams]     = useState<TeamResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setClaimedPlayerId(null); return }
    const supabase = createClient()
    supabase.from('player_claims').select('player_id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setClaimedPlayerId(data?.player_id || null))
  }, [user])

  useEffect(() => {
    if (searching) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setPlayers([]); setTeams([]) }
  }, [searching])

  useEffect(() => { setSearching(false); setMenuOpen(false) }, [pathname])

  useEffect(() => {
    if (!query.trim()) { setPlayers([]); setTeams([]); return }
    const t = setTimeout(async () => {
      const supabase = createClient()
      const [{ data: ps }, { data: allTeams }, { data: ts }] = await Promise.all([
        supabase.from('players').select('id, name, team_id').ilike('name', `%${query}%`).limit(5),
        supabase.from('teams').select('id, name'),
        supabase.from('teams').select('id, name, club, city, club_slug, team_path')
          .or(`club.ilike.%${query}%,name.ilike.%${query}%,city.ilike.%${query}%`).limit(10),
      ])
      const teamMap: Record<string, string> = {}
      allTeams?.forEach((t: any) => { teamMap[t.id] = t.name })
      setPlayers((ps || []).map((p: any) => ({ kind: 'player', id: p.id, name: p.name, teamName: shortName(teamMap[p.team_id] || '') })))
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
  const avatar   = user?.user_metadata?.avatar_url
  const name     = user?.user_metadata?.full_name || user?.email || ''
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const mutedColor = isDark ? 'rgba(255,255,255,0.82)' : 'rgba(20,30,55,0.60)'
  const textColor  = isDark ? '#ffffff' : '#1a2535'

  const glass: React.CSSProperties = {
    position: 'absolute', inset: 0, overflow: 'hidden',
    backdropFilter: 'blur(2px) saturate(160%) brightness(1.08)',
    WebkitBackdropFilter: 'blur(2px) saturate(160%) brightness(1.08)',
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.28)',
  }
  const rim: React.CSSProperties = {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    border: isDark ? '0.5px solid rgba(255,255,255,0.28)' : '0.5px solid rgba(255,255,255,0.80)',
    boxShadow: isDark
      ? 'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -0.5px 0 rgba(255,255,255,0.08), inset 1px 0 0 rgba(255,255,255,0.10), inset -1px 0 0 rgba(255,255,255,0.10), 0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.28)'
      : 'inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -0.5px 0 rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)',
  }
  const iconBtn: React.CSSProperties = {
    position: 'relative', zIndex: 1,
    width: 36, height: 36, borderRadius: '50%',
    border: 'none', cursor: 'pointer',
    background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
    flexShrink: 0,
  }

  const pillR = 22

  return (
    <>
      {/* Subtle gold glow — starts at top so no bare background shows behind pills */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 136,
        background: isDark
          ? 'linear-gradient(180deg, rgba(245,194,0,0.07) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(245,194,0,0.04) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 39,
      }} />

      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        zIndex: 40,
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 8,
        pointerEvents: 'none',
      }}>

        {/* ── LEFT PILL: logo / back / cancel ── */}
        {searching ? (
          <button
            onClick={() => setSearching(false)}
            style={{
              pointerEvents: 'auto', flexShrink: 0,
              position: 'relative', height: 44, borderRadius: pillR,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 14px 0 10px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ ...glass, borderRadius: pillR }} />
            <div style={{ ...rim,   borderRadius: pillR }} />
            <X size={16} color={mutedColor} style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ position: 'relative', zIndex: 1, fontSize: 14, fontWeight: 600, color: mutedColor }}>
              Avbryt
            </span>
          </button>
        ) : cfg.backHref ? (
          <a
            href={cfg.backHref}
            style={{
              pointerEvents: 'auto', flexShrink: 0,
              position: 'relative', height: 44, borderRadius: pillR,
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0 14px 0 8px',
              textDecoration: 'none',
            }}
          >
            <div style={{ ...glass, borderRadius: pillR }} />
            <div style={{ ...rim,   borderRadius: pillR }} />
            <ChevronLeft size={20} color={isDark ? '#f5c200' : '#1a2535'} strokeWidth={2.5} style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ position: 'relative', zIndex: 1, fontSize: 14, fontWeight: 600, color: isDark ? '#f5c200' : '#1a2535' }}>
              Tillbaka
            </span>
          </a>
        ) : (
          <a
            href="/"
            style={{
              pointerEvents: 'auto', flexShrink: 0,
              position: 'relative', height: 44, borderRadius: pillR,
              display: 'flex', alignItems: 'center',
              padding: '0 20px',
              textDecoration: 'none',
            }}
          >
            <div style={{ ...glass, borderRadius: pillR }} />
            <div style={{ ...rim,   borderRadius: pillR }} />
            <span style={{ position: 'relative', zIndex: 1, fontSize: 17, fontWeight: 900, color: textColor, letterSpacing: -0.5 }}>
              Bowl<span style={{ color: '#f5c200' }}>kollen</span>
            </span>
          </a>
        )}

        {/* ── SEARCH INPUT PILL (replaces right pill while searching) ── */}
        {searching && (
          <div style={{
            pointerEvents: 'auto', flex: 1,
            position: 'relative', height: 44, borderRadius: pillR,
            display: 'flex', alignItems: 'center',
            padding: '0 14px', gap: 8,
          }}>
            <div style={{ ...glass, borderRadius: pillR }} />
            <div style={{ ...rim,   borderRadius: pillR }} />
            <Search size={14} color={mutedColor} style={{ position: 'relative', zIndex: 1, flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Sök spelare eller lag..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 14, fontWeight: 500, color: textColor,
                position: 'relative', zIndex: 1,
              }}
            />
          </div>
        )}

        {/* ── RIGHT PILL: search · theme · profile · menu ── */}
        {!searching && (
          <div style={{
            pointerEvents: 'auto', flexShrink: 0, marginLeft: 'auto',
            position: 'relative', height: 44, borderRadius: pillR,
            display: 'flex', alignItems: 'center',
            padding: '0 4px',
          }}>
            <div style={{ ...glass, borderRadius: pillR }} />
            <div style={{ ...rim,   borderRadius: pillR }} />

            <button onClick={() => setSearching(true)} style={iconBtn}>
              <Search size={16} color={mutedColor} />
            </button>

            <button onClick={toggle} style={iconBtn}>
              {isDark ? <Sun size={15} color={mutedColor} /> : <Moon size={15} color={mutedColor} />}
            </button>

            {user ? (
              <a href={claimedPlayerId ? `/players/${claimedPlayerId}` : '/profile'} style={{ ...iconBtn, textDecoration: 'none' }}>
                {avatar ? (
                  <img src={avatar} alt={name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(245,194,0,0.35)' }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,194,0,0.12)', border: '1.5px solid rgba(245,194,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#f5c200' }}>
                    {initials}
                  </div>
                )}
              </a>
            ) : (
              <a href="/login" style={{ ...iconBtn, textDecoration: 'none' }}>
                <User size={16} color={mutedColor} />
              </a>
            )}

            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ ...iconBtn, background: menuOpen ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)') : 'transparent' }}
            >
              <Menu size={15} color={mutedColor} />
            </button>
          </div>
        )}
      </header>

      {/* ── BURGER MENU DROPDOWN ── */}
      {menuOpen && !searching && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 38, background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)' }}
            onClick={() => setMenuOpen(false)} />
          <div style={{
            position: 'fixed', top: 60, right: 16, zIndex: 39, width: 236,
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.40)',
            backdropFilter: 'blur(6px) saturate(180%) brightness(1.12)',
            WebkitBackdropFilter: 'blur(6px) saturate(180%) brightness(1.12)',
            border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.85)'}`,
            borderRadius: 20, overflow: 'hidden',
            boxShadow: isDark
              ? 'inset 0 1.5px 0 rgba(255,255,255,0.18), 0 12px 40px rgba(0,0,0,0.40)'
              : 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 12px 40px rgba(0,0,0,0.12)',
          }}>
            <div style={{ padding: '10px 16px 6px', fontSize: 9, fontWeight: 800, color: mutedColor, letterSpacing: 1.5 }}>
              UTFORSKA
            </div>
            {[
              { href: '/hallar',       icon: MapPin,      label: 'Bowlinghallar', sub: '174 hallar i Sverige' },
              { href: '/klotshopar',   icon: ShoppingBag, label: 'Klotshopar',    sub: '16 pro shops' },
              { href: '/oljeprofiler', icon: Droplets,    label: 'Oljeprofiler',  sub: 'Säsong 2025/2026' },
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

      {/* ── SEARCH RESULTS OVERLAY ── */}
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

            {players.length > 0 && (
              <>
                <div style={{ padding: '10px 20px 4px', fontSize: 10, fontWeight: 700, color: mutedColor, letterSpacing: 1.5 }}>SPELARE</div>
                {players.map((p, i) => {
                  const hue = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                  const tc  = `hsl(${hue},50%,45%)`
                  const bg  = isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`
                  return (
                    <a key={p.id} href={`/players/${p.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderTop: i > 0 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none', textDecoration: 'none', background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, border: `1.5px solid ${tc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tc, flexShrink: 0 }}>
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

            {teams.length > 0 && (
              <>
                <div style={{ padding: '10px 20px 4px', fontSize: 10, fontWeight: 700, color: mutedColor, letterSpacing: 1.5, borderTop: players.length > 0 ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` : 'none' }}>LAG & KLUBBAR</div>
                {teams.map((t, i) => {
                  const hue = t.club.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                  const tc  = `hsl(${hue},50%,45%)`
                  const bg  = isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`
                  const ini = t.club.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <a key={t.id} href={t.href}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderTop: i > 0 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none', textDecoration: 'none', background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, border: `1.5px solid ${tc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tc, flexShrink: 0 }}>
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
