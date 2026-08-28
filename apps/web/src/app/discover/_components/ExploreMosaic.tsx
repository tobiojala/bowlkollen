'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'
import { SCORE } from '@/lib/constants'
import { COLOR, FONT } from '@/lib/brand'
import { shortName, shortDiv } from '@/lib/utils'
import { diversifyByKind } from '@bowlkollen/core'
import FollowButton from '@/components/FollowButton'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { IdentityAvatar } from '@/components/IdentityAvatar'
import { useBitsTopScores, useBitsMatchFeed } from '@/lib/queries'
import { HOME_PROMOS } from '@/lib/home-promos'
import type { BitsTopScore, BitsMatchFeed } from '@/lib/types'

// The Instagram-Explore mosaic for Hitta: no rigid sections, a diversified mix
// of what's happening across bowlingen — hot scores, notable matches, player &
// hall spotlights, and the house ad. Every tile a doorway. League-wide (not
// followed-scoped — that's Home). Shows initials until photos are approved.

type RecentPlayer = { public_id: string; name: string; club_name: string | null; last_total: number | null; hall_name: string | null }
type Center = { id: number; name: string; city: string | null; lanes: number | null }
type Tile = { kind: string; key: string; node: React.ReactNode }

function useRecentPlayers() {
  return useQuery({
    queryKey: ['explore', 'recent-players'],
    staleTime: STALE.DEFAULT,
    queryFn: async (): Promise<RecentPlayer[]> => {
      const { data } = await createClient().rpc('get_discover_recent_players', { p_limit: 24 })
      return (data ?? []) as RecentPlayer[]
    },
  })
}

function useCenters() {
  return useQuery({
    queryKey: ['explore', 'centers'],
    staleTime: STALE.LONG,
    queryFn: async (): Promise<Center[]> => {
      const { data } = await createClient().from('bowling_centers').select('id, name, city, lanes').order('lanes', { ascending: false }).limit(6)
      return (data ?? []) as Center[]
    },
  })
}

const card: React.CSSProperties = { background: COLOR.surface, borderRadius: 16, overflow: 'hidden', display: 'block', textDecoration: 'none', breakInside: 'avoid', marginBottom: 11 }
const kick: React.CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }
const sub: React.CSSProperties = { fontSize: 13, color: COLOR.ink3, marginTop: 3 }
const cta: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: COLOR.gold, marginTop: 10, display: 'inline-block' }

function ScoreTile({ s }: { s: BitsTopScore }) {
  const gold = s.total >= SCORE.SERIES_HIGH
  return (
    <Link href={`/matcher/${s.matchId}`} style={card}>
      <div style={{ padding: 15 }}>
        <span style={{ ...kick, color: COLOR.gold, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Flame size={13} color={COLOR.gold} /> TOPPSERIE</span>
        <div style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 44, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1, marginTop: 6, color: gold ? COLOR.gold : COLOR.ink }}>{s.total}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink, marginTop: 6 }}>{s.playerName}</div>
        <div style={sub}>{shortDiv(s.division)}</div>
      </div>
    </Link>
  )
}

function PlayerTile({ p }: { p: RecentPlayer }) {
  const activity = [p.last_total ? `Snitt ${p.last_total}` : null, p.club_name].filter(Boolean).join(' · ')
  return (
    <div style={{ ...card, padding: 15 }}>
      <span style={{ ...kick, color: COLOR.ink3 }}>I HETLUFTEN</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <PlayerAvatar publicId={p.public_id} name={p.name} size={40} />
        <Link href={`/players/${p.public_id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(p.name)}</div>
          {!!activity && <div style={{ ...sub, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity}</div>}
        </Link>
      </div>
      <div style={{ marginTop: 12 }}><FollowButton entityType="player" entityId={p.public_id} size="sm" /></div>
    </div>
  )
}

function MatchTile({ m }: { m: BitsMatchFeed }) {
  const done = m.is_finished
  return (
    <Link href={`/matcher/${m.bits_match_id}`} style={card}>
      <div style={{ padding: 15 }}>
        <span style={{ ...kick, color: done ? COLOR.ink3 : COLOR.gold }}>{done ? 'RESULTAT' : 'KOMMANDE'}</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 14, color: COLOR.ink, fontWeight: done && (m.home_result ?? 0) > (m.away_result ?? 0) ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(m.home_team_name)}</span>
          {done && <span style={{ fontFamily: FONT.score, fontWeight: 700, fontSize: 15 }}>{m.home_result}</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: 14, color: COLOR.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(m.away_team_name)}</span>
          {done && <span style={{ fontFamily: FONT.score, fontWeight: 700, fontSize: 15, color: COLOR.ink2 }}>{m.away_result}</span>}
        </div>
        <div style={sub}>{shortDiv(m.division_name ?? '')}</div>
      </div>
    </Link>
  )
}

function CenterTile({ c }: { c: Center }) {
  return (
    <Link href={`/hallar/${c.id}`} style={card}>
      <div style={{ padding: 15 }}>
        <span style={{ ...kick, color: COLOR.ink3 }}>HALL</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <IdentityAvatar name={c.name} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
            <div style={sub}>{[c.city, c.lanes ? `${c.lanes} banor` : null].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
        <span style={cta}>Visa hall →</span>
      </div>
    </Link>
  )
}

function PromoTile() {
  const p = HOME_PROMOS[0]
  return (
    <Link href={p.href} style={card}>
      <div style={{ padding: 15 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ ...kick, color: COLOR.ink3 }}>{p.kicker}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, letterSpacing: '0.06em' }}>BOWLKOLLEN</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLOR.ink, marginTop: 8, lineHeight: 1.25 }}>{p.title}</div>
        <div style={{ fontSize: 13, color: COLOR.ink3, marginTop: 3, lineHeight: 1.4 }}>{p.body}</div>
        <span style={cta}>{p.cta} →</span>
      </div>
    </Link>
  )
}

export function ExploreMosaic() {
  const { data: scores = [] } = useBitsTopScores()
  const { data: players = [] } = useRecentPlayers()
  const { data: bits } = useBitsMatchFeed()
  const { data: centers = [] } = useCenters()

  const matches = [...(bits?.recent ?? []).slice(0, 4), ...(bits?.upcoming ?? []).slice(0, 3)]

  const tiles: Tile[] = [
    ...scores.slice(0, 6).map((s) => ({ kind: 'score', key: `s${s.matchId}-${s.playerName}`, node: <ScoreTile s={s} /> })),
    ...players.slice(0, 8).map((p) => ({ kind: 'player', key: `p${p.public_id}`, node: <PlayerTile p={p} /> })),
    ...matches.map((m) => ({ kind: 'match', key: `m${m.bits_match_id}`, node: <MatchTile m={m} /> })),
    ...centers.slice(0, 3).map((c) => ({ kind: 'center', key: `c${c.id}`, node: <CenterTile c={c} /> })),
    { kind: 'promo', key: 'house-promo', node: <PromoTile /> },
  ]
  const mixed = diversifyByKind(tiles)

  if (mixed.length <= 1) return null

  return (
    <div className="explore-mosaic">
      <style>{`
        .explore-mosaic { column-count: 2; column-gap: 11px; margin-top: 18px; }
        @media (min-width: 1024px) { .explore-mosaic { column-count: 3; } }
      `}</style>
      {mixed.map((t) => <div key={t.key}>{t.node}</div>)}
    </div>
  )
}
