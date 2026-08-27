'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { playerSearchTokens } from '@bowlkollen/core'
import PlayerCard from '@/components/PlayerCard'
import PlayerProfileView from './PlayerProfileView'
import { buildProfileFromBitsRows } from '@/lib/profile-adapter'
import { calcRating, bkTopPercent } from '@/lib/player-stats'
import { usePlayerIdentity, usePlayerBitsResults, usePlayerPercentile, useSession } from '@/lib/queries'
import { useTrackAnonView } from '@/lib/use-track-anon-view'
import type { ProfileIdentity } from '@/lib/profile'
import type { Achievement } from '@/app/mockup/_components/IdentitySection'
import { SEASON, QUERY } from '@/lib/constants'

const BG  = '#0b0d10'
const INK = '#f4f5f7'

function mean(a: number[]) { return a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0 }

export default function PlayerProfileClient({ id }: { id: string }) {
  const { data: identityRaw, isLoading: identityLoading } = usePlayerIdentity(id)
  const { data: rowsRaw = [] }                             = usePlayerBitsResults(id)
  const { data: realPct }                                  = usePlayerPercentile(id)
  const { data: session }                                  = useSession()

  const player = identityRaw

  // Pre-signup signal for onboarding suggestions — junior profiles excluded
  // (public, but no social/tracking surfaces until claimed, per launch policy).
  useTrackAnonView('player', player ? id : null, player?.isJunior === true)

  const [isOwner,     setIsOwner]     = useState(false)
  const [cardOpen,    setCardOpen]    = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareQuery,   setCompareQuery]   = useState('')
  const [compareResults, setCompareResults] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!session) { setIsOwner(false); return }
    createClient().from('player_claims').select('id').eq('user_id', session.user.id).eq('player_id', id).maybeSingle()
      .then(({ data }) => setIsOwner(!!data))
  }, [id, session?.user?.id])

  const searchPlayers = async (q: string) => {
    setCompareQuery(q)
    if (q.trim().length < QUERY.SEARCH_MIN_CHARS) { setCompareResults([]); return }
    let pq = createClient().from('bits_players').select('public_id,first_name,sur_name')
    for (const w of playerSearchTokens(q)) pq = pq.or(`first_name.ilike.%${w}%,sur_name.ilike.%${w}%`)
    const { data } = await pq.neq('public_id', id).limit(6)
    setCompareResults((data ?? []).map(p => ({ id: p.public_id, name: `${p.first_name} ${p.sur_name}`.trim() })))
  }

  if (identityLoading) return null  // loading.tsx handles the skeleton
  if (!player) return (
    <main style={{ minHeight: '100vh', background: BG, color: 'rgba(244,245,247,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Spelare hittades inte
    </main>
  )

  // ── Build canonical ProfileData from real BITS results ─────────────────────
  const currRows = rowsRaw.filter(r => r.matchDate >= SEASON.CURRENT)
  const prevRows = rowsRaw.filter(r => r.matchDate >= SEASON.PREV && r.matchDate < SEASON.CURRENT)
  const activeRows = currRows.length > 0 ? currRows : rowsRaw

  const activeAvg     = mean(activeRows.flatMap(r => r.series.filter(g => g > 0)))
  const prevGames     = prevRows.flatMap(r => r.series.filter(g => g > 0))
  const lastSeasonAvg = prevGames.length > 0 ? mean(prevGames) : Math.max(0, activeAvg - 5)

  const data          = buildProfileFromBitsRows(activeRows, { lastSeasonAvg })
  const prevMatchAvgs = prevRows
    .map(r => { const g = r.series.filter(s => s > 0); return g.length ? mean(g) : null })
    .filter((v): v is number => v !== null)

  // Real percentile from BITS' own licence_average distribution when
  // available; falls back to the simulated curve otherwise (e.g. a player
  // with no registered average yet).
  const rating   = calcRating(data.seasonAvg, data.bestSeries, data.over200, data.hasData)
  const bkTopPct = realPct ?? Math.max(1, bkTopPercent(rating))

  const firstName = player.name.split(' ')[0]
  const initials  = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const latestDivision = rowsRaw[rowsRaw.length - 1]?.divisionName ?? ''
  const teamLabel = [player.clubName, latestDivision].filter(Boolean).join(' · ')

  const identity: ProfileIdentity = {
    name: player.name, initials, teamLabel,
    followers: 0, following: 0,   // TODO: wire real follower counts
    isJunior: player.isJunior, isClaimed: player.isClaimed,
  }

  // Bio/avatar/achievements live in a separate editable-extras table once
  // the claim flow grows that far — not built yet, so these stay empty for
  // every player until then.
  const achievements: Achievement[] = []

  return (
    <>
      <PlayerProfileView
        playerId={id}
        data={data}
        identity={identity}
        bkTopPct={bkTopPct}
        licenceAverage={player.licenceAverage ?? undefined}
        firstName={firstName}
        prevMatchAvgs={prevMatchAvgs.length > 1 ? prevMatchAvgs : undefined}
        achievements={achievements}
        isOwner={isOwner}
        onOpenCard={() => setCardOpen(true)}
        onOpenH2H={() => { setCompareOpen(true); setCompareQuery(''); setCompareResults([]) }}
      />

      {/* ── Modals ──
          No onEdit: bio/avatar/hand/style/ball_brand have no equivalent yet
          for real BITS-sourced players (would need a new editable-extras
          table keyed by public_id once claiming is built out further). */}
      {cardOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start' }}
          onClick={() => setCardOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <PlayerCard
              name={player.name} teamName={player.clubName || ''} avatarUrl={null}
              avg={data.seasonAvg} bestSeries={data.bestSeries} over200={data.over200} matches={data.matches.length}
              division={latestDivision} hand={null}
              style={null} ballBrand={null} bio={null}
              achievements={[]} isDark isOwner={isOwner}
              onClose={() => setCardOpen(false)}
            />
          </div>
        </div>
      )}

      {compareOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setCompareOpen(false)}>
          <div style={{ width: '100%', maxWidth: 600, background: '#14171c', borderRadius: '20px 20px 0 0',
            padding: 20, maxHeight: '60dvh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 14 }}>Jämför med spelare</div>
            <input value={compareQuery} onChange={e => searchPlayers(e.target.value)} placeholder="Sök spelare..."
              style={{ width: '100%', background: '#0b0d10', border: '1px solid rgba(244,245,247,0.1)', borderRadius: 10,
                padding: '10px 14px', color: INK, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
            {compareResults.map(p => (
              <Link key={p.id} href={`/compare/${id}/${p.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0', borderTop: '1px solid rgba(244,245,247,0.07)', textDecoration: 'none' }}>
                <span style={{ fontSize: 15, color: INK }}>{p.name}</span>
                <span style={{ fontSize: 13, color: 'rgba(244,245,247,0.4)' }}>Jämför →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
