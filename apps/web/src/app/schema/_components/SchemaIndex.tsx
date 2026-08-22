'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAllDivisions } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import { groupDivisionsByTier } from '@/lib/division-standings'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { STALE } from '@/lib/constants'

type Division = { bits_division_id: number; name: string }
type TeamHit  = { bits_team_id: number; name: string; club_name: string | null }

// Strip the tier prefix so browse rows show only the distinctive part
// ("Västra Svealand 2"); the tier header already says "DIVISION 3".
function shortDivName(name: string): string {
  const stripped = name.replace(/^(Division\s*\d+|Div\s*\d+|Elitserien|SM-slutspel)\s*/i, '').trim()
  return stripped || name
}

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLOR.ink4}
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const hover = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = `${COLOR.ink}06`),
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'transparent'),
}
const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: SPACE[3],
  padding: '15px 4px', borderTop: `1px solid ${COLOR.hairline}`,
  textDecoration: 'none', WebkitTapHighlightColor: 'transparent',
}
const nameStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, color: COLOR.ink,
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}
function TierLabel({ text, gold }: { text: string; gold?: boolean }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: gold ? COLOR.gold : COLOR.ink3, marginTop: SPACE[6], marginBottom: SPACE[1], padding: '0 4px' }}>
      {text}
    </div>
  )
}

/** Schema = the searchable reference library, flat list (shared look with native). */
export function SchemaIndex() {
  const { data: divisions = [], isLoading } = useAllDivisions()
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const searching = q.length > 0

  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q), 180); return () => clearTimeout(t) }, [q])

  const divHits = useMemo(
    () => searching ? (divisions as Division[]).filter(d => d.name.toLowerCase().includes(q)) : [],
    [divisions, q, searching],
  )
  const browse = useMemo(
    () => searching ? null : groupDivisionsByTier(divisions as Division[]),
    [divisions, searching],
  )

  // Search teams directly — tap a lag to reach its page/schedule (matches native).
  const { data: teamHits = [], isFetching: teamsBusy } = useQuery({
    queryKey: ['schema', 'teamSearch', debouncedQ],
    queryFn: async (): Promise<TeamHit[]> => {
      const { data } = await createClient()
        .from('bits_teams').select('bits_team_id, name, club_name')
        .ilike('name', `%${debouncedQ}%`).limit(25)
      return (data ?? []) as TeamHit[]
    },
    enabled: debouncedQ.length >= 2,
    staleTime: STALE.MEDIUM,
  })

  const noHits = searching && divHits.length === 0 && teamHits.length === 0 && !teamsBusy && debouncedQ.length >= 2

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: `${SPACE[4]}px 20px 96px` }}>

        {/* Search — finds a division or a team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2],
          background: COLOR.surface, border: `1px solid ${COLOR.hairline}`,
          borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
          <Search size={17} color={COLOR.ink3} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök lag eller division…"
            autoComplete="off" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: COLOR.ink }} />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Rensa" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={18} color={COLOR.ink3} />
            </button>
          )}
        </div>

        {isLoading && (
          <div style={{ marginTop: SPACE[6] }}>
            {[0,1,2,3,4,5].map(i => <div key={i} style={{ height: 52, borderTop: `1px solid ${COLOR.hairline}`, opacity: 1 - i * 0.14 }} />)}
          </div>
        )}

        {/* Search results */}
        {!isLoading && searching && (
          <>
            {divHits.length > 0 && (
              <>
                <TierLabel text="Divisioner" />
                {divHits.map(d => (
                  <Link key={d.bits_division_id} href={`/divisioner/${d.bits_division_id}`} style={rowStyle} {...hover}>
                    <span style={nameStyle}>{d.name}</span>
                    <Chevron />
                  </Link>
                ))}
              </>
            )}
            {teamHits.length > 0 && (
              <>
                <TierLabel text="Lag" />
                {teamHits.map(t => (
                  <Link key={t.bits_team_id} href={`/lag/${t.bits_team_id}`} style={rowStyle} {...hover}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', ...nameStyle }}>{t.name}</span>
                      {t.club_name && t.club_name !== t.name && (
                        <span style={{ display: 'block', fontSize: 13, color: COLOR.ink3, marginTop: 1 }}>{t.club_name}</span>
                      )}
                    </span>
                    <Chevron />
                  </Link>
                ))}
              </>
            )}
            {noHits && (
              <div style={{ textAlign: 'center', padding: `${SPACE[8]}px 0`, color: COLOR.ink3, fontSize: TYPE.body }}>
                Inga träffar.
              </div>
            )}
          </>
        )}

        {/* Browse — flat tier-grouped catalog */}
        {!isLoading && browse && [...browse.entries()].map(([tier, tierDivs]) => (
          <div key={tier}>
            <TierLabel text={tier} gold={tier === 'Elitserien'} />
            {tierDivs.map(div => (
              <Link key={div.bits_division_id} href={`/divisioner/${div.bits_division_id}`} style={rowStyle} {...hover}>
                <span style={nameStyle}>{shortDivName(div.name)}</span>
                <Chevron />
              </Link>
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}
