'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'

type Props = { params: Promise<{ id: string; matchid: string }> }

type Player = {
  id: string; name: string; teamName: string
  avg: number; bestSeries: number; over200: number
  rating: number; tier: string
  color: string; bgColor: string; borderColor: string
}

type Slot = { bord: number; position: number; player: Player | null; isReserve: boolean }

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

function initials(n: string) {
  return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function calcRating(avg: number, best: number, over200: number, hasData: boolean): number {
  if (!hasData) return Math.min(55, Math.round(avg * 0.3))
  return Math.min(99, Math.round(avg * 0.4 + (best / 4 / 10) * 0.4 + over200 * 1.5))
}

function getTier(rating: number) {
  if (rating >= 95) return { label: 'LEGEND', color: '#f5c200', bg: 'rgba(245,194,0,0.12)', border: '#c9960a', textColor: '#f5c200', cardBg: 'linear-gradient(160deg,#1a1608 0%,#0d1520 100%)' }
  if (rating >= 85) return { label: 'ELITE', color: '#afa9ec', bg: 'rgba(127,119,221,0.12)', border: '#7f77dd', textColor: '#afa9ec', cardBg: 'linear-gradient(160deg,#1c1640 0%,#0d1520 100%)' }
  if (rating >= 75) return { label: 'PRO', color: '#5dcaa5', bg: 'rgba(29,158,117,0.12)', border: '#1d9e75', textColor: '#5dcaa5', cardBg: 'linear-gradient(160deg,#0f1f1a 0%,#0d1520 100%)' }
  if (rating >= 60) return { label: 'VETERAN', color: '#ef9f27', bg: 'rgba(186,117,23,0.12)', border: '#ba7517', textColor: '#ef9f27', cardBg: 'linear-gradient(160deg,#1a1608 0%,#0d1520 100%)' }
  return { label: 'ROOKIE', color: '#8899aa', bg: 'rgba(255,255,255,0.04)', border: '#2a3858', textColor: '#8899aa', cardBg: '#141e2e' }
}

function stars(rating: number) {
  const s = Math.round(rating / 20)
  return { filled: s, empty: 5 - s }
}

function MatchupDials({ teamId, oppId, isDark, muted }: { teamId: string; oppId: string; isDark: boolean; muted: string }) {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (!teamId || !oppId) return
    const supabase = createClient()
    Promise.all([
      supabase.from('matches').select('home_team_id, away_team_id, home_score, away_score').or('home_team_id.eq.' + teamId + ',away_team_id.eq.' + teamId).eq('status', 'completed').not('home_score', 'is', null),
      supabase.from('match_results').select('games').eq('team_id', teamId),
      supabase.from('match_results').select('games').eq('team_id', oppId),
      supabase.from('matches').select('home_team_id, away_team_id, home_score, away_score').or('and(home_team_id.eq.' + teamId + ',away_team_id.eq.' + oppId + '),and(home_team_id.eq.' + oppId + ',away_team_id.eq.' + teamId + ')').eq('status', 'completed').not('home_score', 'is', null),
    ]).then(([{ data: myMatches }, { data: myR }, { data: oppR }, { data: h2h }]) => {
      const myGames = (myR || []).flatMap((r: any) => (r.games || []).filter((g: number) => g > 0))
      const oppGames = (oppR || []).flatMap((r: any) => (r.games || []).filter((g: number) => g > 0))
      const myAvg = myGames.length > 0 ? Math.round(myGames.reduce((a: number, b: number) => a + b, 0) / myGames.length) : 0
      const oppAvg = oppGames.length > 0 ? Math.round(oppGames.reduce((a: number, b: number) => a + b, 0) / oppGames.length) : 0
      const my200 = myGames.filter((g: number) => g >= 200).length
      const opp200 = oppGames.filter((g: number) => g >= 200).length
      const myMatchCount = Math.max(1, (myMatches || []).length)
      const my200pm = Math.round((my200 / myMatchCount) * 10) / 10
      const opp200pm = oppR && oppR.length > 0 ? Math.round((opp200 / Math.max(1, oppR.length / 8)) * 10) / 10 : 0
      const myForm = (myMatches || []).slice(0, 5).map((m: any) => {
        const isHome = m.home_team_id === teamId
        const ms = isHome ? m.home_score : m.away_score
        const ts = isHome ? m.away_score : m.home_score
        return ms > ts ? 'V' : ms < ts ? 'F' : 'O'
      })
      let h2hW = 0, h2hL = 0
      ;(h2h || []).forEach((m: any) => {
        const isHome = m.home_team_id === teamId
        const ms = isHome ? m.home_score : m.away_score
        const ts = isHome ? m.away_score : m.home_score
        if (ms > ts) h2hW++; else if (ms < ts) h2hL++
      })
      setStats({ myAvg, oppAvg, my200pm, opp200pm, myForm, h2hW, h2hL })
    })
  }, [teamId, oppId])

  if (!stats) return null

  const circ = (val: number, max: number, r: number) => {
    const c = 2 * Math.PI * r
    return { c, offset: c * (1 - Math.min(val / max, 1)) }
  }

  const avgC = circ(stats.myAvg, 280, 28)
  const oppAvgC = circ(stats.oppAvg, 280, 28)
  const c200 = circ(stats.my200pm, 8, 34)
  const opp200c = circ(stats.opp200pm, 8, 34)
  const formC = circ(stats.myForm.filter((f: string) => f === 'V').length, 5, 28)
  const avgAdv = stats.myAvg > stats.oppAvg
  const advColor = avgAdv ? '#1d9e75' : '#e24b4a'
  const track = isDark ? '#1c2840' : '#e0e8f0'
  const track2 = isDark ? '#2a3858' : '#c8d4e8'

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginBottom: 10 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto' }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke={track} strokeWidth="5"/>
              <circle cx="36" cy="36" r="28" fill="none" stroke={track2} strokeWidth="5" strokeDasharray={oppAvgC.c} strokeDashoffset={oppAvgC.offset} transform="rotate(-90 36 36)" strokeLinecap="round"/>
              <circle cx="36" cy="36" r="28" fill="none" stroke="#7f77dd" strokeWidth="5" strokeDasharray={avgC.c} strokeDashoffset={avgC.offset} transform="rotate(-90 36 36)" strokeLinecap="round"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#afa9ec', lineHeight: 1 }}>{stats.myAvg || '—'}</div>
              <div style={{ fontSize: 8, color: muted }}>{stats.oppAvg || '—'}</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: muted, letterSpacing: 0.5, marginTop: 4 }}>SNITT</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: avgAdv ? '#7f77dd' : '#e24b4a', marginTop: 1 }}>
            {stats.myAvg - stats.oppAvg >= 0 ? '+' : ''}{stats.myAvg - stats.oppAvg}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto' }}>
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="34" fill="none" stroke={track} strokeWidth="6"/>
              <circle cx="44" cy="44" r="34" fill="none" stroke={track2} strokeWidth="6" strokeDasharray={opp200c.c} strokeDashoffset={opp200c.offset} transform="rotate(-90 44 44)" strokeLinecap="round"/>
              <circle cx="44" cy="44" r="34" fill="none" stroke="#1d9e75" strokeWidth="6" strokeDasharray={c200.c} strokeDashoffset={c200.offset} transform="rotate(-90 44 44)" strokeLinecap="round"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: stats.my200pm >= stats.opp200pm ? '#1d9e75' : '#e24b4a', lineHeight: 1 }}>{stats.my200pm}</div>
              <div style={{ fontSize: 9, color: muted }}>{stats.opp200pm}</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: muted, letterSpacing: 0.5, marginTop: 4 }}>200+ / MATCH</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: stats.my200pm >= stats.opp200pm ? '#1d9e75' : '#e24b4a', marginTop: 1 }}>
            {stats.my200pm >= stats.opp200pm ? 'Fordel' : 'Nackdel'}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto' }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke={track} strokeWidth="5"/>
              <circle cx="36" cy="36" r="28" fill="none" stroke="#f5c200" strokeWidth="5" strokeDasharray={formC.c} strokeDashoffset={formC.offset} transform="rotate(-90 36 36)" strokeLinecap="round"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f5c200', lineHeight: 1 }}>{stats.myForm.filter((f: string) => f === 'V').length}V</div>
              <div style={{ fontSize: 8, color: '#e24b4a' }}>{stats.myForm.filter((f: string) => f === 'F').length}F</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: muted, letterSpacing: 0.5, marginTop: 4 }}>FORM</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 4 }}>
            {stats.myForm.map((f: string, i: number) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: f === 'V' ? '#1d9e75' : f === 'F' ? '#e24b4a' : muted }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid ' + (isDark ? '#1c2840' : '#d0d8e8'), paddingTop: 8 }}>
        <div style={{ fontSize: 12, color: isDark ? '#afa9ec' : '#534ab7' }}>
          <span style={{ fontWeight: 700 }}>Analys: </span>
          {avgAdv ? 'Ni har snittfordel — satsa starka par pa Bord 1 och 2' : 'Motstandaren har snittfordel — fokus pa konsistens'}
        </div>
      </div>
    </div>
  )
}

