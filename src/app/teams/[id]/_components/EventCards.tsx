'use client'

import React, { useState } from 'react'
import {
  Flame, Trophy, TrendingUp, Star, MessageSquare,
  Calendar, ArrowUp, Users, UserCheck,
} from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase'
import { usePredictions } from '@/lib/queries'
import type {
  TeamEvent, MatchResultPayload, StreakPayload, PersonalBestPayload,
  PlayerMilestonePayload, FormRisingPayload, MatchPreviewPayload,
  DivisionClimbedPayload, LineupAnnouncedPayload,
} from '@/lib/types'

type CC = ReturnType<typeof useColors>['C']

// ── Reaction bar ──────────────────────────────────────────────────────────────

const REACTIONS = [
  { key: 'fire',  emoji: '🔥' },
  { key: 'heart', emoji: '❤️' },
  { key: 'clap',  emoji: '👏' },
  { key: 'sad',   emoji: '😢' },
] as const

type ReactionKey = typeof REACTIONS[number]['key']

export function ReactionBar({ event, userId, C }: {
  event: TeamEvent
  userId: string | null
  C: CC
}) {
  const counts = { fire: 0, heart: 0, clap: 0, sad: 0 } as Record<ReactionKey, number>
  event.reactions?.forEach(r => { if (r.reaction in counts) counts[r.reaction as ReactionKey]++ })
  const mine = event.reactions?.find(r => r.user_id === userId)?.reaction as ReactionKey | undefined

  const react = async (key: ReactionKey) => {
    if (!userId) return
    const supabase = createClient()
    if (mine === key) {
      await supabase.from('team_event_reactions').delete()
        .eq('event_id', event.id).eq('user_id', userId)
    } else if (mine) {
      await supabase.from('team_event_reactions').update({ reaction: key })
        .eq('event_id', event.id).eq('user_id', userId)
    } else {
      await supabase.from('team_event_reactions').insert({ event_id: event.id, user_id: userId, reaction: key })
    }
  }

  return (
    <div className="mt-2 flex gap-2">
      {REACTIONS.map(({ key, emoji }) => (
        <button
          key={key}
          onClick={() => react(key)}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all"
          style={{
            background: mine === key ? C.accent + '25' : C.bg,
            border: '1px solid ' + (mine === key ? C.accent + '50' : C.border),
            color: mine === key ? C.accent : C.muted,
            cursor: userId ? 'pointer' : 'default',
          }}
        >
          <span>{emoji}</span>
          {counts[key] > 0 && <span>{counts[key]}</span>}
        </button>
      ))}
    </div>
  )
}

// ── Hero tap (admin only, on match_result) ────────────────────────────────────

