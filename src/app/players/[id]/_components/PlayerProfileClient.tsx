'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { shortName } from '@/lib/utils'
import PlayerCard from '@/components/PlayerCard'
import PlayerEditSheet from './PlayerEditSheet'
import PlayerProfileView from './PlayerProfileView'
import { buildProfileFromResults } from '@/lib/profile-adapter'
import {
  seasonResults, validGames, matchAvgs as matchAvgsOf,
  calcRating, bkTopPercent,
} from '@/lib/player-stats'
import { usePlayer, usePlayerResults, useSession } from '@/lib/queries'
import type { Player, MatchResult } from '@/lib/types'
import type { ProfileIdentity } from '@/lib/profile'
import type { Achievement } from '@/app/mockup/_components/IdentitySection'
import { QUERY } from '@/lib/constants'

const BG  = '#0b0d10'
const INK = '#f4f5f7'

function mean(a: number[]) { return a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0 }

export default function PlayerProfileClient({ id }: { id: string }) {
  const { data: playerRaw, isLoading: playerLoading } = usePlayer(id)
  const { data: resultsRaw = [] }                      = usePlayerResults(id)
  const { data: session }                              = useSession()

  const player  = playerRaw as Player | undefined
  const results = resultsRaw as MatchResult[]

  const [team,        setTeam]        = useState<{ id: string; name: string } | null>(null)
  const [isOwner,     setIsOwner]     = useState(false)
  const [editing,     setEditing]     = useState(false)
  const [cardOpen,    setCardOpen]    = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareQuery,   setCompareQuery]   = useState('')
  const [compareResults, setCompareResults] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!player) return
    const supabase = createClient()
    if (player.team_id) {
      supabase.from('teams').select('id,name').eq('id', player.team_id).single()
        .then(({ data }) => { if (data) setTeam(data) })
    }
    if (session) {
      supabase.from('player_claims').select('id').eq('user_id', session.user.id).eq('player_id', id).single()
        .then(({ data }) => setIsOwner(!!data))
    }
    // Re-run only when the resolved player or signed-in user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id, session?.user?.id])

  const searchPlayers = async (q: string) => {
    setCompareQuery(q)
    if (q.trim().length < QUERY.SEARCH_MIN_CHARS) { setCompareResults([]); return }
    const { data } = await createClient().from('players').select('id,name').ilike('name', `%${q.trim()}%`).neq('id', id).limit(6)
    setCompareResults(data || [])
  }

  if (playerLoading) return null  // loading.tsx handles the skeleton
  if (!player) return (
    <main style={{ minHeight: '100vh', background: BG, color: 'rgba(244,245,247,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Spelare hittades inte
    </main>
  )

  // ── Build canonical ProfileData from real results ──────────────────────────
  const currResults = seasonResults(results, 'current')
  const prevResults = seasonResults(results, 'prev')
  const activeRes   = currResults.length > 0 ? currResults : results

  const activeAvg     = mean(validGames(activeRes))
  const prevGames     = validGames(prevResults)
  const lastSeasonAvg = prevGames.length > 0 ? mean(prevGames) : Math.max(0, activeAvg - 5)

  const data          = buildProfileFromResults(activeRes, player.team_id, { lastSeasonAvg })
  const prevMatchAvgs = matchAvgsOf(prevResults)

  const rating   = calcRating(data.seasonAvg, data.bestSeries, data.over200, data.hasData)
  const bkTopPct = Math.max(1, bkTopPercent(rating))   // never show "Top 0%"

  const firstName = player.name.split(' ')[0]
  const initials  = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const division  = results[0]?.matches?.division ?? ''
  const teamLabel = team ? [shortName(team.name), division].filter(Boolean).join(' · ') : division

  const identity: ProfileIdentity = {
    name: player.name, initials, teamLabel,
    followers: 0, following: 0,   // TODO: wire real follower counts
  }

  const achievements: Achievement[] = (player.achievements ?? []).map(a => ({
    icon: 'Trophy', title: a, earned: true, near: false, color: '#f5c200',
  }))

  return (
    <>
      <PlayerProfileView
        data={data}
        identity={identity}
        bkTopPct={bkTopPct}
        firstName={firstName}
        initials={initials}
        prevMatchAvgs={prevMatchAvgs.length > 1 ? prevMatchAvgs : undefined}
        achievements={achievements}
        isOwner={isOwner}
        onEdit={() => setEditing(true)}
        onOpenCard={() => setCardOpen(true)}
        onOpenH2H={() => { setCompareOpen(true); setCompareQuery(''); setCompareResults([]) }}
      />

      {/* ── Modals ── */}
      {editing && (
        <PlayerEditSheet
          player={player}
          onSave={() => { /* React Query refetches on next window focus */ }}
          onClose={() => setEditing(false)}
          isDark
        />
      )}

      {cardOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setCardOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <PlayerCard
              name={player.name} teamName={team?.name || ''} avatarUrl={player.avatar_url}
              avg={data.seasonAvg} bestSeries={data.bestSeries} over200={data.over200} matches={results.length}
              division={division} hand={player.hand}
              style={player.style} ballBrand={player.ball_brand} bio={player.bio}
              achievements={player.achievements || []} isDark isOwner={isOwner}
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
