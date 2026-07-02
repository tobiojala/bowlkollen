'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { COLOR, SPACE, RADIUS, TYPE } from '@/lib/brand'
import { divisionColor } from '@/lib/divisions'
import { useRouter } from 'next/navigation'

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

function divTier(div: string | null): string {
  if (!div) return 'Övrigt'
  if (div.includes('Elitserien')) return 'Elitserien'
  if (div.includes('Allsvenskan')) return 'Allsvenskan'
  if (div.startsWith('Div 1') || div.startsWith('Division 1')) return 'Division 1'
  return 'Division 2+'
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

const BITS_LOGO_BASE = 'https://bits.swebowl.se/images/ClubLogo'

function ClubAvatar({ bitsId, name, storedUrl }: {
  bitsId: number; name: string; storedUrl: string | null
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const src     = storedUrl ?? `${BITS_LOGO_BASE}/${bitsId}.png`
  const showImg = !imgFailed
  const hue     = clubHue(name)

  return (
    <div style={{
      width: 44, height: 44, borderRadius: RADIUS.md, flexShrink: 0,
      background: showImg ? `${COLOR.surface}` : `hsl(${hue},38%,14%)`,
      border: showImg ? `1px solid ${COLOR.hairline}` : `1.5px solid hsl(${hue},45%,28%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      fontSize: 11, fontWeight: 800, color: `hsl(${hue},55%,65%)`, letterSpacing: 0.5,
    }}>
      {showImg
        ? <Image src={src} alt={name} width={68} height={68}
            onError={() => setImgFailed(true)}
            style={{ objectFit: 'contain', padding: 6, width: '100%', height: '100%' }} />
        : clubInitials(name)
      }
    </div>
  )
}

export default function TeamsPage() {
  const router = useRouter()

  const [clubs,       setClubs]       = useState<Club[]>([])
  const [bitsTeams,   setBitsTeams]   = useState<Record<number, BitsTeam[]>>({})
  const [realTeams,   setRealTeams]   = useState<Record<string, RealTeam[]>>({})
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [county,      setCounty]      = useState('Alla')
  const [divFilter,   setDivFilter]   = useState('Alla')
  const [expanded,    setExpanded]    = useState<Set<number>>(new Set())
  const [filterOpen,  setFilterOpen]  = useState(false)

  const hasActiveFilter = county !== 'Alla' || divFilter !== 'Alla'

  const clearFilters = () => { setCounty('Alla'); setDivFilter('Alla') }

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('bits_clubs')
        .select('bits_id, name, county, hall_name, logo_url')
        .order('name'),
      supabase.from('bits_teams')
        .select('bits_team_id, name, bits_club_id, team_type_desc')
        .limit(2000),
      supabase.from('teams')
        .select('id, name, club'),
      supabase.from('matches')
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
        m.forEach((match: { home_team_id: string | null; away_team_id: string | null; division: string | null }) => {
          if (match.division) {
            if (match.home_team_id) teamDiv[match.home_team_id] = match.division
            if (match.away_team_id) teamDiv[match.away_team_id] = match.division
          }
        })
      }

      if (t) {
        const map: Record<string, RealTeam[]> = {}
        ;(t as { id: string; name: string; club: string | null }[]).forEach(team => {
          const div     = teamDiv[team.id] ?? null
          const clubName = team.club ?? ''
          if (!map[clubName]) map[clubName] = []
          if (!map[clubName].some(x => x.id === team.id)) {
            map[clubName].push({ id: team.id, name: team.name, club: clubName, division: div })
          }
        })
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

  function getTeamsForClub(club: Club): { id: string; name: string; division: string | null; isReal: boolean }[] {
    const real = realTeams[club.name] ?? []
    if (real.length > 0) return real.map(t => ({ ...t, isReal: true }))
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubs, search, county, divFilter, realTeams, bitsTeams])

  const toggle = (id: number) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: COLOR.bg }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ padding: `${SPACE[4]}px ${SPACE[4]}px 0` }}>
            <div style={{ height: 44, borderRadius: RADIUS.lg, background: COLOR.surface, border: `1px solid ${COLOR.hairline}` }} />
          </div>
          <div style={{ padding: `${SPACE[3]}px ${SPACE[4]}px`, display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
            {[0,1,2,3,4,5,6].map(i => (
              <div key={i} style={{ borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px`, background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
                <div style={{ width: 44, height: 44, borderRadius: RADIUS.md, background: COLOR.bg, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
                  <div style={{ height: 13, width: `${45 + (i % 4) * 12}%`, borderRadius: 4, background: COLOR.bg }} />
                  <div style={{ height: 9, width: '38%', borderRadius: 4, background: COLOR.bg }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  // ── Page ──────────────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>

        {/* Search bar with filter icon */}
        <div style={{ padding: `${SPACE[4]}px ${SPACE[4]}px 0` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
            <Search size={15} color={COLOR.ink3} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sök klubb eller hall..."
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: COLOR.ink }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                <X size={16} color={COLOR.ink3} />
              </button>
            )}
            <div style={{ width: 1, height: 18, background: COLOR.hairline, flexShrink: 0 }} />
            <button
              onClick={() => setFilterOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: `0 0 0 ${SPACE[1]}px`, display: 'flex', alignItems: 'center', position: 'relative' }}
            >
              <SlidersHorizontal size={17} color={hasActiveFilter ? COLOR.gold : COLOR.ink3} />
              {hasActiveFilter && (
                <div style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: COLOR.gold, border: `1.5px solid ${COLOR.bg}` }} />
              )}
            </button>
          </div>
        </div>

        {/* Active filter chips — visible only when a filter is set */}
        <AnimatePresence>
          {hasActiveFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', gap: SPACE[2], padding: `${SPACE[2]}px ${SPACE[4]}px 0`, flexWrap: 'wrap' }}>
                {divFilter !== 'Alla' && (
                  <button onClick={() => setDivFilter('Alla')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: `4px ${SPACE[2]}px 4px ${SPACE[3]}px`, borderRadius: 99, background: `${COLOR.gold}14`, border: `1px solid ${COLOR.gold}44`, color: COLOR.gold, fontSize: TYPE.label, fontWeight: 700, cursor: 'pointer' }}>
                    {divFilter} <X size={12} />
                  </button>
                )}
                {county !== 'Alla' && (
                  <button onClick={() => setCounty('Alla')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: `4px ${SPACE[2]}px 4px ${SPACE[3]}px`, borderRadius: 99, background: `${COLOR.gold}14`, border: `1px solid ${COLOR.gold}44`, color: COLOR.gold, fontSize: TYPE.label, fontWeight: 700, cursor: 'pointer' }}>
                    {county} <X size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result count */}
        <div style={{ padding: `${SPACE[2]}px ${SPACE[4]}px ${SPACE[1]}px`, fontSize: TYPE.caption, color: COLOR.ink3, fontWeight: 500 }}>
          {filtered.length} klubbar
        </div>

        {/* Filter sheet */}
        <AnimatePresence>
          {filterOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setFilterOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40 }}
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                style={{
                  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
                  background: COLOR.surface, borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
                  maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                  border: `1px solid ${COLOR.hairline}`, borderBottom: 'none',
                }}
              >
                {/* Handle */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: `${SPACE[3]}px 0 0` }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: COLOR.ink3, opacity: 0.3 }} />
                </div>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: COLOR.ink }}>Filtrera</span>
                  <div style={{ display: 'flex', gap: SPACE[3], alignItems: 'center' }}>
                    {hasActiveFilter && (
                      <button onClick={clearFilters} style={{ fontSize: TYPE.label, fontWeight: 700, color: COLOR.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Rensa
                      </button>
                    )}
                    <button onClick={() => setFilterOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                      <X size={20} color={COLOR.ink3} />
                    </button>
                  </div>
                </div>

                {/* Scrollable content */}
                <div style={{ overflowY: 'auto', padding: `0 ${SPACE[4]}px ${SPACE[8]}px`, flex: 1 }}>

                  {/* Division section */}
                  <div style={{ marginBottom: SPACE[6] }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink, letterSpacing: '-0.01em', marginBottom: SPACE[3] }}>
                      Division
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
                      {DIV_FILTERS.map(f => {
                        const active = divFilter === f
                        const clr    = f === 'Alla' ? COLOR.gold : divisionColor(
                          f === 'Elitserien' ? 'Elitserien' :
                          f === 'Allsvenskan' ? 'Allsvenskan' :
                          f === 'Division 1' ? 'Division 1 Norra' : 'Division 2 Norra'
                        )
                        return (
                          <button key={f} onClick={() => setDivFilter(f)} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: `${SPACE[3]}px ${SPACE[4]}px`,
                            borderRadius: RADIUS.lg, cursor: 'pointer',
                            background: active ? `${clr}12` : COLOR.bg,
                            border: `1px solid ${active ? clr + '44' : COLOR.hairline}`,
                            WebkitTapHighlightColor: 'transparent',
                          }}>
                            <span style={{ fontSize: TYPE.body, fontWeight: 600, color: active ? clr : COLOR.ink }}>
                              {f === 'Alla' ? 'Alla divisioner' : f}
                            </span>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? clr : COLOR.ink3 + '55'}`, background: active ? clr : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* County section */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink, letterSpacing: '-0.01em', marginBottom: SPACE[3] }}>
                      Län
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[2] }}>
                      {counties.map(c => {
                        const active = county === c
                        return (
                          <button key={c} onClick={() => setCounty(c)} style={{
                            padding: `6px ${SPACE[3]}px`, borderRadius: 99, cursor: 'pointer',
                            fontSize: TYPE.label, fontWeight: 700,
                            border: active ? `1px solid ${COLOR.gold}55` : `1px solid ${COLOR.hairline}`,
                            background: active ? `${COLOR.gold}14` : COLOR.bg,
                            color: active ? COLOR.gold : COLOR.ink3,
                            WebkitTapHighlightColor: 'transparent',
                          }}>
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                </div>

                {/* Done button */}
                <div style={{ padding: `${SPACE[4]}px ${SPACE[4]}px`, borderTop: `1px solid ${COLOR.hairline}` }}>
                  <button
                    onClick={() => setFilterOpen(false)}
                    style={{ width: '100%', padding: `${SPACE[3]}px`, borderRadius: RADIUS.lg, background: COLOR.gold, border: 'none', color: '#1a1400', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Visa {filtered.length} klubbar
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Club list */}
        <div style={{ padding: `0 ${SPACE[4]}px`, display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>

          {filtered.map(club => {
            const teams      = getTeamsForClub(club)
            const isExpanded = expanded.has(club.bits_id)

            // Deduplicate division badges
            const seen   = new Set<string>()
            const badges = teams.filter(t => {
              if (!t.division) return false
              if (seen.has(t.division)) return false
              seen.add(t.division)
              return true
            })

            return (
              <div key={club.bits_id} style={{
                borderRadius: RADIUS.lg, overflow: 'hidden',
                background: COLOR.surface, border: `1px solid ${COLOR.hairline}`,
              }}>

                {/* Club row */}
                <button
                  onClick={() => toggle(club.bits_id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: SPACE[3],
                    padding: `${SPACE[3]}px ${SPACE[4]}px`,
                    width: '100%', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <ClubAvatar bitsId={club.bits_id} name={club.name} storedUrl={club.logo_url} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      {club.name}
                    </div>
                    <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: badges.length > 0 ? 6 : 0 }}>
                      {[club.county, club.hall_name].filter(Boolean).join(' · ')}
                    </div>
                    {badges.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {badges.map(t => {
                          const clr = divisionColor(t.division!)
                          return (
                            <span key={t.id} style={{
                              fontSize: TYPE.caption, fontWeight: 700,
                              color: clr, background: `${clr}18`, border: `1px solid ${clr}33`,
                              borderRadius: RADIUS.sm, padding: '2px 7px', whiteSpace: 'nowrap',
                            }}>
                              {divLabel(t.division)}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], flexShrink: 0 }}>
                    {teams.length > 0 && (
                      <span style={{
                        fontSize: TYPE.caption, fontWeight: 700, color: COLOR.ink3,
                        background: `${COLOR.ink3}14`, borderRadius: RADIUS.sm, padding: '3px 8px',
                      }}>
                        {teams.length}
                      </span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLOR.ink3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease', flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </button>

                {/* Expanded team list */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${COLOR.hairline}` }}>
                    {teams.length === 0 ? (
                      <div style={{ padding: `${SPACE[3]}px ${SPACE[4]}px`, fontSize: TYPE.body, color: COLOR.ink3 }}>
                        Inga registrerade lag
                      </div>
                    ) : teams.map((t, i) => {
                      const clr = t.division ? divisionColor(t.division) : COLOR.ink3
                      return (
                        <button key={t.id}
                          onClick={() => t.isReal ? router.push(`/teams/${t.id}`) : router.push(`/clubs/${club.bits_id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: SPACE[3],
                            padding: `${SPACE[3]}px ${SPACE[4]}px`, width: '100%',
                            background: 'transparent', border: 'none',
                            borderTop: i > 0 ? `1px solid ${COLOR.hairline}` : 'none',
                            cursor: 'pointer', textAlign: 'left',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = `${COLOR.ink}08`)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ width: 3, height: 28, borderRadius: 2, background: clr, flexShrink: 0, opacity: 0.7 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t.name}
                            </div>
                            <div style={{ fontSize: TYPE.caption, marginTop: 1, fontWeight: 600, color: t.division ? clr : COLOR.ink3 }}>
                              {t.division ?? 'Inga matcher registrerade'}
                            </div>
                          </div>
                          {t.isReal && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLOR.ink3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          )}
                        </button>
                      )
                    })}

                    {/* Club page link */}
                    <button
                      onClick={() => router.push(`/clubs/${club.bits_id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACE[1],
                        width: '100%', padding: `${SPACE[3]}px`,
                        background: 'transparent', border: 'none',
                        borderTop: `1px solid ${COLOR.hairline}`,
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <span style={{ fontSize: TYPE.caption, fontWeight: 700, color: COLOR.ink3 }}>Klubbsida</span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={COLOR.ink3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: `${SPACE[8]}px 0`, color: COLOR.ink3, fontSize: TYPE.body }}>
              Inga klubbar hittades
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
