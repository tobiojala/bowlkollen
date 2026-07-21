'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, X, Trophy } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'
import { COLOR } from '@/lib/brand'
import FollowButton from '@/components/FollowButton'

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

const SEARCH_MIN = 2

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

function initials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

// ── Queries ───────────────────────────────────────────────────────────────────

type RawRecentPlayer = {
  public_id: string; name: string; club_name: string | null
  last_total: number | null; last_date: string | null; hall_name: string | null
}

function useRecentPlayers() {
  return useQuery({
    queryKey: ['discover', 'recent'],
    queryFn: async (): Promise<PlayerHit[]> => {
      const { data, error } = await createClient().rpc('get_discover_recent_players', { p_limit: 40 })
      if (error) throw error
      return (data as RawRecentPlayer[] ?? []).map(p => ({
        id: p.public_id, name: p.name, teamName: p.club_name,
        lastTotal: p.last_total, lastDate: p.last_date ?? '', lastVenue: p.hall_name,
      }))
    },
    staleTime: STALE.DEFAULT,
  })
}

function useSearch(q: string) {
  return useQuery({
    queryKey: ['discover', 'search', q],
    queryFn: async (): Promise<{ players: PlayerHit[]; teams: TeamHit[] }> => {
      const supabase = createClient()
      const term     = `%${q.trim()}%`
      const [pr, tr] = await Promise.all([
        supabase.from('bits_players').select('public_id,first_name,sur_name,club_name')
          .or(`first_name.ilike.${term},sur_name.ilike.${term}`).limit(8),
        supabase.from('bits_teams').select('bits_team_id,bits_club_id,name,club_name')
          .or(`name.ilike.${term},club_name.ilike.${term}`).limit(6),
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
      return { players, teams }
    },
    enabled: q.trim().length >= SEARCH_MIN,
    staleTime: STALE.DEFAULT,
  })
}

// ── Player card (2×2 grid) ────────────────────────────────────────────────────

function PlayerCard({ p }: { p: PlayerHit }) {
  const venue    = p.lastVenue ?? (p.lastDate ? formatDate(p.lastDate) : null)
  const activity = [p.lastTotal ? `${p.lastTotal}` : null, venue].filter(Boolean).join(' · ')

  return (
    <div style={{ background: COLOR.surface, borderRadius: 16, padding: '14px',
      display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header: avatar left, name + team right */}
      <Link href={`/players/${p.id}`} style={{ textDecoration: 'none',
        display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: COLOR.surface2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.ink3, letterSpacing: -0.5 }}>
            {initials(p.name)}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink, lineHeight: 1.25,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {p.name}
          </div>
          {p.teamName && (
            <div style={{ fontSize: 11, color: COLOR.ink4, marginTop: 3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.teamName}
            </div>
          )}
        </div>
      </Link>

      {/* Footer: activity left, follow right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: COLOR.ink3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activity}
        </div>
        <FollowButton entityType="player" entityId={p.id} size="sm" />
      </div>

    </div>
  )
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

  const { data: recent = [], isLoading: recentLoading } = useRecentPlayers()
  const { data: results, isLoading: searchLoading }     = useSearch(debouncedQ)

  const isSearching = debouncedQ.trim().length >= SEARCH_MIN
  const noResults   = isSearching && !searchLoading
    && results?.players.length === 0 && results?.teams.length === 0

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 20px 80px' }}>

        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color={COLOR.ink3} style={{ position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök spelare eller lag…"
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
          </>
        )}

        {/* Default: browse sections */}
        {!isSearching && (
          <>
            {/* Seriespel entry */}
            <SectionLabel label="Seriespel" />
            <Link href="/divisioner" style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: COLOR.surface, borderRadius: 16, padding: '16px 18px',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(245,194,0,0.10)', border: '1px solid rgba(245,194,0,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Trophy size={20} color={COLOR.gold} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink }}>Alla divisioner</div>
                  <div style={{ fontSize: 12, color: COLOR.ink3, marginTop: 2 }}>Elitserien · Allsvenskan · Division 1–5</div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={COLOR.ink4} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </Link>

            <SectionLabel label="Aktiva spelare" />
            {recentLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton"
                    style={{ height: 148, borderRadius: 16, background: COLOR.surface }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {recent.map(p => <PlayerCard key={p.id} p={p} />)}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  )
}