export function HeroTap({ event, teamId, onHeroSet, C }: {
  event: TeamEvent
  teamId: string
  onHeroSet: (eventId: string, playerId: string, playerName: string) => void
  C: CC
}) {
  const [open,    setOpen]    = useState(false)
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)

  const current = (event.payload as MatchResultPayload).top_scorer?.name

  const openPicker = async () => {
    if (open) { setOpen(false); return }
    setLoading(true)
    const { data } = await createClient()
      .from('match_results')
      .select('player_id, player:players!player_id(id, name)')
      .eq('match_id', event.match_id!)
      .eq('team_id', teamId)
    const list = (data ?? []).map((r: any) => {
      const p = Array.isArray(r.player) ? r.player[0] : r.player
      return { id: p?.id ?? r.player_id, name: p?.name ?? 'Okänd' }
    }).filter(p => p.name !== 'Okänd')
    setPlayers(list)
    setLoading(false)
    setOpen(true)
  }

  const pick = async (p: { id: string; name: string }) => {
    setSaving(true)
    await createClient()
      .from('team_events')
      .update({ featured_player_id: p.id })
      .eq('id', event.id)
    onHeroSet(event.id, p.id, p.name)
    setSaving(false)
    setOpen(false)
  }

  return (
    <div className="mt-2">
      <button
        onClick={openPicker}
        className="flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: C.accent }}
      >
        <UserCheck className="h-3.5 w-3.5" />
        {current ? `Hjälte: ${current}` : 'Utse matchhjälte'}
      </button>
      {open && (
        <div className="mt-2 rounded-xl p-2" style={{ background: C.bg, border: '1px solid ' + C.border }}>
          {loading ? (
            <div className="py-2 text-center text-xs" style={{ color: C.muted }}>Laddar...</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => pick(p)}
                  disabled={saving}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ background: C.card, border: '1px solid ' + C.border, color: C.text, cursor: 'pointer' }}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Individual card bodies ────────────────────────────────────────────────────

export function MatchResultCard({ event, C }: { event: TeamEvent; C: CC }) {
  const p = event.payload as MatchResultPayload
  const rc = p.result === 'W' ? C.green : p.result === 'L' ? '#ef4444' : C.muted
  const rl = p.result === 'W' ? 'SEGER' : p.result === 'L' ? 'FÖRLUST' : 'OAVGJORT'
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black" style={{ background: rc + '20', color: rc }}>{p.result}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider" style={{ color: rc }}>{rl}</span>
          <span className="text-xs" style={{ color: C.muted }}>{p.is_home ? 'hemma' : 'borta'}</span>
        </div>
        <div className="mt-0.5 text-sm font-semibold" style={{ color: C.text }}>{event.title}</div>
        <div className="mt-0.5 text-xs" style={{ color: C.muted }}>
          <span className="text-base font-black" style={{ color: C.text }}>{p.my_score}</span>
          <span className="mx-1">–</span>
          <span className="text-base font-black">{p.opp_score}</span>
          {p.top_scorer && <span className="ml-2">· {p.top_scorer.name} {p.top_scorer.high_game}</span>}
        </div>
      </div>
    </div>
  )
}

export function StreakCard({ event, C }: { event: TeamEvent; C: CC }) {
  const p = event.payload as StreakPayload
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#f9731620' }}>
        <Flame className="h-5 w-5" style={{ color: '#f97316' }} />
      </div>
      <div>
        <div className="text-xs font-bold tracking-wider" style={{ color: '#f97316' }}>STREAK</div>
        <div className="text-sm font-semibold" style={{ color: C.text }}>{event.title}</div>
        {event.body && <div className="text-xs" style={{ color: C.muted }}>{event.body}</div>}
      </div>
      <div className="ml-auto text-3xl font-black tabular-nums" style={{ color: '#f97316' }}>{p.streak_length}</div>
    </div>
  )
}

export function PersonalBestCard({ event, C }: { event: TeamEvent; C: CC }) {
  const p = event.payload as PersonalBestPayload
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: C.accent + '20' }}>
        <Trophy className="h-5 w-5" style={{ color: C.accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold tracking-wider" style={{ color: C.accent }}>KARRIÄRREKORD</div>
        <div className="text-sm font-semibold" style={{ color: C.text }}>{p.player_name}</div>
        <div className="text-xs" style={{ color: C.muted }}>Förra bästa: {p.previous_best}</div>
      </div>
      <div className="text-3xl font-black tabular-nums" style={{ color: C.accent }}>{p.new_best}</div>
    </div>
  )
}

export function MilestoneCard({ event, C }: { event: TeamEvent; C: CC }) {
  const p = event.payload as PlayerMilestonePayload
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: C.green + '20' }}>
        <Star className="h-5 w-5" style={{ color: C.green }} />
      </div>
      <div>
        <div className="text-xs font-bold tracking-wider" style={{ color: C.green }}>MILSTOLPE</div>
        <div className="text-sm font-semibold" style={{ color: C.text }}>{p.player_name}</div>
        <div className="text-xs" style={{ color: C.muted }}>{event.body}</div>
      </div>
      <div className="ml-auto text-3xl font-black tabular-nums" style={{ color: C.green }}>{p.milestone}</div>
    </div>
  )
}

