'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import { Plus, X, Check } from 'lucide-react'
import { useWidgetData } from './useWidgetData'
import {
  NextMatchWidget,
  LastResultWidget,
  StandingsWidget,
  MyStatsWidget,
  AvailabilityWidget,
  TeamFeedWidget,
  UpcomingWidget,
  RecentResultsWidget,
  FavTeamsWidget,
  WIDGET_REGISTRY,
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

function smartLayout(data: {
  myTeam?: unknown
  myNextMatch?: unknown
  availabilityMatch?: unknown
  availabilityStatus?: unknown
  myStats?: unknown
  teamPosts: unknown[]
  favTeams: unknown[]
}): Zone[] {
  const zones: Zone[] = []
  if (data.myTeam && data.myNextMatch) zones.push({ id: 'z1', size: 'wide', widgetId: 'next_match' })
  else zones.push({ id: 'z1', size: 'wide', widgetId: 'recent_results' })
  if (data.availabilityMatch && !data.availabilityStatus) {
    zones.push({ id: 'z_av', size: 'wide', widgetId: 'availability' })
  }
  zones.push({ id: 'z2', size: 'small', widgetId: 'standings' })
  zones.push({ id: 'z3', size: 'small', widgetId: data.myStats ? 'my_stats' : 'upcoming' })
  if (data.myTeam) zones.push({ id: 'z4', size: 'small', widgetId: 'last_result' })
  if (data.myTeam && data.teamPosts.length > 0) zones.push({ id: 'z5', size: 'small', widgetId: 'team_feed' })
  if (data.favTeams.length > 0) zones.push({ id: 'z6', size: 'wide', widgetId: 'fav_teams' })
  if (!zones.find(z => z.widgetId === 'recent_results')) {
    zones.push({ id: 'z7', size: 'wide', widgetId: 'recent_results' })
  }
  return zones.map((z, i) => ({ ...z, id: 'z' + i }))
}

export default function WidgetGrid() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const data = useWidgetData()
  const [editing, setEditing] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [pickerZone, setPickerZone] = useState<string | null>(null)

  useEffect(() => {
    if (data.loading) return
    const saved = localStorage.getItem('bowlkollen_layout')
    if (saved) {
      try {
        setZones(JSON.parse(saved))
        return
      } catch {
        /* use smart layout */
      }
    }
    setZones(data.user ? smartLayout(data) : GUEST_LAYOUT)
  }, [data.loading, data.user])

  const saveLayout = (newZones: Zone[]) => {
    setZones(newZones)
    localStorage.setItem('bowlkollen_layout', JSON.stringify(newZones))
  }

  const respondToAvailability = async (response: string) => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session || !data.availabilityMatch || !data.myTeam) return
    let pollId = null
    const { data: poll } = await supabase
      .from('availability_polls')
      .select('id')
      .eq('team_id', data.myTeam.id)
      .eq('match_id', data.availabilityMatch.id)
      .single()
    if (poll) pollId = poll.id
    else {
      const { data: newPoll } = await supabase
        .from('availability_polls')
        .insert({
          team_id: data.myTeam.id,
          match_id: data.availabilityMatch.id,
          created_by: session.user.id,
          question: 'Kan du spela?',
        })
        .select('id')
        .single()
      if (newPoll) pollId = newPoll.id
    }
    if (pollId) {
      await supabase
        .from('availability_responses')
        .upsert({ poll_id: pollId, user_id: session.user.id, response })
    }
    window.location.href = '/team/' + data.myTeam.id + '/tillganglighet/' + data.availabilityMatch.id
  }

  const renderWidget = (widgetId: string | null) => {
    if (!widgetId) return null
    const props = { isDark, data }
    switch (widgetId) {
      case 'next_match':
        return <NextMatchWidget {...props} />
      case 'last_result':
        return <LastResultWidget {...props} />
      case 'standings':
        return <StandingsWidget {...props} />
      case 'my_stats':
        return <MyStatsWidget {...props} />
      case 'availability':
        return <AvailabilityWidget {...props} onRespond={respondToAvailability} />
      case 'team_feed':
        return <TeamFeedWidget {...props} />
      case 'upcoming':
        return <UpcomingWidget {...props} />
      case 'recent_results':
        return <RecentResultsWidget {...props} />
      case 'fav_teams':
        return <FavTeamsWidget {...props} />
      default:
        return null
    }
  }

  const firstName = data.user?.user_metadata?.full_name?.split(' ')[0]
  const greeting = data.user ? `Hej${firstName ? ', ' + firstName : ''}` : 'Bowlkollen'
  const picker = zones.find(z => z.id === pickerZone)

  if (data.loading) {
    return <div className="py-10 text-center text-[13px] text-dark-muted">Laddar...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <div className="text-[13px] font-bold bk-text-primary">{greeting}</div>
        <button
          type="button"
          onClick={() => {
            setEditing(e => !e)
            setPickerZone(null)
          }}
          className={cn(
            'cursor-pointer rounded-full border px-3 py-1 text-[11px] font-semibold',
            '[-webkit-tap-highlight-color:transparent]',
            editing
              ? 'border-gold/25 bg-gold/10 text-gold'
              : 'border-transparent bg-transparent text-dark-muted',
          )}
        >
          {editing ? 'Klar' : 'Anpassa'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-3 pt-1 pb-4">
        {zones.map(zone => (
          <div
            key={zone.id}
            className={cn(
              'relative',
              zone.size === 'wide' ? 'col-span-2 min-h-[120px]' : 'col-span-1 min-h-[150px]',
            )}
          >
            {editing && (
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                <button
                  type="button"
                  onClick={() => setPickerZone(zone.id)}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-0 bg-gold [-webkit-tap-highlight-color:transparent]"
                >
                  <Plus size={14} className="text-[#1a1400]" />
                </button>
                <button
                  type="button"
                  onClick={() => saveLayout(zones.filter(z => z.id !== zone.id))}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-0 bg-[rgba(226,75,74,0.9)] [-webkit-tap-highlight-color:transparent]"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            )}
            <div
              className={cn(
                'h-full rounded-[20px] transition-opacity duration-200',
                editing && 'opacity-85 outline-2 outline-dashed',
                editing
                  ? isDark
                    ? 'outline-white/12'
                    : 'outline-black/8'
                  : 'outline-transparent',
              )}
            >
              {renderWidget(zone.widgetId)}
            </div>
          </div>
        ))}

        {editing && (
          <div className="col-span-2">
            <button
              type="button"
              onClick={() => {
                const newZone: Zone = { id: 'z' + Date.now(), size: 'wide', widgetId: null }
                setZones(z => [...z, newZone])
                setPickerZone(newZone.id)
              }}
              className={cn(
                'flex h-[72px] w-full cursor-pointer items-center justify-center gap-2 rounded-[20px]',
                'border-[1.5px] border-dashed bg-transparent text-[13px] font-semibold text-dark-muted',
                '[-webkit-tap-highlight-color:transparent]',
                isDark ? 'border-white/12' : 'border-black/10',
              )}
            >
              <Plus size={18} />
              Lägg till widget
            </button>
          </div>
        )}
      </div>

      {pickerZone && (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Stäng"
            className="absolute inset-0 border-0 bg-black/60"
            onClick={() => setPickerZone(null)}
          />
          <div
            className={cn(
              'absolute right-0 bottom-0 left-0 flex max-h-[75vh] flex-col overflow-hidden',
              'rounded-t-[20px] border',
              isDark
                ? 'border-[#2a3858] bg-[#172030]'
                : 'border-[#e0e0e0] bg-white',
            )}
          >
            <div className="shrink-0 px-5 pt-3.5 pb-2.5">
              <div
                className={cn(
                  'mx-auto mb-3.5 h-1 w-9 rounded-sm',
                  isDark ? 'bg-[#2a3858]' : 'bg-[#e0e0e0]',
                )}
              />
              <div className="mb-1 text-[11px] font-bold tracking-[1.5px] text-dark-muted">
                VÄLJ WIDGET
              </div>
              <div className="text-xs text-dark-muted">
                Välj även storlek:
                <button
                  type="button"
                  onClick={() => {
                    if (picker) {
                      saveLayout(
                        zones.map(x =>
                          x.id === pickerZone
                            ? { ...x, size: x.size === 'wide' ? 'small' : 'wide' }
                            : x,
                        ),
                      )
                    }
                  }}
                  className="ml-2 cursor-pointer rounded-[10px] border border-gold/25 bg-gold/10 px-2.5 py-0.5 text-[11px] font-bold text-gold [-webkit-tap-highlight-color:transparent]"
                >
                  {picker?.size === 'wide' ? 'Bred → Liten' : 'Liten → Bred'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto px-3.5 pb-6">
              {WIDGET_REGISTRY.map(w => {
                const isSelected = picker?.widgetId === w.id
                const unavailable = (w.requiresTeam && !data.myTeam) || (w.requiresPlayer && !data.myPlayer)
                return (
                  <button
                    key={w.id}
                    type="button"
                    disabled={unavailable}
                    onClick={() => {
                      if (unavailable) return
                      saveLayout(zones.map(z => (z.id === pickerZone ? { ...z, widgetId: w.id } : z)))
                      setPickerZone(null)
                    }}
                    className={cn(
                      'cursor-pointer rounded-[14px] border p-3 text-left',
                      '[-webkit-tap-highlight-color:transparent]',
                      unavailable && 'cursor-default opacity-40',
                      isSelected
                        ? 'border-gold/40 bg-gold/10'
                        : isDark
                          ? 'border-white/8 bg-white/[0.04]'
                          : 'border-black/6 bg-black/[0.02]',
                    )}
                  >
                    <w.icon
                      size={18}
                      className={cn('mb-1.5', isSelected ? 'text-gold' : 'text-dark-muted')}
                    />
                    <div className="mb-0.5 text-xs font-semibold bk-text-primary">{w.label}</div>
                    <div className="text-[10px] text-dark-muted">
                      {unavailable
                        ? w.requiresTeam
                          ? 'Kräver lag'
                          : 'Kräver profil'
                        : w.desc}
                    </div>
                    {isSelected && (
                      <div className="mt-1.5">
                        <Check size={12} className="text-gold" />
                      </div>
                    )}
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
