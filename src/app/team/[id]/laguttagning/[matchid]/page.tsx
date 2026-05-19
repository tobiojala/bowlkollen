'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Props = { params: Promise<{ id: string; matchid: string }> }

type Slot = {
  bord: number
  position: number
  playerId: string | null
  playerName: string
  isReserve: boolean
}

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

export default function LaguttagningPage({ params }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [teamId, setTeamId] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [match, setMatch] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [profiles, setProfiles] = useState<Record<string, any>>({})
  const [slots, setSlots] = useState<Slot[]>([])
  const [reserves, setReserves] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [published, setPublished] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ bord: number; position: number; isReserve: boolean } | null>(null)
  const [lineupId, setLineupId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => { setTeamId(p.id); setMatchId(p.matchid) })
  }, [params])

  useEffect(() => {
    if (!teamId || !matchId) return
    const supabase = createClient()

    const load = async () => {
      // Check auth
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      // Check captain
      const { data: membership } = await supabase
        .from('team_members')
        .select('role, status')
        .eq('team_id', teamId)
        .eq('user_id', session.user.id)
        .single()

      if (!membership || membership.status !== 'active' || !['captain', 'admin'].includes(membership.role)) {
        window.location.href = '/team/' + teamId + '/intern'
        return
      }

      // Load match
      const { data: m } = await supabase
        .from('matches')
        .select('*, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
        .eq('id', matchId)
        .single()
      if (m) setMatch(m)

      // Load team members
      const { data: tm } = await supabase
        .from('team_members')
        .select('user_id, role')
        .eq('team_id', teamId)
        .eq('status', 'active')

      // Load player profiles
      if (tm && tm.length > 0) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', tm.map((x: any) => x.user_id))
        if (prof) {
          const map: Record<string, any> = {}
          prof.forEach((p: any) => { map[p.id] = p })
          setProfiles(map)
        }
        setMembers(tm)
      }

      // Load players linked to team
      const { data: pl } = await supabase
        .from('players')
        .select('id, name')
        .eq('team_id', teamId)
        .order('name')
      if (pl) setPlayers(pl)

      // Load existing lineup
      const { data: lineup } = await supabase
        .from('lineups')
        .select('*, lineup_slots(*)')
        .eq('team_id', teamId)
        .eq('match_id', matchId)
        .single()

      if (lineup) {
        setLineupId(lineup.id)
        setPublished(lineup.status === 'published')
        const existingSlots: Slot[] = []
        const existingReserves: Slot[] = []
        lineup.lineup_slots?.forEach((s: any) => {
          const slot: Slot = {
            bord: s.bord,
            position: s.position,
            playerId: s.user_id,
            playerName: s.player_name || '',
            isReserve: s.is_reserve
          }
          if (s.is_reserve) existingReserves.push(slot)
          else existingSlots.push(slot)
        })
        if (existingSlots.length > 0) setSlots(existingSlots)
        if (existingReserves.length > 0) setReserves(existingReserves)
      }

      // Init empty slots if none
      if (!lineup) {
        const initSlots: Slot[] = []
        for (let bord = 1; bord <= 4; bord++) {
          for (let pos = 1; pos <= 2; pos++) {
            initSlots.push({ bord, position: pos, playerId: null, playerName: '', isReserve: false })
          }
        }
        setSlots(initSlots)
        setReserves([
          { bord: 0, position: 1, playerId: null, playerName: '', isReserve: true },
          { bord: 0, position: 2, playerId: null, playerName: '', isReserve: true },
        ])
      }

      setLoading(false)
    }

    load()
  }, [teamId, matchId])

  const getSlot = (bord: number, pos: number) =>
    slots.find(s => s.bord === bord && s.position === pos)

  const assignPlayer = (bord: number, pos: number, isReserve: boolean, userId: string, name: string) => {
    if (isReserve) {
      setReserves(prev => prev.map((s, i) =>
        i === pos - 1 ? { ...s, playerId: userId, playerName: name } : s
      ))
    } else {
      setSlots(prev => prev.map(s =>
        s.bord === bord && s.position === pos
          ? { ...s, playerId: userId, playerName: name }
          : s
      ))
    }
    setSelectedSlot(null)
  }

  const clearSlot = (bord: number, pos: number, isReserve: boolean) => {
    if (isReserve) {
      setReserves(prev => prev.map((s, i) =>
        i === pos - 1 ? { ...s, playerId: null, playerName: '' } : s
      ))
    } else {
      setSlots(prev => prev.map(s =>
        s.bord === bord && s.position === pos
          ? { ...s, playerId: null, playerName: '' }
          : s
      ))
    }
  }

  const saveLineup = async (publish: boolean) => {
    if (!teamId || !matchId) return
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let lid = lineupId
    if (!lid) {
      const { data: newLineup } = await supabase
        .from('lineups')
        .insert({ team_id: teamId, match_id: matchId, created_by: session.user.id, status: publish ? 'published' : 'draft' })
        .select('id').single()
      if (newLineup) lid = newLineup.id
    } else {
      await supabase.from('lineups').update({ status: publish ? 'published' : 'draft' }).eq('id', lid)
    }

    if (!lid) { setSaving(false); return }
    setLineupId(lid)

    // Delete existing slots
    await supabase.from('lineup_slots').delete().eq('lineup_id', lid)

    // Insert all slots
    const allSlots = [
      ...slots.filter(s => s.playerId || s.playerName),
      ...reserves.filter(s => s.playerId || s.playerName),
    ].map(s => ({
      lineup_id: lid,
      user_id: s.playerId,
      player_name: s.playerName,
      bord: s.bord,
      position: s.position,
      is_reserve: s.isReserve,
    }))

    if (allSlots.length > 0) {
      await supabase.from('lineup_slots').insert(allSlots)
    }

    if (publish) setPublished(true)
    setSaving(false)
  }

  // Get all available players (members + squad players)
  const availablePlayers = [
    ...members.map((m: any) => ({
      id: m.user_id,
      name: profiles[m.user_id]?.full_name || profiles[m.user_id]?.email || 'Okand',
      type: 'member'
    })),
    ...players
      .filter(p => !members.some((m: any) => profiles[m.user_id]?.full_name === p.name))
      .map(p => ({ id: p.id, name: p.name, type: 'player' }))
  ]

  const usedIds = [...slots, ...reserves].filter(s => s.playerId).map(s => s.playerId)

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )

  const isHome = match?.home_team_id === teamId
  const opp = isHome ? match?.away : match?.home
  const matchDate = match ? new Date(match.date) : null

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 80px' }}>

        {/* Header */}
        <div style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #0d1a2e 0%, #1a2840 100%)' : 'linear-gradient(135deg, #e8f0f8 0%, #d0e0f0 100%)', padding: '20px 20px 16px' }}>
          <a href={'/team/' + teamId + '/intern'} style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            ← Lagets sida
          </a>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 4 }}>Laguttagning</div>
          <div style={{ fontSize: 14, color: C.textMuted }}>
            vs {shortName(opp?.name || '')} · {matchDate?.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          {published && (
            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: C.green, background: C.green + '18', borderRadius: 6, padding: '3px 10px', display: 'inline-block' }}>
              Publicerad
            </div>
          )}
        </div>

        {/* Bord grid */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2, marginBottom: 12 }}>SPELARNA</div>

          {[1, 2, 3, 4].map(bord => (
            <div key={bord} style={{ marginBottom: 12, background: C.card, borderRadius: 12, border: '1px solid ' + C.border, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: theme === 'dark' ? '#0d1a2e' : '#e8f0f8', borderBottom: '1px solid ' + C.border }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.accent }}>BORD {bord}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {[1, 2].map(pos => {
                  const slot = getSlot(bord, pos)
                  const isSelected = selectedSlot?.bord === bord && selectedSlot?.position === pos && !selectedSlot?.isReserve
                  return (
                    <div key={pos}
                      style={{ padding: '12px 14px', borderRight: pos === 1 ? '1px solid ' + C.border : 'none', cursor: 'pointer', background: isSelected ? C.accent + '11' : 'transparent' }}
                      onClick={() => {
                        if (slot?.playerId) {
                          clearSlot(bord, pos, false)
                        } else {
                          setSelectedSlot({ bord, position: pos, isReserve: false })
                        }
                      }}
                    >
                      {slot?.playerId || slot?.playerName ? (
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{slot.playerName}</div>
                          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Pos {pos} · tryck for att ta bort</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 13, color: isSelected ? C.accent : C.textMuted, fontWeight: isSelected ? 700 : 400 }}>
                            {isSelected ? 'Valj spelare nedan...' : '+ Lagg till'}
                          </div>
                          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Position {pos}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Reserves */}
          <div style={{ marginBottom: 16, background: C.card, borderRadius: 12, border: '1px solid ' + C.border, overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: theme === 'dark' ? '#0d1a2e' : '#e8f0f8', borderBottom: '1px solid ' + C.border }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.textMuted }}>RESERVER</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {reserves.map((reserve, i) => {
                const isSelected = selectedSlot?.isReserve && selectedSlot?.position === i + 1
                return (
                  <div key={i}
                    style={{ padding: '12px 14px', borderRight: i === 0 ? '1px solid ' + C.border : 'none', cursor: 'pointer', background: isSelected ? C.accent + '11' : 'transparent' }}
                    onClick={() => {
                      if (reserve.playerId) clearSlot(0, i + 1, true)
                      else setSelectedSlot({ bord: 0, position: i + 1, isReserve: true })
                    }}
                  >
                    {reserve.playerId || reserve.playerName ? (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{reserve.playerName}</div>
                        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Reserv · tryck for att ta bort</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 13, color: isSelected ? C.accent : C.textMuted, fontWeight: isSelected ? 700 : 400 }}>
                          {isSelected ? 'Valj spelare nedan...' : '+ Reserv'}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Player picker */}
          {selectedSlot && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2, marginBottom: 8 }}>
                VALJ SPELARE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {availablePlayers.map(p => {
                  const isUsed = usedIds.includes(p.id)
                  const hue = p.name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
                  const tc = 'hsl(' + hue + ',50%,45%)'
                  const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
                  return (
                    <button key={p.id}
                      disabled={isUsed}
                      onClick={() => assignPlayer(selectedSlot.bord, selectedSlot.position, selectedSlot.isReserve, p.id, p.name)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isUsed ? C.surface : C.card, border: '1px solid ' + C.border, borderRadius: 10, cursor: isUsed ? 'default' : 'pointer', opacity: isUsed ? 0.4 : 1, textAlign: 'left' as const }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: tc, flexShrink: 0 }}>
                        {p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>{isUsed ? 'Redan vald' : p.type === 'member' ? 'Lagmedlem' : 'Trupp'}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setSelectedSlot(null)}
                style={{ marginTop: 8, background: 'transparent', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', padding: 0 }}>
                Avbryt
              </button>
            </div>
          )}
        </div>

        {/* Save buttons - sticky at bottom */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.bg, borderTop: '1px solid ' + C.border, padding: '12px 20px', display: 'flex', gap: 8, maxWidth: 600, margin: '0 auto' }}>
          <button onClick={() => saveLineup(false)} disabled={saving}
            style={{ flex: 1, background: 'transparent', border: '1px solid ' + C.border, borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, color: C.textMuted, cursor: 'pointer' }}>
            {saving ? 'Sparar...' : 'Spara utkast'}
          </button>
          <button onClick={() => saveLineup(true)} disabled={saving}
            style={{ flex: 2, background: C.accent, border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, color: '#1a1400', cursor: 'pointer' }}>
            {saving ? 'Publicerar...' : published ? 'Uppdatera & publicera' : 'Publicera till laget'}
          </button>
        </div>

      </div>
    </main>
  )
}
