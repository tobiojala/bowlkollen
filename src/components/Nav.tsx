'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, Search, X, Menu, MapPin, ShoppingBag, Droplets, User } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import { hslNameBadgeStyle } from '@/lib/team-ui'
import { GlassPill } from '@/components/ui'

type NavConfig = { backHref: string | null }

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
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [claimedPlayerId, setClaimedPlayerId] = useState<string | null>(null)

  const [searching, setSearching] = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
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
      allTeams?.forEach((t: { id: string; name: string }) => { teamMap[t.id] = t.name })
      setPlayers((ps || []).map((p: { id: string; name: string; team_id: string }) => ({
        kind: 'player', id: p.id, name: p.name, teamName: shortName(teamMap[p.team_id] || ''),
      })))
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
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const rowHover = 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'

  return (
    <>
      <div className="bk-nav-glow" aria-hidden />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 px-4">
        {/* Left pill */}
        {searching ? (
          <button
            type="button"
            onClick={() => setSearching(false)}
            className="pointer-events-auto shrink-0 border-0 bg-transparent p-0"
          >
            <GlassPill className="flex h-11 items-center gap-1.5 px-2.5">
              <X size={16} className="bk-text-muted" />
              <span className="text-sm font-semibold bk-text-muted">Avbryt</span>
            </GlassPill>
          </button>
        ) : cfg.backHref ? (
          <Link href={cfg.backHref} className="pointer-events-auto shrink-0 no-underline">
            <GlassPill className="flex h-11 items-center gap-1 px-2 pr-3.5">
              <ChevronLeft size={20} className="text-gold" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-[#1a2535] dark:text-gold">Tillbaka</span>
            </GlassPill>
          </Link>
        ) : (
          <Link href="/" className="pointer-events-auto shrink-0 no-underline">
            <GlassPill className="flex h-11 items-center px-5">
              <span className="text-[17px] font-black tracking-tight bk-text-primary">
                Bowl<span className="text-gold">kollen</span>
              </span>
            </GlassPill>
          </Link>
        )}

        {searching && (
          <GlassPill className="pointer-events-auto relative flex h-11 flex-1 items-center gap-2 px-3.5">
            <Search size={14} className="relative z-[1] shrink-0 bk-text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Sök spelare eller lag..."
              className="relative z-[1] min-w-0 flex-1 border-0 bg-transparent text-sm font-medium outline-none bk-text-primary"
            />
          </GlassPill>
        )}

        {!searching && (
          <GlassPill className="pointer-events-auto relative ml-auto flex h-11 shrink-0 items-center px-1">
            <button type="button" onClick={() => setSearching(true)} className="bk-icon-btn">
              <Search size={16} className="bk-text-muted" />
            </button>

            {user ? (
              <Link
                href={claimedPlayerId ? `/players/${claimedPlayerId}` : '/profile'}
                className="bk-icon-btn no-underline"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="h-7 w-7 rounded-full border-[1.5px] border-gold/35 object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-gold/35 bg-gold/10 text-[10px] font-bold text-gold">
                    {initials}
                  </div>
                )}
              </Link>
            ) : (
              <Link href="/login" className="bk-icon-btn no-underline">
                <User size={16} className="bk-text-muted" />
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              className={cn('bk-icon-btn', menuOpen && 'bg-black/10 dark:bg-white/10')}
            >
              <Menu size={15} className="bk-text-muted" />
            </button>
          </GlassPill>
        )}
      </header>

      {menuOpen && !searching && (
        <>
          <button
            type="button"
            aria-label="Stäng meny"
            className="fixed inset-0 z-[38] bg-black/15 dark:bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="bk-menu-panel fixed top-[60px] right-4 z-[39] w-[236px]">
            <div className="px-4 pt-2.5 pb-1.5 text-[9px] font-extrabold tracking-widest bk-text-muted">
              UTFORSKA
            </div>
            {[
              { href: '/hallar',       icon: MapPin,      label: 'Bowlinghallar', sub: '174 hallar i Sverige' },
              { href: '/klotshopar',   icon: ShoppingBag, label: 'Klotshopar',    sub: '16 pro shops' },
              { href: '/oljeprofiler', icon: Droplets,    label: 'Oljeprofiler',  sub: 'Säsong 2025/2026' },
            ].map(({ href, icon: Icon, label, sub }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 border-t border-black/5 px-4 py-2.5 no-underline',
                  'dark:border-white/5',
                  rowHover,
                )}
              >
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border border-gold/20 bg-gold/[0.08]">
                  <Icon size={16} className="text-gold" />
                </div>
                <div>
                  <div className="text-[13px] font-bold bk-text-primary">{label}</div>
                  <div className="mt-px text-[10px] bk-text-muted">{sub}</div>
                </div>
              </Link>
            ))}
            <div className="border-t border-black/6 px-4 py-2.5 dark:border-white/6">
              <Link href="/mer" className="text-xs font-semibold bk-text-muted no-underline">
                Visa mer →
              </Link>
            </div>
          </div>
        </>
      )}

      {searching && (
        <>
          <button
            type="button"
            aria-label="Stäng sök"
            className="fixed inset-0 z-[38] bg-black/20 dark:bg-black/50"
            onClick={() => setSearching(false)}
          />
          <div
            className={cn(
              'bk-menu-panel fixed inset-x-0 top-14 z-[39] max-h-[60vh] overflow-y-auto rounded-none border-x-0',
            )}
          >
            {!query.trim() && (
              <p className="px-5 py-4 text-[13px] bk-text-muted">Sök efter spelare, lag eller klubb...</p>
            )}
            {query.trim() && players.length === 0 && teams.length === 0 && (
              <p className="px-5 py-5 text-center text-[13px] bk-text-muted">Inga resultat hittades</p>
            )}

            {players.length > 0 && (
              <>
                <div className="px-5 pt-2.5 pb-1 text-[10px] font-bold tracking-widest bk-text-muted">SPELARE</div>
                {players.map((p, i) => {
                  return (
                    <Link
                      key={p.id}
                      href={`/players/${p.id}`}
                      className={cn(
                        'flex items-center gap-3 px-5 py-2.5 no-underline',
                        i > 0 && 'border-t border-black/5 dark:border-white/5',
                        rowHover,
                      )}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={hslNameBadgeStyle(p.name)}
                      >
                        {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold bk-text-primary">{p.name}</div>
                        {p.teamName && <div className="mt-px text-[11px] bk-text-muted">{p.teamName}</div>}
                      </div>
                      <ChevronLeft size={15} className="shrink-0 rotate-180 bk-text-muted" />
                    </Link>
                  )
                })}
              </>
            )}

            {teams.length > 0 && (
              <>
                <div
                  className={cn(
                    'px-5 pt-2.5 pb-1 text-[10px] font-bold tracking-widest bk-text-muted',
                    players.length > 0 && 'border-t border-black/8 dark:border-white/8',
                  )}
                >
                  LAG & KLUBBAR
                </div>
                {teams.map((t, i) => {
                  const ini = t.club.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <Link
                      key={t.id}
                      href={t.href}
                      className={cn(
                        'flex items-center gap-3 px-5 py-2.5 no-underline',
                        i > 0 && 'border-t border-black/5 dark:border-white/5',
                        rowHover,
                      )}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                        style={hslNameBadgeStyle(t.club)}
                      >
                        {ini}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold bk-text-primary">{t.club}</div>
                        {t.city && <div className="mt-px text-[11px] bk-text-muted">{t.city}</div>}
                      </div>
                      <ChevronLeft size={15} className="shrink-0 rotate-180 bk-text-muted" />
                    </Link>
                  )
                })}
              </>
            )}

            {(players.length > 0 || teams.length > 0) && (
              <div className="flex border-t border-black/6 dark:border-white/6">
                <Link href="/players" className="flex-1 py-3 text-center text-xs font-semibold text-gold no-underline">
                  Alla spelare →
                </Link>
                <Link
                  href="/teams"
                  className="flex-1 border-l border-black/6 py-3 text-center text-xs font-semibold text-gold no-underline dark:border-white/6"
                >
                  Alla lag →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
