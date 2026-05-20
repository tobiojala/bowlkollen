'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'

type Props = { params: Promise<{ id: string; matchid: string }> }

type Player = {
  id: string
  name: string
  avg: number
  bestSeries: number
  over200: number
  rating: number
  tier: string
  color: string
}

type Slot = {
  bord: number
  position: number
  player: Player | null
  isReserve: boolean
}

function MatchupDials({ teamId, matchId, oppId }: { teamId: string; matchId: string; oppId: string }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (!teamId || !oppId) return
    const supabase = createClient()
    Promise.all([
      supabase.from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .or('home_team_id.eq.' + teamId + ',away_team_id.eq.' + teamId)
        .eq('status', 'completed').not('home_score', 'is', null),
      supabase.from('match_results')
        .select('games, team_id')
        .eq('team_id', teamId),
      supabase.from('match_results')
        .select('games, team_id')
        .eq('team_id', oppId),
      supabase.from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .or(
          'and(home_team_id.eq.' + teamId + ',away_team_id.eq.' + oppId + '),' +
          'and(home_team_id.eq.' + oppId + ',away_team_id.eq.' + teamId + ')'
        ).eq('status', 'completed').not('home_score', 'is', null),
    ]).then(([{ data: myMatches }, { data: myResults }, { data: oppResults }, { data: h2h }]) => {
      // My snitt
      const myGames = (myResults || []).flatMap((r: any) => (r.games || []).filter((g: number) => g > 0))
      const myAvg = myGames.length > 0 ? Math.round(myGames.reduce((a: number, b: number) => a + b, 0) / myGames.length) : 0
      const my200 = myGames.filter((g: number) => g >= 200).length
      const myMatchCount = (myMatches || []).length || 1
      const my200PerMatch = Math.round((my200 / myMatchCount) * 10) / 10

      // Opp snitt
      const oppGames = (oppResults || []).flatMap((r: any) => (r.games || []).filter((g: number) => g > 0))
      const oppAvg = oppGames.length > 0 ? Math.round(oppGames.reduce((a: number, b: number) => a + b, 0) / oppGames.length) : 0
      const opp200 = oppGames.filter((g: number) => g >= 200).length
      const opp200PerMatch = oppResults && oppResults.length > 0 ? Math.round((opp200 / Math.max(1, oppResults.length / 8)) * 10) / 10 : 0

      // My form last 5
      const myForm = (myMatches || []).slice(0, 5).map((m: any) => {
        const isHome = m.home_team_id === teamId
        const myScore = isHome ? m.home_score : m.away_score
        const theirScore = isHome ? m.away_score : m.home_score
        return myScore > theirScore ? 'V' : myScore < theirScore ? 'F' : 'O'
      })

      // H2H
      let h2hW = 0, h2hD = 0, h2hL = 0
      ;(h2h || []).forEach((m: any) => {
        const isHome = m.home_team_id === teamId
        const myScore = isHome ? m.home_score : m.away_score
        const theirScore = isHome ? m.away_score : m.home_score
        if (myScore > theirScore) h2hW++
        else if (myScore < theirScore) h2hL++
        else h2hD++
      })

      setStats({ myAvg, oppAvg, my200PerMatch, opp200PerMatch, myForm, h2hW, h2hD, h2hL })
    })
  }, [teamId, oppId])

  if (!stats) return null

  const avgDiff = stats.myAvg - stats.oppAvg
  const avgAdvantage = stats.myAvg > stats.oppAvg
  const twohundredAdvantage = stats.my200PerMatch > stats.opp200PerMatch

  // Circle stroke calc
  const circle = (val: number, max: number, size: number) => {
    const r = size / 2 - 5
    const circ = 2 * Math.PI * r
    const pct = Math.min(val / max, 1)
    return { r, circ, offset: circ * (1 - pct) }
  }

  const avgCirc = circle(stats.myAvg, 300, 80)
  const oppAvgCirc = circle(stats.oppAvg, 300, 80)
  const c200 = circle(stats.my200PerMatch, 10, 96)
  const opp200c = circle(stats.opp200PerMatch, 10, 96)
  const formWins = stats.myForm.filter((f: string) => f === 'V').length
  const formCirc = circle(formWins, 5, 80)

  const muted = isDark ? '#6b7a99' : '#4a6080'

  // Analysis tip
  const tips = []
  if (avgAdvantage) tips.push('Snittfordel — stark taktik pa alla bord')
  else tips.push('Motstandaren har snittfordel — satsa pa konsistens')
  if (twohundredAdvantage) tips.push('200+ fordel — er explosivitet ar ett vapen')
  const tip = tips[0]

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginBottom: 10 }}>

        {/* Snitt dial */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r={avgCirc.r} fill="none" stroke={isDark ? '#1c2840' : '#e0e8f0'} strokeWidth="6"/>
              <circle cx="40" cy="40" r={oppAvgCirc.r} fill="none" stroke={isDark ? '#2a3858' : '#c8d4e8'} strokeWidth="6"
                strokeDasharray={oppAvgCirc.circ} strokeDashoffset={oppAvgCirc.offset}
                transform="rotate(-90 40 40)" strokeLinecap="round"/>
              <circle cx="40" cy="40" r={avgCirc.r} fill="none" stroke="#7f77dd" strokeWidth="6"
                strokeDasharray={avgCirc.circ} strokeDashoffset={avgCirc.offset}
                transform="rotate(-90 40 40)" strokeLinecap="round"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#afa9ec', lineHeight: 1 }}>{stats.myAvg || '—'}</div>
              <div style={{ fontSize: 8, color: muted, marginTop: 1 }}>{stats.oppAvg || '—'}</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: muted, letterSpacing: 0.5, marginTop: 4 }}>SNITT</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: avgAdvantage ? '#7f77dd' : '#e24b4a', marginTop: 1 }}>
            {avgDiff >= 0 ? '+' : ''}{avgDiff}
          </div>
        </div>

        {/* 200+ dial - bigger center */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto' }}>
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r={opp200c.r} fill="none" stroke={isDark ? '#1c2840' : '#e0e8f0'} strokeWidth="7"/>
              <circle cx="48" cy="48" r={opp200c.r} fill="none" stroke={isDark ? '#2a3858' : '#c8d4e8'} strokeWidth="7"
                strokeDasharray={opp200c.circ} strokeDashoffset={opp200c.offset}
                transform="rotate(-90 48 48)" strokeLinecap="round"/>
              <circle cx="48" cy="48" r={c200.r} fill="none" stroke="#1d9e75" strokeWidth="7"
                strokeDasharray={c200.circ} strokeDashoffset={c200.offset}
                transform="rotate(-90 48 48)" strokeLinecap="round"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: twohundredAdvantage ? '#1d9e75' : '#e24b4a', lineHeight: 1 }}>{stats.my200PerMatch}</div>
              <div style={{ fontSize: 9, color: muted, marginTop: 1 }}>{stats.opp200PerMatch}</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: muted, letterSpacing: 0.5, marginTop: 4 }}>200+ / MATCH</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: twohundredAdvantage ? '#1d9e75' : '#e24b4a', marginTop: 1 }}>
            {twohundredAdvantage ? 'Fordel' : 'Nackdel'}
          </div>
        </div>

        {/* Form dial */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r={formCirc.r} fill="none" stroke={isDark ? '#1c2840' : '#e0e8f0'} strokeWidth="6"/>
              <circle cx="40" cy="40" r={formCirc.r} fill="none" stroke="#f5c200" strokeWidth="6"
                strokeDasharray={formCirc.circ} strokeDashoffset={formCirc.offset}
                transform="rotate(-90 40 40)" strokeLinecap="round"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f5c200', lineHeight: 1 }}>{formWins}V</div>
              <div style={{ fontSize: 8, color: '#e24b4a', marginTop: 1 }}>{stats.myForm.filter((f: string) => f === 'F').length}F</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: muted, letterSpacing: 0.5, marginTop: 4 }}>FORM</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 4 }}>
            {stats.myForm.map((f: string, i: number) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: f === 'V' ? '#1d9e75' : f === 'F' ? '#e24b4a' : muted }} />
            ))}
          </div>
        </div>

      </div>

      {/* Analysis tip */}
      <div style={{ borderTop: '1px solid ' + (isDark ? '#1c2840' : '#d0d8e8'), paddingTop: 10 }}>
        <div style={{ fontSize: 12, color: isDark ? '#afa9ec' : '#534ab7' }}>
          <span style={{ fontWeight: 700 }}>Analys: </span>{tip}
        </div>
      </div>
    </div>
  )
}

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