export function FormRisingCard({ event, C }: { event: TeamEvent; C: CC }) {
  const p = event.payload as FormRisingPayload
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#a855f720' }}>
        <TrendingUp className="h-5 w-5" style={{ color: '#a855f7' }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold tracking-wider" style={{ color: '#a855f7' }}>TOPPFORM</div>
        <div className="text-sm font-semibold" style={{ color: C.text }}>{p.player_name}</div>
        <div className="text-xs" style={{ color: C.muted }}>Säsongssnitt: {p.season_avg} · Senaste 3: {p.recent_avg}</div>
      </div>
      <div className="text-xl font-black" style={{ color: '#a855f7' }}>+{p.delta}</div>
    </div>
  )
}

function PredictionBar({ matchId, C }: { matchId: string | null; C: CC }) {
  const { data, refetch } = usePredictions(matchId)
  const counts = data?.counts ?? { W: 0, D: 0, L: 0 }
  const mine   = data?.mine ?? null
  const total  = counts.W + counts.D + counts.L

  const predict = async (p: 'W' | 'D' | 'L') => {
    if (!matchId) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    if (mine === p) {
      await supabase.from('match_predictions').delete().eq('match_id', matchId).eq('user_id', session.user.id)
    } else {
      await supabase.from('match_predictions').upsert({ match_id: matchId, user_id: session.user.id, prediction: p })
    }
    refetch()
  }

  const pct = (k: 'W' | 'D' | 'L') => total > 0 ? Math.round((counts[k] / total) * 100) : 0

  const opts: { key: 'W' | 'D' | 'L'; label: string; color: string }[] = [
    { key: 'W', label: 'Vinst',    color: C.green   },
    { key: 'D', label: 'Oavgjort', color: C.muted   },
    { key: 'L', label: 'Förlust',  color: '#ef4444' },
  ]

  return (
    <div className="mt-3">
      {total > 0 && (
        <div className="mb-2 flex h-1.5 overflow-hidden rounded-full">
          {opts.map(o => pct(o.key) > 0 && (
            <div key={o.key} style={{ width: pct(o.key) + '%', background: o.color, transition: 'width 0.4s ease' }} />
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {opts.map(o => (
          <button
            key={o.key}
            onClick={() => predict(o.key)}
            className="flex flex-1 flex-col items-center rounded-xl py-2 text-xs font-semibold transition-all"
            style={{
              background: mine === o.key ? o.color + '25' : C.bg,
              border: '1px solid ' + (mine === o.key ? o.color + '60' : C.border),
              color: mine === o.key ? o.color : C.muted,
            }}
          >
            <span className="font-bold">{o.label}</span>
            {total > 0 && <span className="mt-0.5 text-xs opacity-70">{pct(o.key)}%</span>}
          </button>
        ))}
      </div>
      {total > 0 && (
        <div className="mt-1.5 text-center text-xs" style={{ color: C.muted }}>
          {total} {total === 1 ? 'fan' : 'fans'} har röstat
        </div>
      )}
    </div>
  )
}

export function MatchPreviewCard({ event, C }: { event: TeamEvent; C: CC }) {
  const p = event.payload as MatchPreviewPayload
  const matchDay = new Date(p.match_date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })
  const h2hTotal = p.h2h_wins + p.h2h_losses + p.h2h_draws
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: C.accent + '20' }}>
          <Calendar className="h-5 w-5" style={{ color: C.accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold tracking-wider" style={{ color: C.accent }}>NÄSTA MATCH</div>
          <div className="mt-0.5 text-sm font-semibold" style={{ color: C.text }}>{event.title}</div>
          <div className="mt-0.5 text-xs" style={{ color: C.muted }}>
            {matchDay}
            {h2hTotal > 0 && <span className="ml-2">· {p.h2h_wins}V {p.h2h_losses}F {p.h2h_draws}O</span>}
          </div>
        </div>
        <div className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold" style={{ background: p.is_home ? C.green + '20' : C.muted + '20', color: p.is_home ? C.green : C.muted }}>
          {p.is_home ? 'Hemma' : 'Borta'}
        </div>
      </div>
      <PredictionBar matchId={event.match_id} C={C} />
    </div>
  )
}

export function EmotionalWinCard({ event, C }: { event: TeamEvent; C: CC }) {
  const isRevenge    = event.event_type === 'revenge_win'
  const isGiantKiller = event.event_type === 'giant_killer'
  const color  = isRevenge ? '#f97316' : '#a855f7'
  const label  = isRevenge ? 'REVANSCH' : 'JÄTTEDÖDARE'
  const emoji  = isRevenge ? '⚡' : '🏆'
  const p      = event.payload as { my_score: number; opp_score: number; opponent_name: string; rank_gap?: number }
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: color + '20' }}>
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold tracking-wider" style={{ color }}>{label}</div>
        <div className="text-sm font-semibold" style={{ color: C.text }}>{event.title}</div>
        <div className="text-xs" style={{ color: C.muted }}>
          {p.my_score}–{p.opp_score}
          {isGiantKiller && p.rank_gap && <span className="ml-1">· {p.rank_gap} platser högre upp</span>}
        </div>
      </div>
    </div>
  )
}

