'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Search, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FilterChip } from '@/components/ui'

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

type RealTeam = {
  id: string
  name: string
  club: string
  division: string | null
}

const TIER_ORDER = ['Elitserien', 'Allsvenskan', 'Division 1', 'Division 2+', 'Övrigt']
const DIV_FILTERS = ['Alla', 'Elitserien', 'Allsvenskan', 'Division 1', 'Division 2+']
const BITS_LOGO_BASE = 'https://bits.swebowl.se/images/ClubLogo'

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
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

function ClubAvatar({
  bitsId,
  name,
  storedUrl,
  tc,
  tclo,
  ini,
}: {
  bitsId: number
  name: string
  storedUrl: string | null
  tc: string
  tclo: string
  ini: string
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const src = storedUrl ?? `${BITS_LOGO_BASE}/${bitsId}.png`
  const showImg = !imgFailed

  return (
    <div
      className={cn(
        'flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] text-[10px] font-extrabold tracking-wide',
        showImg
          ? 'border border-black/8 bg-white dark:border-white/10 dark:bg-white/6'
          : 'border-[1.5px]',
      )}
      style={
        showImg
          ? undefined
          : { background: tclo, borderColor: tc, color: tc }
      }
    >
      {showImg ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgFailed(true)}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        ini
      )}
    </div>
  )
}

