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

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

function calcRating(avg: number, best: number, over200: number): number {
  return Math.min(99, Math.round(avg * 0.5 + (best / 10) * 0.3 + over200 * 2))
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
        const rating = calcRating(avg, bestSeries, over200)
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
            <div style={{ overflowY: 'auto', padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {players.map(p => {
                const tier = getTier(p.rating)
                const isUsed = usedIds.includes(p.id)
                return (
                  <div key={p.id}
                    onClick={() => !isUsed && assignPlayer(p)}
                    style={{ background: isUsed ? (isDark ? '#1c2840' : '#f8fafc') : card2, border: '1px solid ' + (isUsed ? border : tier.border), borderRadius: 14, padding: '12px 14px', cursor: isUsed ? 'default' : 'pointer', opacity: isUsed ? 0.45 : 1, display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    {/* Mini TCG card feel */}
                    <div style={{ width: 44, height: 56, borderRadius: 10, background: tier.bg, border: '1.5px solid ' + tier.border, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: tier.color }}>{initials(p.name)}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: tier.color, opacity: 0.8 }}>{tier.label}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 11, color: muted }}>Snitt <span style={{ color: tier.color, fontWeight: 700 }}>{p.avg}</span></span>
                        <span style={{ fontSize: 11, color: muted }}>200+ <span style={{ color: tier.color, fontWeight: 700 }}>{p.over200}</span></span>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 10, color: tier.color, letterSpacing: 0.5 }}>
                        {'★'.repeat(Math.round(p.rating / 20))}{'☆'.repeat(5 - Math.round(p.rating / 20))}
                        <span style={{ color: muted, marginLeft: 6 }}>{p.rating} rating</span>
                      </div>
                    </div>
                    {!isUsed && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 18, color: '#1a1400', fontWeight: 800, lineHeight: 1 }}>+</span>
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