function calcRating(avg: number, best: number, over200: number, hasData: boolean): number {
  if (!hasData) return Math.min(60, Math.round(avg * 0.3))
  return Math.min(99, Math.round(avg * 0.4 + (best / 4 / 10) * 0.4 + over200 * 1.5))
}

function getTier(rating: number): { label: string; color: string; bg: string; border: string } {
  if (rating >= 95) return { label: 'LEGEND', color: '#f5c200', bg: 'rgba(245,194,0,0.12)', border: '#f5c200' }
  if (rating >= 85) return { label: 'ELITE', color: '#afa9ec', bg: 'rgba(127,119,221,0.12)', border: '#7f77dd' }
  if (rating >= 75) return { label: 'PRO', color: '#5dcaa5', bg: 'rgba(29,158,117,0.12)', border: '#1d9e75' }
  if (rating >= 60) return { label: 'VETERAN', color: '#ef9f27', bg: 'rgba(186,117,23,0.12)', border: '#ba7517' }
  return { label: 'ROOKIE', color: '#8899aa', bg: 'rgba(255,255,255,0.04)', border: '#2a3858' }
}

function stars(rating: number) {
  const s = Math.round(rating / 20)
  return '★'.repeat(s) + '☆'.repeat(5 - s)
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function LaguttagningPage({ params }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [teamId, setTeamId] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [match, setMatch] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [published, setPublished] = useState(false)
  const [lineupId, setLineupId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState<{ bord: number; position: number; isReserve: boolean } | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  const bg = isDark ? '#0d1520' : '#f0f4f8'
  const card = isDark ? '#172030' : '#ffffff'
  const card2 = isDark ? '#1c2840' : '#f8fafc'
  const border = isDark ? '#2a3858' : '#d0d8e8'
  const text = isDark ? '#ffffff' : '#0d1f35'
  const muted = isDark ? '#6b7a99' : '#4a6080'
  const accent = '#f5c200'

  useEffect(() => { params.then(p => { setTeamId(p.id); setMatchId(p.matchid) }) }, [params])

  useEffect(() => {
    if (!teamId || !matchId) return
    const supabase = createClient()

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const { data: membership } = await supabase
        .from('team_members').select('role, status')
        .eq('team_id', teamId).eq('user_id', session.user.id).single()

      if (!membership || membership.status !== 'active' || !['captain', 'admin'].includes(membership.role)) {
        window.location.href = '/team/' + teamId + '/intern'; return
      }

      const { data: m } = await supabase
        .from('matches').select('*, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
        .eq('id', matchId).single()
      if (m) setMatch(m)

      // Load players with stats
      const { data: teamPlayers } = await supabase
        .from('players').select('id, name').eq('team_id', teamId).order('name')

      // Load members as players too
      const { data: members } = await supabase
        .from('team_members').select('user_id').eq('team_id', teamId).eq('status', 'active')

      const { data: profiles } = await supabase
        .from('profiles').select('id, full_name')
        .in('id', (members || []).map((m: any) => m.user_id))

      // Load match results for stats
      const { data: results } = await supabase
        .from('match_results').select('player_id, games')
        .eq('team_id', teamId)

      // Build player list with stats
      const playerMap: Record<string, { games: number[]; name: string }> = {}

      // Add squad players
      teamPlayers?.forEach((p: any) => {
        playerMap[p.id] = { games: [], name: p.name }
      })

      // Add member profiles not already in squad
      profiles?.forEach((p: any) => {
        if (p.full_name && !Object.values(playerMap).find(x => x.name === p.full_name)) {
          playerMap[p.id] = { games: [], name: p.full_name }
        }
      })

      // Add game stats
      results?.forEach((r: any) => {
        if (playerMap[r.player_id]) {
          const games = (r.games || []).filter((g: number) => g > 0)
          playerMap[r.player_id].games.push(...games)
        }
      })

      const builtPlayers: Player[] = Object.entries(playerMap).map(([id, data]) => {
        const games = data.games
        const avg = games.length > 0 ? Math.round(games.reduce((a, b) => a + b, 0) / games.length) : 180
        const bestSeries = games.length >= 4
          ? Math.max(...Array.from({ length: Math.floor(games.length / 4) }, (_, i) =>
              games.slice(i * 4, i * 4 + 4).reduce((a, b) => a + b, 0)))
          : games.length > 0 ? games.reduce((a, b) => a + b, 0) : 680
        const over200 = games.filter(g => g >= 200).length
        const rating = calcRating(avg, bestSeries, over200, games.length > 0)
        const tier = getTier(rating)
        return { id, name: data.name, avg, bestSeries, over200, rating, tier: tier.label, color: tier.color }
      }).sort((a, b) => b.rating - a.rating)

      setPlayers(builtPlayers)

      // Init slots
      const initSlots: Slot[] = []
      for (let bord = 1; bord <= 4; bord++) {
        for (let pos = 1; pos <= 2; pos++) {
          initSlots.push({ bord, position: pos, player: null, isReserve: false })
        }
      }
      initSlots.push({ bord: 0, position: 1, player: null, isReserve: true })
      initSlots.push({ bord: 0, position: 2, player: null, isReserve: true })
      setSlots(initSlots)

      // Load existing lineup
      const { data: lineup } = await supabase
        .from('lineups').select('*, lineup_slots(*)')
        .eq('team_id', teamId).eq('match_id', matchId).single()

      if (lineup) {
        setLineupId(lineup.id)
        setPublished(lineup.status === 'published')
        setSlots(prev => prev.map(slot => {
          const existing = lineup.lineup_slots?.find((s: any) =>
            s.bord === slot.bord && s.position === slot.position && s.is_reserve === slot.isReserve
          )
          if (existing) {
            const p = builtPlayers.find(x => x.id === existing.user_id || x.name === existing.player_name)
            return { ...slot, player: p || null }
          }
          return slot
        }))
      }

      setLoading(false)
    }
    load()
  }, [teamId, matchId])

  const openSheet = (bord: number, position: number, isReserve: boolean) => {
    setActiveSlot({ bord, position, isReserve })
    setSheetOpen(true)
  }

  const assignPlayer = (player: Player) => {
    if (!activeSlot) return
    setSlots(prev => prev.map(s =>
      s.bord === activeSlot.bord && s.position === activeSlot.position && s.isReserve === activeSlot.isReserve
        ? { ...s, player }
        : s
    ))
    setSheetOpen(false)
    setActiveSlot(null)
  }

  const clearSlot = (bord: number, position: number, isReserve: boolean) => {
    setSlots(prev => prev.map(s =>
      s.bord === bord && s.position === position && s.isReserve === isReserve
        ? { ...s, player: null }
        : s
    ))
  }

  const usedIds = slots.filter(s => s.player).map(s => s.player!.id)

  const saveLineup = async (publish: boolean) => {
    if (!teamId || !matchId) return
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let lid = lineupId
    if (!lid) {
      const { data: nl } = await supabase.from('lineups')
        .insert({ team_id: teamId, match_id: matchId, created_by: session.user.id, status: publish ? 'published' : 'draft' })
        .select('id').single()
      if (nl) lid = nl.id
    } else {
      await supabase.from('lineups').update({ status: publish ? 'published' : 'draft' }).eq('id', lid)
    }
    if (!lid) { setSaving(false); return }
    setLineupId(lid)

    await supabase.from('lineup_slots').delete().eq('lineup_id', lid)
    const toInsert = slots.filter(s => s.player).map(s => ({
      lineup_id: lid,
      user_id: s.player!.id,
      player_name: s.player!.name,
      bord: s.bord,
      position: s.position,
      is_reserve: s.isReserve,
    }))
    if (toInsert.length > 0) await supabase.from('lineup_slots').insert(toInsert)
    if (publish) setPublished(true)
    setSaving(false)
  }

  // Team rating calculation
  const filledSlots = slots.filter(s => s.player && !s.isReserve)
  const teamRating = filledSlots.length > 0
    ? Math.round(filledSlots.reduce((a, s) => a + s.player!.rating, 0) / filledSlots.length)
    : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: muted }}>
      Laddar...
    </div>
  )

  const isHome = match?.home_team_id === teamId
  const opp = isHome ? match?.away : match?.home

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: 'system-ui, sans-serif', paddingBottom: 80, position: 'relative' }}>

      {/* Header */}
      <div style={{ background: isDark ? '#0d1a2e' : '#e8f0f8', padding: '16px 20px 14px', borderBottom: '1px solid ' + border }}>
        <a href={'/team/' + teamId + '/intern'} style={{ fontSize: 12, color: muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          ← Lagets sida
        </a>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: 1.5, marginBottom: 4 }}>LAGUTTAGNING</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: text }}>vs {shortName(opp?.name || '')}</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
              {match?.date ? new Date(match.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
              {' · '}{isHome ? 'Hemma' : 'Borta'}
            </div>
          </div>
          {teamRating > 0 && (
            <div style={{ textAlign: 'center', background: card, borderRadius: 12, border: '1px solid ' + border, padding: '8px 14px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{teamRating}</div>
              <div style={{ fontSize: 9, color: muted, letterSpacing: 1 }}>LAGRATING</div>
            </div>
          )}
        </div>
        {published && (
          <div style={{ marginTop: 8, display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#5dcaa5', background: 'rgba(29,158,117,0.15)', borderRadius: 6, padding: '3px 10px' }}>
            Publicerad till laget
          </div>
        )}

        {/* Matchup gyro dials */}
        <MatchupDials teamId={teamId!} matchId={matchId!} oppId={isHome ? match?.away_team_id : match?.home_team_id} />
      </div>

      {/* Bords */}
      <div style={{ padding: '16px 20px' }}>
        {[1, 2, 3, 4].map(bord => (
          <div key={bord} style={{ marginBottom: 10, background: card, borderRadius: 14, border: '1px solid ' + border, overflow: 'hidden' }}>
            <div style={{ padding: '7px 14px', background: isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.08)', borderBottom: '1px solid ' + border, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: 1.5 }}>BORD {bord}</span>
              {slots.filter(s => s.bord === bord && s.player).length === 2 && (
                <span style={{ fontSize: 10, color: '#5dcaa5', marginLeft: 'auto' }}>
                  ★ {Math.round(slots.filter(s => s.bord === bord && s.player).reduce((a, s) => a + s.player!.rating, 0) / 2)} rating
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {[1, 2].map(pos => {
                const slot = slots.find(s => s.bord === bord && s.position === pos && !s.isReserve)
                const p = slot?.player
                const tier = p ? getTier(p.rating) : null
                return (
                  <div key={pos}
                    onClick={() => p ? clearSlot(bord, pos, false) : openSheet(bord, pos, false)}
                    style={{ padding: '12px 14px', borderRight: pos === 1 ? '1px solid ' + border : 'none', cursor: 'pointer', transition: 'background 0.1s', minHeight: 68 }}
                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {p && tier ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: tier.bg, border: '2px solid ' + tier.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: tier.color, flexShrink: 0 }}>
                          {initials(p.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name.split(' ')[0]}</div>
                          <div style={{ fontSize: 10, color: tier.color, fontWeight: 600 }}>{tier.label} · {p.rating}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: '100%' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px dashed ' + border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 16, color: muted, lineHeight: 1 }}>+</span>
                        </div>
                        <div style={{ fontSize: 12, color: muted }}>Position {pos}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Reserves */}
        <div style={{ background: card, borderRadius: 14, border: '1px solid ' + border, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '7px 14px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderBottom: '1px solid ' + border }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: muted, letterSpacing: 1.5 }}>RESERVER</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {[0, 1].map(i => {
              const slot = slots.find(s => s.isReserve && s.position === i + 1)
              const p = slot?.player
              const tier = p ? getTier(p.rating) : null
              return (
                <div key={i}
                  onClick={() => p ? clearSlot(0, i + 1, true) : openSheet(0, i + 1, true)}
                  style={{ padding: '12px 14px', borderRight: i === 0 ? '1px solid ' + border : 'none', cursor: 'pointer', minHeight: 60 }}
                  onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {p && tier ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: tier.bg, border: '1.5px solid ' + tier.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: tier.color, flexShrink: 0 }}>
                        {initials(p.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: text }}>{p.name.split(' ')[0]}</div>
                        <div style={{ fontSize: 10, color: muted }}>Reserv</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px dashed ' + border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 16, color: muted, lineHeight: 1 }}>+</span>
                      </div>
                      <div style={{ fontSize: 12, color: muted }}>Reserv {i + 1}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom sheet overlay */}
      {sheetOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setSheetOpen(false)} />
          <div ref={sheetRef} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: isDark ? '#172030' : '#ffffff', borderRadius: '20px 20px 0 0', border: '1px solid ' + border, maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 20px 8px', borderBottom: '1px solid ' + border, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, background: border, borderRadius: 2, margin: '0 auto 12px' }} />
              <div style={{ fontSize: 11, fontWeight: 800, color: muted, letterSpacing: 1.5 }}>VALJ SPELARE</div>
            </div>
            <div style={{ overflowX: 'auto', overflowY: 'hidden', padding: '12px 16px 24px', display: 'flex', flexDirection: 'row', gap: 10, scrollbarWidth: 'none' } as any}>
              {players.map(p => {
                const tier = getTier(p.rating)
                const isUsed = usedIds.includes(p.id)
                return (
                  <div key={p.id}
                    onClick={() => !isUsed && assignPlayer(p)}
                    style={{ width: 120, flexShrink: 0, cursor: isUsed ? 'default' : 'pointer', opacity: isUsed ? 0.35 : 1 }}
                  >
                    <div style={{ background: tier.bg, border: '2px solid ' + tier.border, borderRadius: 16, overflow: 'hidden', transition: 'transform 0.15s' }}
                      onMouseEnter={e => { if(!isUsed)(e.currentTarget as HTMLElement).style.transform='scale(1.03)' }}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform='scale(1)'}
                    >
                      {/* Card top */}
                      <div style={{ padding: '10px 8px 6px', textAlign: 'center', borderBottom: '1px solid ' + tier.border + '44' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: tier.color, letterSpacing: 1, marginBottom: 6 }}>{tier.label}</div>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', border: '2px solid ' + tier.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: tier.color, margin: '0 auto 6px' }}>
                          {initials(p.name)}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name.split(' ')[0]}</div>
                        <div style={{ fontSize: 9, color: muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name.split(' ').slice(1).join(' ')}</div>
                      </div>
                      {/* Stats */}
                      <div style={{ padding: '8px 6px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
                        {[
                          { label: 'SNT', value: p.avg },
                          { label: 'BST', value: Math.round(p.bestSeries / 100) * 100 || '—' },
                          { label: '200', value: p.over200 },
                        ].map(s => (
                          <div key={s.label} style={{ textAlign: 'center', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)', borderRadius: 6, padding: '4px 2px' }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: tier.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: 7, color: muted, marginTop: 1, letterSpacing: 0.5 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      {/* Rating */}
                      <div style={{ padding: '4px 8px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: tier.color }}>
                          {'★'.repeat(Math.round(p.rating / 20))}{'☆'.repeat(5 - Math.round(p.rating / 20))}
                        </div>
                        <div style={{ fontSize: 8, color: muted, marginTop: 1 }}>{p.rating} RATING</div>
                      </div>
                    </div>
                    {!isUsed && (
                      <div style={{ textAlign: 'center', marginTop: 6 }}>
                        <div style={{ display: 'inline-block', background: accent, borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#1a1400' }}>Valj</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Save bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: isDark ? '#0d1520' : '#ffffff', borderTop: '1px solid ' + border, padding: '12px 20px', display: 'flex', gap: 8 }}>
        <button onClick={() => saveLineup(false)} disabled={saving}
          style={{ flex: 1, background: 'transparent', border: '1px solid ' + border, borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, color: muted, cursor: 'pointer' }}>
          Spara utkast
        </button>
        <button onClick={() => saveLineup(true)} disabled={saving}
          style={{ flex: 2, background: accent, border: 'none', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, color: '#1a1400', cursor: 'pointer' }}>
          {saving ? 'Publicerar...' : published ? 'Uppdatera' : 'Publicera till laget'}
        </button>
      </div>

    </div>
  )
}