export function DivisionClimbedCard({ event, C }: { event: TeamEvent; C: CC }) {
  const p = event.payload as DivisionClimbedPayload
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: C.green + '20' }}>
        <ArrowUp className="h-5 w-5" style={{ color: C.green }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold tracking-wider" style={{ color: C.green }}>TABELLKLÄTTRING</div>
        <div className="text-sm font-semibold" style={{ color: C.text }}>{event.title}</div>
        <div className="text-xs" style={{ color: C.muted }}>{p.points} poäng · {p.division}</div>
      </div>
      <div className="text-3xl font-black tabular-nums" style={{ color: C.green }}>{p.new_position}</div>
    </div>
  )
}

export function LineupAnnouncedCard({ event, C }: { event: TeamEvent; C: CC }) {
  const p = event.payload as LineupAnnouncedPayload
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: C.accent + '15' }}>
        <Users className="h-5 w-5" style={{ color: C.accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold tracking-wider" style={{ color: C.accent }}>TRUPPEN KLAR</div>
        <div className="mt-0.5 text-sm font-semibold" style={{ color: C.text }}>{event.title}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {p.players.slice(0, 8).map(pl => (
            <span key={pl.id} className="rounded-lg px-2 py-0.5 text-xs font-medium" style={{ background: C.card, border: '1px solid ' + C.border, color: C.text }}>
              {pl.name.split(' ')[0]}
            </span>
          ))}
          {p.players.length > 8 && <span className="rounded-lg px-2 py-0.5 text-xs" style={{ color: C.muted }}>+{p.players.length - 8}</span>}
        </div>
      </div>
    </div>
  )
}

export function CaptainPostCard({ event, C }: { event: TeamEvent; C: CC }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: C.border }}>
        <MessageSquare className="h-5 w-5" style={{ color: C.muted }} />
      </div>
      <div>
        <div className="text-xs font-bold tracking-wider" style={{ color: C.muted }}>KAPTENENS RÖST</div>
        <div className="mt-0.5 text-sm leading-relaxed" style={{ color: C.text }}>{(event.payload as { text: string }).text}</div>
      </div>
    </div>
  )
}

// ── EventCard wrapper ─────────────────────────────────────────────────────────