export default function TeamsPage() {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [bitsTeams, setBitsTeams] = useState<Record<number, BitsTeam[]>>({})
  const [realTeams, setRealTeams] = useState<Record<string, RealTeam[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [county, setCounty] = useState('Alla')
  const [divFilter, setDivFilter] = useState('Alla')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase
        .from('bits_clubs')
        .select('bits_id, name, county, hall_name, logo_url')
        .eq('is_active', true)
        .order('name'),
      supabase.from('bits_teams').select('bits_team_id, name, bits_club_id, team_type_desc'),
      supabase.from('teams').select('id, name, club'),
      supabase
        .from('matches')
        .select('home_team_id, away_team_id, division')
        .not('division', 'is', null)
        .eq('status', 'completed')
        .limit(600),
    ]).then(([{ data: c }, { data: bt }, { data: t }, { data: m }]) => {
      if (c) setClubs(c as Club[])

      if (bt) {
        const map: Record<number, BitsTeam[]> = {}
        ;(bt as BitsTeam[]).forEach(team => {
          if (!map[team.bits_club_id]) map[team.bits_club_id] = []
          map[team.bits_club_id].push(team)
        })
        setBitsTeams(map)
      }

      const teamDiv: Record<string, string> = {}
      if (m) {
        m.forEach((match: { home_team_id?: string; away_team_id?: string; division?: string }) => {
          if (match.division) {
            if (match.home_team_id) teamDiv[match.home_team_id] = match.division
            if (match.away_team_id) teamDiv[match.away_team_id] = match.division
          }
        })
      }

      if (t) {
        const map: Record<string, RealTeam[]> = {}
        ;(t as { id: string; name: string; club?: string }[]).forEach(team => {
          const div = teamDiv[team.id] ?? null
          const clubName = team.club ?? ''
          if (!map[clubName]) map[clubName] = []
          if (!map[clubName].some(x => x.id === team.id)) {
            map[clubName].push({ id: team.id, name: team.name, club: clubName, division: div })
          }
        })
        Object.keys(map).forEach(k => {
          map[k].sort(
            (a, b) => TIER_ORDER.indexOf(divTier(a.division)) - TIER_ORDER.indexOf(divTier(b.division)),
          )
        })
        setRealTeams(map)
      }

      setLoading(false)
    })
  }, [])

  const counties = useMemo(() => {
    const set = new Set<string>()
    clubs.forEach(c => {
      if (c.county) set.add(c.county)
    })
    return ['Alla', ...Array.from(set).sort()]
  }, [clubs])

  const getTeamsForClub = useCallback(
    (club: Club): { id: string; name: string; division: string | null; isReal: boolean }[] => {
      const real = realTeams[club.name] ?? []
      if (real.length > 0) return real.map(t => ({ ...t, isReal: true }))
      const bits = bitsTeams[club.bits_id] ?? []
      return bits.map(t => ({
        id: String(t.bits_team_id),
        name: t.name,
        division: null,
        isReal: false,
      }))
    },
    [realTeams, bitsTeams],
  )

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
  }, [clubs, search, county, divFilter, getTeamsForClub])

  const toggle = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const chipScroll =
    'flex gap-[7px] overflow-x-auto px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

  if (loading) {
    return (
      <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
        <div className="px-4 pt-3">
          <div className="h-11 animate-pulse rounded-[14px] bg-black/7 dark:bg-white/7" />
        </div>
        <div className={cn(chipScroll, 'pt-2.5')}>
          {[56, 64, 72, 56, 68].map((w, i) => (
            <div
              key={i}
              className="h-7 shrink-0 animate-pulse rounded-full bg-black/7 dark:bg-white/7"
              style={{ width: w }}
            />
          ))}
        </div>
        <div className="mx-auto flex max-w-app flex-col gap-2 px-3 pt-3 pb-8">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-3.5',
                'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
              )}
            >
              <div className="h-[42px] w-[42px] shrink-0 animate-pulse rounded-[11px] bg-black/7 dark:bg-white/7" />
              <div className="flex flex-1 flex-col gap-[7px]">
                <div
                  className="h-3 animate-pulse rounded bg-black/7 dark:bg-white/7"
                  style={{ width: `${45 + (i % 4) * 12}%` }}
                />
                <div className="h-2 w-[35%] animate-pulse rounded bg-black/7 dark:bg-white/7" />
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-light-bg pb-8 font-sans dark:bg-dark-bg">
      <div className="px-4 pt-3">
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-[14px] border px-3.5 py-2.5',
            'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
          )}
        >
          <Search size={15} className="shrink-0 text-dark-muted" strokeWidth={2.5} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök klubb eller hall..."
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none bk-text-primary placeholder:text-dark-muted"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="cursor-pointer border-0 bg-transparent p-0 text-lg leading-none text-dark-muted"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div className={cn(chipScroll, 'pt-2.5')}>
        {counties.map(c => (
          <FilterChip key={c} active={county === c} onClick={() => setCounty(c)}>
            {c}
          </FilterChip>
        ))}
      </div>

      <div className={cn(chipScroll, 'pt-[7px]')}>
        {DIV_FILTERS.map(f => {
          const isActive = divFilter === f
          const clr = divFilterColor(f)
          return (
            <button
              key={f}
              type="button"
              onClick={() => setDivFilter(f)}
              className={cn(
                'shrink-0 cursor-pointer rounded-full border px-3 py-1.25 text-[11px] font-bold whitespace-nowrap',
                !isActive && 'border-light-border bg-transparent text-dark-muted dark:border-dark-border',
              )}
              style={
                isActive
                  ? { borderColor: `${clr}66`, background: `${clr}18`, color: clr }
                  : undefined
              }
            >
              {f}
            </button>
          )
        })}
      </div>

      <div className="px-5 pt-2 pb-1 text-[11px] font-medium text-dark-muted">
        {filtered.length} klubbar
        {divFilter !== 'Alla' ? ` · ${divFilter}` : ''}
        {county !== 'Alla' ? ` · ${county}` : ''}
      </div>

      <div className="mx-auto flex max-w-app flex-col gap-2 px-3 pb-8">
        {filtered.map(club => {
          const teams = getTeamsForClub(club)
          const isExpanded = expanded.has(club.bits_id)
          const hue = clubHue(club.name)
          const tc = `hsl(${hue},50%,45%)`
          const tclo = `hsl(${hue},40%,92%)`
          const tcloDark = `hsl(${hue},40%,14%)`
          const ini = clubInitials(club.name)

          const seen = new Set<string>()
          const badges = teams.filter(t => {
            if (!t.division) return false
            if (seen.has(t.division)) return false
            seen.add(t.division)
            return true
          })

          return (
            <div
              key={club.bits_id}
              className={cn(
                'overflow-hidden rounded-2xl border shadow-sm',
                'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
                'dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]',
              )}
            >
              <button
                type="button"
                onClick={() => toggle(club.bits_id)}
                className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent p-3.5 text-left"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="dark:hidden">
                  <ClubAvatar
                    bitsId={club.bits_id}
                    name={club.name}
                    storedUrl={club.logo_url}
                    tc={tc}
                    tclo={tclo}
                    ini={ini}
                  />
                </div>
                <div className="hidden dark:block">
                  <ClubAvatar
                    bitsId={club.bits_id}
                    name={club.name}
                    storedUrl={club.logo_url}
                    tc={tc}
                    tclo={tcloDark}
                    ini={ini}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-[3px] truncate text-[15px] font-bold bk-text-primary">
                    {club.name}
                  </div>
                  <div
                    className={cn(
                      'truncate text-[11px] text-dark-muted',
                      badges.length > 0 && 'mb-[7px]',
                    )}
                  >
                    {[club.county, club.hall_name].filter(Boolean).join(' · ')}
                  </div>
                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {badges.map(t => {
                        const clr = divColor(t.division)
                        return (
                          <span
                            key={t.id}
                            className="rounded-[5px] px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide whitespace-nowrap"
                            style={{
                              color: clr,
                              background: `${clr}1a`,
                              border: `1px solid ${clr}44`,
                            }}
                          >
                            {divLabel(t.division)}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {teams.length > 0 && (
                    <span className="rounded-lg bg-black/6 px-2 py-[3px] text-[10px] font-extrabold text-dark-muted dark:bg-white/7">
                      {teams.length} lag
                    </span>
                  )}
                  <ChevronRight
                    size={20}
                    className={cn(
                      'text-dark-muted transition-transform duration-200',
                      isExpanded && 'rotate-90',
                    )}
                    strokeWidth={1.5}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-light-border dark:border-dark-border">
                  {teams.length === 0 ? (
                    <div className="px-4 py-3.5 text-xs text-dark-muted">Inga registrerade lag</div>
                  ) : (
                    teams.map((t, i) => {
                      const clr = divColor(t.division)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            t.isReal
                              ? router.push(`/teams/${t.id}`)
                              : router.push(`/clubs/${club.bits_id}`)
                          }
                          className={cn(
                            'flex w-full cursor-pointer items-center gap-2.5 border-0 px-4 py-2.75 text-left',
                            'bg-black/[0.03] transition-colors hover:bg-black/5',
                            'dark:bg-black/25 dark:hover:bg-white/4',
                            i > 0 && 'border-t border-light-border dark:border-dark-border',
                          )}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <div
                            className="h-8 w-[3px] shrink-0 rounded-sm"
                            style={{ background: clr }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-semibold bk-text-primary">
                              {t.name}
                            </div>
                            <div
                              className="mt-px text-[11px] font-bold"
                              style={{ color: t.division ? clr : undefined }}
                            >
                              <span className={!t.division ? 'font-normal text-dark-muted' : undefined}>
                                {t.division ?? 'Inga matcher registrerade'}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={12} className="shrink-0 text-dark-muted" strokeWidth={2.5} />
                        </button>
                      )
                    })
                  )}

                  <button
                    type="button"
                    onClick={() => router.push(`/clubs/${club.bits_id}`)}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-center gap-1 border-0 border-t py-2.5',
                      'border-light-border bg-transparent text-[11px] font-bold text-dark-muted',
                      'dark:border-dark-border',
                    )}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    Klubbsida
                    <ChevronRight size={11} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="py-[60px] text-center text-sm text-dark-muted">Inga klubbar hittades</div>
        )}
      </div>
    </main>
  )
}
