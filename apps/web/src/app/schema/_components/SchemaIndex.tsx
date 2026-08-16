'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Search, X, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAllDivisions } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import { groupDivisionsByTier, divisionTier, TIER_COLOR } from '@/lib/division-standings'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { STALE } from '@/lib/constants'

type Division = { bits_division_id: number; name: string }
type ClubHit  = { bits_id: number; name: string }

// The sticky tier header already says "DIVISION 3" / "ELITSERIEN" — strip that
// prefix so browse rows show only the distinctive part ("Västra Svealand 2").
// Allsvenskan's geography lives inside the word (Nord/Syd/Mellan), so leave it.
function shortDivName(name: string): string {
  const stripped = name.replace(/^(Division\s*\d+|Div\s*\d+|Elitserien|SM-slutspel)\s*/i, '').trim()
  return stripped || name
}

function SectionLabel({ text, count }: { text: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], padding: '14px 16px 10px' }}>
      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2 }}>{text}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: COLOR.ink2 }}>{count}</span>
    </div>
  )
}

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: SPACE[3],
  padding: '15px 20px', borderTop: `1px solid ${COLOR.hairline}`,
  textDecoration: 'none', WebkitTapHighlightColor: 'transparent',
}
const nameStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, color: COLOR.ink,
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}
const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLOR.ink3}
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const hover = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = `${COLOR.ink}06`),
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'transparent'),
}

/** Schema = the searchable reference library. One box finds a division OR a
 * team directly — no drilling through divisions to reach a team. */
export function SchemaIndex() {
  const { data: divisions = [], isLoading } = useAllDivisions()
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const searching = q.length > 0

  // Debounce only the team query (network); division filter is instant/client.
  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 180)
    return () => clearTimeout(t)
  }, [q])

  const divHits = useMemo(
    () => searching ? (divisions as Division[]).filter(d => d.name.toLowerCase().includes(q)) : [],
    [divisions, q, searching],
  )
  const browse = useMemo(
    () => searching ? null : groupDivisionsByTier(divisions as Division[]),
    [divisions, searching],
  )

  // Search team names, but collapse to one row per club — every team of a club
  // lands on the same club page, so showing them separately just forces a second
  // pick. One club → one tap.
  const { data: clubHits = [], isFetching: clubsBusy } = useQuery({
    queryKey: ['schema', 'clubSearch', debouncedQ],
    queryFn: async (): Promise<ClubHit[]> => {
      const supabase = createClient()
      const { data: teams } = await supabase
        .from('bits_teams')
        .select('bits_club_id')
        .ilike('name', `%${debouncedQ}%`)
        .not('bits_club_id', 'is', null)
        .limit(200)
      const clubIds = [...new Set((teams ?? []).map(t => t.bits_club_id).filter((x): x is number => x != null))].slice(0, 20)
      if (clubIds.length === 0) return []
      const { data: clubs } = await supabase
        .from('bits_clubs')
        .select('bits_id, name')
        .in('bits_id', clubIds)
      return ((clubs ?? []) as ClubHit[]).sort((a, b) => a.name.localeCompare(b.name, 'sv'))
    },
    enabled: debouncedQ.length >= 2,
    staleTime: STALE.MEDIUM,
  })

  const noHits = searching && divHits.length === 0 && clubHits.length === 0 && !clubsBusy && debouncedQ.length >= 2

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <style>{`
        .schema-wrap { max-width: 600px; margin: 0 auto; padding: 16px 0 96px; }
        .schema-search { margin: 0 20px 20px; }
        .schema-grid { display: flex; flex-direction: column; gap: 12px; padding: 0 20px; }
        .schema-card { background: ${COLOR.surface}; border-radius: 16px; overflow: hidden; }
        @media (min-width: 1024px) {
          .schema-wrap { max-width: 1160px; padding: 28px 32px 96px; }
          .schema-search { max-width: 640px; margin: 0 auto 28px; }
          .schema-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; align-items: start; padding: 0; }
        }
      `}</style>
      <div className="schema-wrap">

        {/* Search — first thing, finds teams and divisions */}
        <div className="schema-search" style={{
          display: 'flex', alignItems: 'center', gap: SPACE[2],
          background: COLOR.surface, border: `1px solid ${COLOR.hairline}`,
          borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px`,
        }}>
          <Search size={17} color={COLOR.ink2} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök lag eller division…"
            autoComplete="off"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: COLOR.ink }}
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Rensa"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
              <X size={18} color={COLOR.ink2} />
            </button>
          )}
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ height: 52, borderTop: `1px solid ${COLOR.hairline}`, opacity: 1 - i * 0.14 }} />
            ))}
          </div>
        )}

        {/* ── Search results ── */}
        {!isLoading && searching && (
          <>
            <div className="schema-grid">
              {clubHits.length > 0 && (
                <section className="schema-card">
                  <SectionLabel text="KLUBBAR" count={clubHits.length} />
                  {clubHits.map(c => (
                    <Link key={c.bits_id} href={`/clubs/${c.bits_id}`} style={rowStyle} {...hover}>
                      <Users size={16} color={COLOR.ink3} style={{ flexShrink: 0 }} />
                      <span style={nameStyle}>{c.name}</span>
                      <Chevron />
                    </Link>
                  ))}
                </section>
              )}

              {divHits.length > 0 && (
                <section className="schema-card">
                  <SectionLabel text="DIVISIONER" count={divHits.length} />
                  {divHits.map(d => {
                    const tc = TIER_COLOR[divisionTier(d.name)] ?? COLOR.ink3
                    return (
                      <Link key={d.bits_division_id} href={`/divisioner/${d.bits_division_id}`} style={rowStyle} {...hover}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: tc, flexShrink: 0 }} />
                        <span style={nameStyle}>{d.name}</span>
                        <Chevron />
                      </Link>
                    )
                  })}
                </section>
              )}
            </div>

            {noHits && (
              <div style={{ textAlign: 'center', padding: `${SPACE[8]}px 20px`, color: COLOR.ink2, fontSize: TYPE.body }}>
                Inga lag eller divisioner matchar &ldquo;{search}&rdquo;
              </div>
            )}
          </>
        )}

        {/* ── Browse (no search) — the division catalog as a wall of tier cards ── */}
        {!isLoading && browse && (
          <div className="schema-grid">
            {[...browse.entries()].map(([tier, tierDivs]) => {
              const tc = TIER_COLOR[tier] ?? COLOR.ink3
              return (
                <section key={tier} className="schema-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], padding: '14px 16px 10px' }}>
                    <div style={{ width: 3, height: 14, borderRadius: 2, background: tc, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: tc }}>
                      {tier.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLOR.ink2 }}>{tierDivs.length}</span>
                  </div>
                  {tierDivs.map(div => (
                    <Link key={div.bits_division_id} href={`/divisioner/${div.bits_division_id}`} style={rowStyle} {...hover}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: tc, flexShrink: 0 }} />
                      <span style={nameStyle}>{shortDivName(div.name)}</span>
                      <Chevron />
                    </Link>
                  ))}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