export function EventCard({ event, isAdmin, teamId, userId, C, onNoteAdded, onHeroSet }: {
  event: TeamEvent
  isAdmin: boolean
  teamId: string
  userId: string | null
  C: CC
  onNoteAdded: (id: string, note: string) => void
  onHeroSet: (id: string, playerId: string, playerName: string) => void
}) {
  const [editingNote, setEditingNote] = useState(false)
  const [noteText,    setNoteText]    = useState(event.captain_note ?? '')
  const [saving,      setSaving]      = useState(false)

  const saveNote = async () => {
    if (saving) return
    setSaving(true)
    await createClient().from('team_events').update({ captain_note: noteText || null }).eq('id', event.id)
    onNoteAdded(event.id, noteText)
    setSaving(false)
    setEditingNote(false)
  }

  const dateStr = new Date(event.event_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })

  return (
    <div className="rounded-2xl p-4" style={{ background: event.is_pinned ? C.accent + '08' : C.card, border: '1px solid ' + (event.is_pinned ? C.accent + '30' : C.border) }}>
      {event.event_type === 'match_result'      && <MatchResultCard     event={event} C={C} />}
      {event.event_type === 'win_streak'        && <StreakCard           event={event} C={C} />}
      {event.event_type === 'unbeaten_run'      && <StreakCard           event={event} C={C} />}
      {event.event_type === 'personal_best'     && <PersonalBestCard    event={event} C={C} />}
      {event.event_type === 'player_milestone'  && <MilestoneCard       event={event} C={C} />}
      {event.event_type === 'form_rising'       && <FormRisingCard      event={event} C={C} />}
      {event.event_type === 'match_preview'     && <MatchPreviewCard    event={event} C={C} />}
      {event.event_type === 'division_climbed'  && <DivisionClimbedCard event={event} C={C} />}
      {event.event_type === 'lineup_announced'  && <LineupAnnouncedCard event={event} C={C} />}
      {event.event_type === 'revenge_win'       && <EmotionalWinCard    event={event} C={C} />}
      {event.event_type === 'giant_killer'      && <EmotionalWinCard    event={event} C={C} />}
      {event.event_type === 'captain_post'      && <CaptainPostCard     event={event} C={C} />}

      {/* Admin: hero tap on match_result */}
      {isAdmin && event.event_type === 'match_result' && event.match_id && (
        <HeroTap event={event} teamId={teamId} onHeroSet={onHeroSet} C={C} />
      )}

      {/* Captain note */}
      {event.captain_note && !editingNote && (
        <div className="mt-3 rounded-xl px-3 py-2 text-sm italic leading-relaxed" style={{ background: C.bg, color: C.muted, borderLeft: '3px solid ' + C.accent + '60' }}>
          &ldquo;{event.captain_note}&rdquo;
        </div>
      )}

      {isAdmin && editingNote && (
        <div className="mt-3">
          <textarea value={noteText} onChange={e => setNoteText(e.target.value.slice(0, 140))} placeholder="Kommentar... (140 tecken)" rows={2}
            className="w-full resize-none rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: C.bg, border: '1px solid ' + C.accent + '60', color: C.text, fontFamily: 'system-ui' }} />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => { setEditingNote(false); setNoteText(event.captain_note ?? '') }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: C.muted, border: '1px solid ' + C.border }}>Avbryt</button>
            <button onClick={saveNote} disabled={saving}
              className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: C.accent, color: '#1a1400', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </div>
      )}

      {/* Reaction bar */}
      <ReactionBar event={event} userId={userId} C={C} />

      {/* Footer */}
      <div className="mt-2 flex items-center gap-3">
        <span className="text-xs" style={{ color: C.muted }}>{dateStr}</span>
        {event.is_pinned && <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: C.accent + '20', color: C.accent }}>Fäst</span>}
        {isAdmin && !editingNote && (
          <button onClick={() => setEditingNote(true)} className="ml-auto text-xs font-semibold" style={{ color: C.accent }}>
            {event.captain_note ? 'Redigera kommentar' : '+ Kommentar'}
          </button>
        )}
      </div>
    </div>
  )
}
