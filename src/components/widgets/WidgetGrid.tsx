'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, X, Check } from 'lucide-react'
import { useWidgetData } from './useWidgetData'
import {
  NextMatchWidget, LastResultWidget, StandingsWidget, MyStatsWidget,
  AvailabilityWidget, TeamFeedWidget, UpcomingWidget, RecentResultsWidget,
  FavTeamsWidget, WIDGET_REGISTRY
} from './Widgets'

type Zone = { id: string; size: 'wide' | 'small'; widgetId: string | null }

const DEFAULT_LAYOUT: Zone[] = [
  { id: 'z1', size: 'wide', widgetId: 'next_match' },
  { id: 'z2', size: 'small', widgetId: 'standings' },
  { id: 'z3', size: 'small', widgetId: 'my_stats' },
  { id: 'z4', size: 'wide', widgetId: 'availability' },
  { id: 'z5', size: 'small', widgetId: 'last_result' },
  { id: 'z6', size: 'small', widgetId: 'team_feed' },
  { id: 'z7', size: 'wide', widgetId: 'recent_results' },
]

const GUEST_LAYOUT: Zone[] = [
  { id: 'z1', size: 'wide', widgetId: 'recent_results' },
  { id: 'z2', size: 'small', widgetId: 'standings' },
  { id: 'z3', size: 'small', widgetId: 'upcoming' },
  { id: 'z4', size: 'wide', widgetId: 'fav_teams' },
]

function smartLayout(data: any): Zone[] {
  const zones: Zone[] = []
  if (data.myTeam && data.myNextMatch) zones.push({ id: 'z1', size: 'wide', widgetId: 'next_match' })
  else zones.push({ id: 'z1', size: 'wide', widgetId: 'recent_results' })
  if (data.availabilityMatch && !data.availabilityStatus) zones.push({ id: 'z_av', size: 'wide', widgetId: 'availability' })
  zones.push({ id: 'z2', size: 'small', widgetId: 'standings' })
  zones.push({ id: 'z3', size: 'small', widgetId: data.myStats ? 'my_stats' : 'upcoming' })
  if (data.myTeam) zones.push({ id: 'z4', size: 'small', widgetId: 'last_result' })
  if (data.myTeam && data.teamPosts.length > 0) zones.push({ id: 'z5', size: 'small', widgetId: 'team_feed' })
  if (data.favTeams.length > 0) zones.push({ id: 'z6', size: 'wide', widgetId: 'fav_teams' })
  if (!zones.find(z => z.widgetId === 'recent_results')) zones.push({ id: 'z7', size: 'wide', widgetId: 'recent_results' })
  return zones.map((z, i) => ({ ...z, id: 'z' + i }))
}

