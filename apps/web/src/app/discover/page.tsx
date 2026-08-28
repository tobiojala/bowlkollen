'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { playerSearchTokens } from '@bowlkollen/core'
import { STALE } from '@/lib/constants'
import { COLOR } from '@/lib/brand'
import FollowButton from '@/components/FollowButton'
import { IdentityAvatar } from '@/components/IdentityAvatar'
import { ExploreMosaic } from './_components/ExploreMosaic'

// ── Types ──────────────────────────────────────────────────────────────────────

type PlayerHit = {
  id: string
  name: string
  teamName: string | null
  lastTotal: number | null
  lastDate: string
  lastVenue: string | null
}
type TeamHit = { bitsTeamId: number; bitsClubId: number; name: string; clubName: string | null }
type CenterHit = { id: number; name: string; city: string | null }

const SEARCH_MIN = 2

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

// ── Queries ───────────────────────────────────────────────────────────────────

function useSearch(q: string) {
  return useQuery({
    queryKey: ['discover', 'search', q],
    queryFn: async (): Promise<{ players: PlayerHit[]; teams: TeamHit[]; centers: CenterHit[] }> => {
      const supabase = createClient()
      const term     = `%${q.trim()}%`
      // Full-name search: AND each token across first/sur name (see playerSearchTokens).
      let playerQuery = supabase.from('bits_players').select('public_id,first_name,sur_name,club_name')
      for (const w of playerSearchTokens(q)) {
        playerQuery = playerQuery.or(`first_name.ilike.%${w}%,sur_name.ilike.%${w}%`)
      }
      const [pr, tr, cr] = await Promise.all([
        playerQuery.limit(8),
        supabase.from('bits_teams').select('bits_team_id,bits_club_id,name,club_name')
          .or(`name.ilike.${term},club_name.ilike.${term}`).limit(6),
        supabase.from('bowling_centers').select('id,name,city')
          .or(`name.ilike.${term},city.ilike.${term}`).limit(6),
      ])
      const players: PlayerHit[] = (pr.data ?? []).map(p => ({
        id: p.public_id, name: `${p.first_name} ${p.sur_name}`.trim(),
        teamName: p.club_name, lastTotal: null, lastDate: '', lastVenue: null,
      }))
      const teams: TeamHit[] = (tr.data ?? [])
        .filter((t): t is typeof t & { bits_club_id: number } => t.bits_club_id !== null)
        .map(t => ({
          bitsTeamId: t.bits_team_id, bitsClubId: t.bits_club_id, name: t.name, clubName: t.club_name,
        }))
      const centers: CenterHit[] = (cr.data ?? []).map(c => ({ id: c.id, name: c.name, city: c.city }))
      return { players, teams, centers }
    },
    enabled: q.trim().length >= SEARCH_MIN,
    staleTime: STALE.DEFAULT,
  })
}

// ── List rows (search results) ────────────────────────────────────────────────

function PlayerRow({ p }: { p: PlayerHit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: `1px solid ${COLOR.hairline}` }}>
      <div style={{ width: 40, height: 40, borderRadius: 20, background: COLOR.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink3 }}>{initials(p.name)}</span>
      </div>
      <Link href={`/players/${p.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLOR.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
        {p.teamName && (
          <div style={{ fontSize: 12, color: COLOR.ink4, marginTop: 2 }}>{p.teamName}</div>
        )}
      </Link>
      <FollowButton entityType="player" entityId={p.id} size="sm" />
    </div>
  )
}

function TeamRow({ t }: { t: TeamHit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: `1px solid ${COLOR.hairline}` }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: COLOR.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: COLOR.ink4, letterSpacing: 1 }}>LAG</span>
      </div>
      <Link href={`/clubs/${t.bitsClubId}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLOR.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
        {t.clubName && (
          <div style={{ fontSize: 12, color: COLOR.ink4, marginTop: 2 }}>{t.clubName}</div>
        )}
      </Link>
      <FollowButton entityType="team" entityId={String(t.bitsTeamId)} size="sm" />
    </div>
  )
}

function CenterRow({ c }: { c: CenterHit }) {
  return (
    <Link href={`/hallar/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: `1px solid ${COLOR.hairline}`, textDecoration: 'none' }}>
      <IdentityAvatar name={c.name} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
        {c.city && <div style={{ fontSize: 12, color: COLOR.ink3, marginTop: 2 }}>{c.city}</div>}
      </div>
    </Link>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
      color: COLOR.ink4, paddingTop: 20, paddingBottom: 10 }}>
      {label}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [query,      setQuery]      = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data: results, isLoading: searchLoading }     = useSearch(debouncedQ)

  const isSearching = debouncedQ.trim().length >= SEARCH_MIN
  const noResults   = isSearching && !searchLoading
    && results?.players.length === 0 && results?.teams.length === 0 && results?.centers.length === 0

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink }}>
      <style>{`
        .disc-wrap { max-width: 600px; margin: 0 auto; padding: 20px 20px 80px; }
        .disc-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (min-width: 1024px) {
          .disc-wrap { max-width: 1160px; padding: 28px 32px 96px; }
          .disc-narrow { max-width: 640px; margin: 0 auto; }
          .disc-cards { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
        }
      `}</style>
      <div className="disc-wrap">

        <div className="disc-narrow">
        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color={COLOR.ink3} style={{ position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök spelare, lag, hallar…"
            autoComplete="off"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: COLOR.surface, border: 'none', borderRadius: 14,
              padding: '14px 40px 14px 42px',
              fontSize: 15, color: COLOR.ink, outline: 'none',
              fontFamily: "var(--font-body, 'DM Sans', system-ui)",
            }}
          />
          {query.length > 0 && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus() }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                display: 'flex', alignItems: 'center' }}>
              <X size={15} color={COLOR.ink4} />
            </button>
          )}
        </div>

        {/* Search results */}
        {isSearching && (
          <>
            {searchLoading && (
              <div style={{ color: COLOR.ink4, fontSize: 14, paddingTop: 24, textAlign: 'center' }}>Söker…</div>
            )}
            {noResults && (
              <div style={{ color: COLOR.ink4, fontSize: 14, paddingTop: 24, textAlign: 'center' }}>
                Inga resultat för &ldquo;{debouncedQ}&rdquo;
              </div>
            )}
            {results?.players && results.players.length > 0 && (
              <>
                <SectionLabel label="Spelare" />
                {results.players.map(p => <PlayerRow key={p.id} p={p} />)}
              </>
            )}
            {results?.teams && results.teams.length > 0 && (
              <>
                <SectionLabel label="Lag" />
                {results.teams.map(t => <TeamRow key={t.bitsTeamId} t={t} />)}
              </>
            )}
            {results?.centers && results.centers.length > 0 && (
              <>
                <SectionLabel label="Hallar" />
                {results.centers.map(c => <CenterRow key={c.id} c={c} />)}
              </>
            )}
          </>
        )}
        </div>{/* disc-narrow */}

        {/* Default: the Explore mosaic — a mixed, diversified stream */}
        {!isSearching && <ExploreMosaic />}

      </div>
    </main>
  )
}