export function TeamLaguttagningPageContent({ params }: Props) {
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
  const [splitMode, setSplitMode] = useState(false)
  const [availability, setAvailability] = useState<Record<string, string>>({})
  const [availNotes, setAvailNotes] = useState<Record<string, string>>({})
  const [activeSlot, setActiveSlot] = useState<{ bord: number; position: number; isReserve: boolean } | null>(null)

  const bg = isDark ? '#0d1520' : '#f0f4f8'
  const card = isDark ? '#172030' : '#ffffff'
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
      const { data: membership } = await supabase.from('team_members').select('role,status').eq('team_id', teamId).eq('user_id', session.user.id).single()
      if (!membership || membership.status !== 'active' || !['captain','admin'].includes(membership.role)) { window.location.href = '/team/' + teamId + '/intern'; return }
      const { data: m } = await supabase.from('matches').select('*, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)').eq('id', matchId).single()
      if (m) setMatch(m)
      const { data: teamPlayers } = await supabase.from('players').select('id, name, team_id, teams:team_id(name)').eq('team_id', teamId).order('name')
      const { data: members } = await supabase.from('team_members').select('user_id').eq('team_id', teamId).eq('status', 'active')
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', (members || []).map((m: any) => m.user_id))
      const { data: results } = await supabase.from('match_results').select('player_id, games').eq('team_id', teamId)
      const playerMap: Record<string, { games: number[]; name: string; teamName: string }> = {}
      teamPlayers?.forEach((p: any) => { playerMap[p.id] = { games: [], name: p.name, teamName: shortName((p.teams as any)?.name || '') } })
      profiles?.forEach((p: any) => { if (p.full_name && !Object.values(playerMap).find(x => x.name === p.full_name)) playerMap[p.id] = { games: [], name: p.full_name, teamName: '' } })
      results?.forEach((r: any) => { if (playerMap[r.player_id]) playerMap[r.player_id].games.push(...(r.games || []).filter((g: number) => g > 0)) })
      const built: Player[] = Object.entries(playerMap).map(([id, data]) => {
        const games = data.games
        const avg = games.length > 0 ? Math.round(games.reduce((a, b) => a + b, 0) / games.length) : 180
        const seriesGroups = Array.from({ length: Math.floor(games.length / 4) }, (_, i) => games.slice(i * 4, i * 4 + 4).reduce((a, b) => a + b, 0))
        const bestSeries = seriesGroups.length > 0 ? Math.max(...seriesGroups) : games.reduce((a, b) => a + b, 0) || 680
        const over200 = games.filter(g => g >= 200).length
        const rating = calcRating(avg, bestSeries, over200, games.length > 0)
        const tier = getTier(rating)
        return { id, name: data.name, teamName: data.teamName, avg, bestSeries, over200, rating, tier: tier.label, color: tier.color, bgColor: tier.bg, borderColor: tier.border }
      }).sort((a, b) => b.rating - a.rating)
      setPlayers(built)
      const initSlots: Slot[] = []
      for (let bord = 1; bord <= 4; bord++) for (let pos = 1; pos <= 2; pos++) initSlots.push({ bord, position: pos, player: null, isReserve: false })
      initSlots.push({ bord: 0, position: 1, player: null, isReserve: true })
      initSlots.push({ bord: 0, position: 2, player: null, isReserve: true })
      const { data: lineup } = await supabase.from('lineups').select('*, lineup_slots(*)').eq('team_id', teamId).eq('match_id', matchId).single()
      if (lineup) {
        setLineupId(lineup.id)
        setPublished(lineup.status === 'published')
        setSlots(initSlots.map(slot => {
          const ex = lineup.lineup_slots?.find((s: any) => s.bord === slot.bord && s.position === slot.position && s.is_reserve === slot.isReserve)
          if (ex) { const p = built.find(x => x.id === ex.user_id || x.name === ex.player_name); return { ...slot, player: p || null } }
          return slot
        }))
      } else setSlots(initSlots)
      setLoading(false)
    }
    load()
  }, [teamId, matchId])

  const getSlot = (bord: number, pos: number, isReserve = false) => slots.find(s => s.bord === bord && s.position === pos && s.isReserve === isReserve)
  const usedIds = slots.filter(s => s.player).map(s => s.player!.id)

  const openPicker = (bord: number, position: number, isReserve: boolean) => {
    setActiveSlot({ bord, position, isReserve })
    setSplitMode(true)
  }

  const assignPlayer = (player: Player) => {
    if (!activeSlot) return
    setSlots(prev => prev.map(s => s.bord === activeSlot.bord && s.position === activeSlot.position && s.isReserve === activeSlot.isReserve ? { ...s, player } : s))
    // Auto advance to next empty slot
    const allSlots = [...slots].filter(s => !s.player)
    const currentIdx = allSlots.findIndex(s => s.bord === activeSlot.bord && s.position === activeSlot.position && s.isReserve === activeSlot.isReserve)
    const next = allSlots[currentIdx + 1]
    if (next) setActiveSlot({ bord: next.bord, position: next.position, isReserve: next.isReserve })
    else { setSplitMode(false); setActiveSlot(null) }
  }

  const clearSlot = (bord: number, pos: number, isReserve: boolean) => {
    setSlots(prev => prev.map(s => s.bord === bord && s.position === pos && s.isReserve === isReserve ? { ...s, player: null } : s))
  }

  const saveLineup = async (publish: boolean) => {
    if (!teamId || !matchId) return
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    let lid = lineupId
    if (!lid) { const { data: nl } = await supabase.from('lineups').insert({ team_id: teamId, match_id: matchId, created_by: session.user.id, status: publish ? 'published' : 'draft' }).select('id').single(); if (nl) lid = nl.id }
    else await supabase.from('lineups').update({ status: publish ? 'published' : 'draft' }).eq('id', lid)
    if (!lid) { setSaving(false); return }
    setLineupId(lid)
    await supabase.from('lineup_slots').delete().eq('lineup_id', lid)
    const toInsert = slots.filter(s => s.player).map(s => ({ lineup_id: lid, user_id: s.player!.id, player_name: s.player!.name, bord: s.bord, position: s.position, is_reserve: s.isReserve }))
    if (toInsert.length > 0) await supabase.from('lineup_slots').insert(toInsert)
    if (publish) setPublished(true)
    setSaving(false)
  }

  const sortedPlayers = [...players].sort((a, b) => {
    const avOrder: Record<string, number> = { yes: 0, maybe: 1, '': 2, no: 3 }
    const aAv = availability[a.id] || ''
    const bAv = availability[b.id] || ''
    if (avOrder[aAv] !== avOrder[bAv]) return avOrder[aAv] - avOrder[bAv]
    return b.rating - a.rating
  })

  const filledCount = slots.filter(s => s.player && !s.isReserve).length
  const teamRating = filledCount > 0 ? Math.round(slots.filter(s => s.player && !s.isReserve).reduce((a, s) => a + s.player!.rating, 0) / filledCount) : 0
  const isHome = match?.home_team_id === teamId
  const opp = isHome ? match?.away : match?.home

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center font-sans" style={{ color: muted }}>Laddar...</div>

  const SlotView = ({ bord, pos, isReserve = false, compact = false }: { bord: number; pos: number; isReserve?: boolean; compact?: boolean }) => {
    const slot = getSlot(bord, pos, isReserve)
    const p = slot?.player
    const tier = p ? getTier(p.rating) : null
    const isActive = activeSlot?.bord === bord && activeSlot?.position === pos && activeSlot?.isReserve === isReserve
    return (
      <div onClick={() => p ? clearSlot(bord, pos, isReserve) : openPicker(bord, pos, isReserve)}
        style={{ padding: compact ? '8px 10px' : '11px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minHeight: compact ? 44 : 54, background: isActive ? (isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.04)') : 'transparent', transition: 'background 0.1s', borderBottom: '1px solid ' + (isDark ? '#1c2840' : '#e8f0f8') }}
      >
        {p && tier ? (
          <>
            <div style={{ width: compact ? 26 : 32, height: compact ? 26 : 32, borderRadius: '50%', background: tier.bg, border: '2px solid ' + tier.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: compact ? 8 : 10, fontWeight: 800, color: tier.color, flexShrink: 0 }}>
              {initials(p.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name.split(' ')[0]}</div>
              <div style={{ fontSize: 9, color: tier.color, fontWeight: 600 }}>{tier.label}</div>
            </div>
          </>
        ) : (
          <>
            <div style={{ width: compact ? 22 : 26, height: compact ? 22 : 26, borderRadius: '50%', border: '1.5px dashed ' + (isActive ? accent : border), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16, color: isActive ? accent : muted, lineHeight: 1 }}>+</span>
            </div>
            <div style={{ fontSize: compact ? 10 : 11, color: isActive ? accent : muted, fontWeight: isActive ? 600 : 400 }}>
              {isReserve ? 'Reserv' : 'Position ' + pos}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ color: text, fontFamily: 'system-ui, sans-serif', paddingBottom: splitMode ? 0 : 80 }}>

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
              {match?.date ? new Date(match.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }) : ''} · {isHome ? 'Hemma' : 'Borta'}
            </div>
          </div>
          {teamRating > 0 && (
            <div style={{ textAlign: 'center', background: card, borderRadius: 12, border: '1px solid ' + border, padding: '8px 14px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{teamRating}</div>
              <div style={{ fontSize: 9, color: muted, letterSpacing: 1 }}>LAGRATING</div>
            </div>
          )}
        </div>
        {published && <div style={{ marginTop: 8, display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#5dcaa5', background: 'rgba(29,158,117,0.15)', borderRadius: 6, padding: '3px 10px' }}>Publicerad</div>}
        <MatchupDials teamId={teamId!} oppId={isHome ? match?.away_team_id : match?.home_team_id} isDark={isDark} muted={muted} />
      </div>

      {/* Availability strip */}
      {Object.keys(availability).length > 0 && (
        <div style={{ padding: '10px 20px', borderBottom: '1px solid ' + border, background: isDark ? '#0d1a2e' : '#e8f0f8' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: muted, letterSpacing: 1.5, marginBottom: 8 }}>TILLGANGLIGHET</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            {sortedPlayers.map(p => {
              const av = availability[p.id]
              if (!av) return null
              const tier = getTier(p.rating)
              const avColor = av === 'yes' ? '#1d9e75' : av === 'maybe' ? '#f5c200' : '#e24b4a'
              const avEmoji = av === 'yes' ? '✅' : av === 'maybe' ? '🤔' : '❌'
              const note = availNotes[p.id]
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: avColor + '15', border: '1px solid ' + avColor + '44', borderRadius: 20, padding: '4px 10px 4px 6px' }}
                  title={note || ''}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: tier.bg, border: '1.5px solid ' + tier.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: tier.color, flexShrink: 0 }}>
                    {initials(p.name)}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: text }}>{p.name.split(' ')[0]}</span>
                  <span style={{ fontSize: 12 }}>{avEmoji}</span>
                  {note && <span style={{ fontSize: 10, color: muted, fontStyle: 'italic' }}>"{note}"</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!splitMode ? (
        /* NORMAL VIEW */
        <div style={{ padding: '14px 20px' }}>
          {[1, 2, 3, 4].map(bord => {
            const bordSlots = slots.filter(s => s.bord === bord && !s.isReserve)
            const bordRating = bordSlots.filter(s => s.player).length === 2
              ? Math.round(bordSlots.reduce((a, s) => a + (s.player?.rating || 0), 0) / 2) : 0
            return (
              <div key={bord} style={{ background: card, borderRadius: 14, border: '1px solid ' + border, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ padding: '7px 14px', background: isDark ? 'rgba(245,194,0,0.05)' : 'rgba(245,194,0,0.06)', borderBottom: '1px solid ' + border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: 1.5 }}>BORD {bord}</span>
                  {bordRating > 0 && <span style={{ fontSize: 10, color: '#1d9e75', fontWeight: 600 }}>★ {bordRating}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{ borderRight: '1px solid ' + border }}><SlotView bord={bord} pos={1} /></div>
                  <div><SlotView bord={bord} pos={2} /></div>
                </div>
              </div>
            )
          })}

          {/* Reserves */}
          <div style={{ background: card, borderRadius: 14, border: '1px solid ' + border, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '7px 14px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderBottom: '1px solid ' + border }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: muted, letterSpacing: 1.5 }}>RESERVER</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ borderRight: '1px solid ' + border }}><SlotView bord={0} pos={1} isReserve /></div>
              <div><SlotView bord={0} pos={2} isReserve /></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
            <button onClick={() => saveLineup(false)} disabled={saving} style={{ background: 'transparent', border: '1px solid ' + border, borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, color: muted, cursor: 'pointer' }}>
              Utkast
            </button>
            <button onClick={() => saveLineup(true)} disabled={saving} style={{ background: accent, border: 'none', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, color: '#1a1400', cursor: 'pointer' }}>
              {saving ? 'Publicerar...' : published ? 'Uppdatera' : 'Publicera till laget'}
            </button>
          </div>
        </div>
      ) : (
        /* SPLIT VIEW */
        <div style={{ display: 'flex', height: 'calc(100vh - 280px)', minHeight: 400 }}>

          {/* Left — bords stacked */}
          <div style={{ width: '45%', overflowY: 'auto', borderRight: '1px solid ' + border, background: bg }}>
            <div style={{ padding: '8px 10px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: muted, letterSpacing: 1 }}>BORD</div>
              <button onClick={() => { setSplitMode(false); setActiveSlot(null) }}
                style={{ background: accent, border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#1a1400', cursor: 'pointer' }}>
                Klar ✓
              </button>
            </div>
            {[1, 2, 3, 4].map(bord => (
              <div key={bord} style={{ margin: '4px 8px', background: card, borderRadius: 10, border: '1px solid ' + (activeSlot?.bord === bord ? accent : border), overflow: 'hidden' }}>
                <div style={{ padding: '5px 10px', background: isDark ? 'rgba(245,194,0,0.05)' : 'rgba(245,194,0,0.04)', borderBottom: '1px solid ' + border, fontSize: 9, fontWeight: 800, color: accent, letterSpacing: 1 }}>
                  BORD {bord}
                </div>
                <SlotView bord={bord} pos={1} compact />
                <SlotView bord={bord} pos={2} compact />
              </div>
            ))}
            <div style={{ margin: '4px 8px 8px', background: card, borderRadius: 10, border: '1px solid ' + border, overflow: 'hidden' }}>
              <div style={{ padding: '5px 10px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderBottom: '1px solid ' + border, fontSize: 9, fontWeight: 800, color: muted, letterSpacing: 1 }}>
                RESERVER
              </div>
              <SlotView bord={0} pos={1} isReserve compact />
              <SlotView bord={0} pos={2} isReserve compact />
            </div>
          </div>

          {/* Right — player cards 2 columns */}
          <div style={{ flex: 1, overflowY: 'auto', background: isDark ? '#141e2e' : '#f8fafc', padding: '8px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: muted, letterSpacing: 1, marginBottom: 8, paddingLeft: 2 }}>
              {activeSlot ? `BORD ${activeSlot.bord || 'R'} · POS ${activeSlot.position}` : 'VALJ SPELARE'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {sortedPlayers.map(p => {
                const tier = getTier(p.rating)
                const isUsed = usedIds.includes(p.id)
                const st = stars(p.rating)
                return (
                  <div key={p.id} onClick={() => !isUsed && assignPlayer(p)}
                    style={{ background: tier.cardBg, border: '1.5px solid ' + (isUsed ? border : tier.border), borderRadius: 14, overflow: 'hidden', cursor: isUsed ? 'default' : 'pointer', opacity: isUsed ? 0.35 : 1, transition: 'transform 0.12s', position: 'relative' as const }}
                    onMouseEnter={e => { if (!isUsed) (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)' }}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                  >
                    {/* Card header */}
                    <div style={{ padding: '10px 8px 6px', textAlign: 'center', background: tier.bg, borderBottom: '1px solid ' + tier.border + '44', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, fontWeight: 700, color: tier.color, background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', padding: '2px 5px', borderRadius: 6 }}>
                        {tier.label}
                      </div>
                      {availability[p.id] && (
                        <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 12 }}>
                          {availability[p.id] === 'yes' ? '✅' : availability[p.id] === 'maybe' ? '🤔' : '❌'}
                        </div>
                      )}
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)', border: '2px solid ' + tier.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: tier.color, margin: '0 auto 6px' }}>
                        {initials(p.name)}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{p.name.split(' ')[0]}</div>
                      <div style={{ fontSize: 10, color: muted }}>{p.name.split(' ').slice(1).join(' ')}</div>
                      {p.teamName && <div style={{ fontSize: 9, color: muted, marginTop: 1 }}>{p.teamName}</div>}
                    </div>
                    {/* Stats */}
                    <div style={{ padding: '8px 6px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
                      {[
                        { label: 'SNITT', value: p.avg },
                        { label: 'BASTA', value: p.bestSeries || '—' },
                        { label: '200+', value: p.over200 },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderRadius: 6, padding: '4px 2px' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: tier.color, lineHeight: 1 }}>{s.value}</div>
                          <div style={{ fontSize: 7, color: muted, marginTop: 1, letterSpacing: 0.5 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Stars + rating */}
                    <div style={{ padding: '4px 8px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, letterSpacing: 1 }}>
                        <span style={{ color: '#f5c200' }}>{'★'.repeat(st.filled)}</span>
                        <span style={{ color: isDark ? '#2a3858' : '#d0d8e8' }}>{'★'.repeat(st.empty)}</span>
                      </div>
                      <div style={{ fontSize: 8, color: muted, letterSpacing: 1, marginTop: 2 }}>SPELSTYRKA {p.rating}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