export default function WidgetGrid({ isDark, C }: { isDark: boolean; C: any }) {
  const data = useWidgetData()
  const [editing, setEditing] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [pickerZone, setPickerZone] = useState<string | null>(null)
  const [savedLayout, setSavedLayout] = useState(false)

  useEffect(() => {
    if (data.loading) return
    // Load saved layout from localStorage
    const saved = localStorage.getItem('bowlkollen_layout')
    if (saved) {
      try { setZones(JSON.parse(saved)); setSavedLayout(true); return }
      catch {}
    }
    // Use smart layout based on user data
    setZones(data.user ? smartLayout(data) : GUEST_LAYOUT)
  }, [data.loading, data.user])

  const saveLayout = (newZones: Zone[]) => {
    setZones(newZones)
    localStorage.setItem('bowlkollen_layout', JSON.stringify(newZones))
  }

  const respondToAvailability = async (response: string) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !data.availabilityMatch || !data.myTeam) return
    let pollId = null
    const { data: poll } = await supabase.from('availability_polls').select('id').eq('team_id', data.myTeam.id).eq('match_id', data.availabilityMatch.id).single()
    if (poll) pollId = poll.id
    else {
      const { data: newPoll } = await supabase.from('availability_polls').insert({ team_id: data.myTeam.id, match_id: data.availabilityMatch.id, created_by: session.user.id, question: 'Kan du spela?' }).select('id').single()
      if (newPoll) pollId = newPoll.id
    }
    if (pollId) await supabase.from('availability_responses').upsert({ poll_id: pollId, user_id: session.user.id, response })
    window.location.href = '/team/' + data.myTeam.id + '/tillganglighet/' + data.availabilityMatch.id
  }

  const renderWidget = (widgetId: string | null) => {
    if (!widgetId) return null
    const props = { isDark, C, data }
    switch (widgetId) {
      case 'next_match': return <NextMatchWidget {...props} />
      case 'last_result': return <LastResultWidget {...props} />
      case 'standings': return <StandingsWidget {...props} />
      case 'my_stats': return <MyStatsWidget {...props} />
      case 'availability': return <AvailabilityWidget {...props} onRespond={respondToAvailability} />
      case 'team_feed': return <TeamFeedWidget {...props} />
      case 'upcoming': return <UpcomingWidget {...props} />
      case 'recent_results': return <RecentResultsWidget {...props} />
      case 'fav_teams': return <FavTeamsWidget {...props} />
      default: return null
    }
  }

  if (data.loading) return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>Laddar...</div>
  )

  return (
    <div>
      {/* Edit bar */}
      <div style={{ padding: '8px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
          {data.user ? `Hej${data.user.user_metadata?.full_name ? ', ' + data.user.user_metadata.full_name.split(' ')[0] : ''}` : 'Bowlkollen'}
        </div>
        <button onClick={() => { setEditing(e => !e); setPickerZone(null) }}
          style={{ fontSize: 11, fontWeight: 600, color: editing ? '#f5c200' : C.textMuted, background: editing ? 'rgba(245,194,0,0.1)' : 'transparent', border: editing ? '1px solid rgba(245,194,0,0.25)' : '1px solid transparent', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>
          {editing ? 'Klar' : 'Anpassa'}
        </button>
      </div>

      {/* Widget grid */}
      <div style={{ padding: '4px 12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {zones.map(zone => (
          <div key={zone.id} style={{ gridColumn: zone.size === 'wide' ? 'span 2' : 'span 1', position: 'relative', minHeight: zone.size === 'wide' ? 120 : 150 }}>
            {editing && (
              <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', gap: 4 }}>
                <button onClick={() => setPickerZone(zone.id)}
                  style={{ width: 24, height: 24, borderRadius: '50%', background: '#f5c200', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Plus size={14} color="#1a1400" />
                </button>
                <button onClick={() => saveLayout(zones.filter(z => z.id !== zone.id))}
                  style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(226,75,74,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={14} color="#fff" />
                </button>
              </div>
            )}
            <div style={{ height: '100%', opacity: editing ? 0.85 : 1, transition: 'opacity 0.2s', outline: editing ? `2px dashed ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}` : 'none', borderRadius: 20 }}>
              {renderWidget(zone.widgetId)}
            </div>
          </div>
        ))}

        {/* Add zone button in edit mode */}
        {editing && (
          <div style={{ gridColumn: 'span 2' }}>
            <button onClick={() => { const newZone: Zone = { id: 'z' + Date.now(), size: 'wide', widgetId: null }; setZones(z => [...z, newZone]); setPickerZone(newZone.id) }}
              style={{ width: '100%', height: 72, background: 'transparent', border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: C.textMuted, fontSize: 13, fontWeight: 600 }}>
              <Plus size={18} />
              Lägg till widget
            </button>
          </div>
        )}
      </div>

      {/* Widget picker sheet */}
      {pickerZone && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setPickerZone(null)} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: isDark ? '#172030' : '#fff', borderRadius: '20px 20px 0 0', border: `1px solid ${isDark ? '#2a3858' : '#e0e0e0'}`, maxHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 20px 10px', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, background: isDark ? '#2a3858' : '#e0e0e0', borderRadius: 2, margin: '0 auto 14px' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5, marginBottom: 4 }}>VÄLJ WIDGET</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                Välj även storlek:
                <button onClick={() => {
                  const z = zones.find(z => z.id === pickerZone)
                  if (z) saveLayout(zones.map(x => x.id === pickerZone ? { ...x, size: x.size === 'wide' ? 'small' : 'wide' } : x))
                }} style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#f5c200', background: 'rgba(245,194,0,0.1)', border: '1px solid rgba(245,194,0,0.25)', borderRadius: 10, padding: '2px 10px', cursor: 'pointer' }}>
                  {zones.find(z => z.id === pickerZone)?.size === 'wide' ? 'Bred → Liten' : 'Liten → Bred'}
                </button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', padding: '0 14px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {WIDGET_REGISTRY.map(w => {
                const isSelected = zones.find(z => z.id === pickerZone)?.widgetId === w.id
                const unavailable = (w.requiresTeam && !data.myTeam) || (w.requiresPlayer && !data.myPlayer)
                return (
                  <button key={w.id}
                    onClick={() => {
                      if (unavailable) return
                      saveLayout(zones.map(z => z.id === pickerZone ? { ...z, widgetId: w.id } : z))
                      setPickerZone(null)
                    }}
                    style={{ background: isSelected ? 'rgba(245,194,0,0.1)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isSelected ? 'rgba(245,194,0,0.4)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 14, padding: '12px', cursor: unavailable ? 'default' : 'pointer', textAlign: 'left', opacity: unavailable ? 0.4 : 1 }}>
                    <w.icon size={18} color={isSelected ? '#f5c200' : C.textMuted} style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>{w.label}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{unavailable ? (w.requiresTeam ? 'Kräver lag' : 'Kräver profil') : w.desc}</div>
                    {isSelected && <div style={{ marginTop: 6 }}><Check size={12} color="#f5c200" /></div>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
