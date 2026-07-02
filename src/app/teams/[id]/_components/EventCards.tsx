'use client'

import React, { useState } from 'react'
import {
  Flame, Trophy, TrendingUp, Star, MessageSquare,
  Calendar, ArrowUp, Users, UserCheck, Zap,
} from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase'
import { usePredictions } from '@/lib/queries'
import { FeedActions } from '@/components/FeedActions'
import { COLOR, SPACE, RADIUS, TYPE, FONT } from '@/lib/brand'
import type {
  TeamEvent, MatchResultPayload, StreakPayload, PersonalBestPayload,
  PlayerMilestonePayload, FormRisingPayload, MatchPreviewPayload,
  DivisionClimbedPayload, LineupAnnouncedPayload,
} from '@/lib/types'

// ── Label + value helpers ─────────────────────────────────────────────────────

function EventLabel({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ fontSize: TYPE.label, fontWeight: 700, letterSpacing: '0.04em', color, marginBottom: SPACE[1] }}>
      {text}
    </div>
  )
}

function IconBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: RADIUS.md, flexShrink: 0,
      background: color + '18', border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </div>
  )
}

// ── Hero tap (admin only, on match_result) ────────────────────────────────────

export function HeroTap({ event, teamId, onHeroSet }: {
  event: TeamEvent
  teamId: string
  onHeroSet: (eventId: string, playerId: string, playerName: string) => void
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
    const list = (data ?? []).map((r: { player_id: string | null; player: { id: string; name: string } | null }) => {
      return { id: r.player?.id ?? r.player_id ?? '', name: r.player?.name ?? 'Okänd' }
    }).filter(p => p.name !== 'Okänd' && p.id !== '')
    setPlayers(list)
    setLoading(false)
    setOpen(true)
  }

  const pick = async (p: { id: string; name: string }) => {
    setSaving(true)
    await createClient().from('team_events').update({ featured_player_id: p.id }).eq('id', event.id)
    onHeroSet(event.id, p.id, p.name)
    setSaving(false)
    setOpen(false)
  }

  return (
    <div style={{ marginTop: SPACE[2] }}>
      <button
        onClick={openPicker}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: TYPE.label, fontWeight: 700, color: COLOR.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <UserCheck size={14} />
        {current ? `Hjälte: ${current}` : 'Utse matchhjälte'}
      </button>
      {open && (
        <div style={{ marginTop: SPACE[2], borderRadius: RADIUS.md, padding: SPACE[2], background: COLOR.bg, border: `1px solid ${COLOR.hairline}` }}>
          {loading ? (
            <div style={{ padding: `${SPACE[2]}px 0`, textAlign: 'center', fontSize: TYPE.caption, color: COLOR.ink3 }}>Laddar...</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[2] }}>
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => pick(p)}
                  disabled={saving}
                  style={{ borderRadius: RADIUS.sm, padding: `${SPACE[1]}px ${SPACE[3]}px`, fontSize: TYPE.label, fontWeight: 600, background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, color: COLOR.ink, cursor: 'pointer' }}
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

export function MatchResultCard({ event }: { event: TeamEvent }) {
  const p  = event.payload as MatchResultPayload
  const rc = p.result === 'W' ? COLOR.green : p.result === 'L' ? COLOR.red : COLOR.ink3
  const rl = p.result === 'W' ? 'Seger' : p.result === 'L' ? 'Förlust' : 'Oavgjort'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE[3] }}>
      <div style={{ width: 40, height: 40, borderRadius: RADIUS.md, flexShrink: 0, background: rc + '18', border: `1px solid ${rc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: rc }}>
        {p.result}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
          <EventLabel text={rl} color={rc} />
          <span style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{p.is_home ? 'hemma' : 'borta'}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink, marginBottom: 2 }}>{event.title}</div>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>
          <span style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: 900, color: COLOR.ink }}>{p.my_score}</span>
          <span style={{ margin: '0 4px', color: COLOR.ink3 }}>–</span>
          <span style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: 900 }}>{p.opp_score}</span>
          {p.top_scorer && <span style={{ marginLeft: SPACE[2] }}>· {p.top_scorer.name} {p.top_scorer.high_game}</span>}
        </div>
      </div>
    </div>
  )
}

export function StreakCard({ event }: { event: TeamEvent }) {
  const p = event.payload as StreakPayload
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
      <IconBadge color="#f97316"><Flame size={18} color="#f97316" /></IconBadge>
      <div style={{ flex: 1 }}>
        <EventLabel text="Streak" color="#f97316" />
        <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink }}>{event.title}</div>
        {event.body && <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{event.body}</div>}
      </div>
      <div style={{ fontFamily: FONT.display, fontSize: 32, fontWeight: 900, color: '#f97316', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{p.streak_length}</div>
    </div>
  )
}

export function PersonalBestCard({ event }: { event: TeamEvent }) {
  const p = event.payload as PersonalBestPayload
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
      <IconBadge color={COLOR.gold}><Trophy size={18} color={COLOR.gold} /></IconBadge>
      <div style={{ flex: 1, minWidth: 0 }}>
        <EventLabel text="Karriärrekord" color={COLOR.gold} />
        <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink }}>{p.player_name}</div>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>Förra bästa: {p.previous_best}</div>
      </div>
      <div style={{ fontFamily: FONT.display, fontSize: 32, fontWeight: 900, color: COLOR.gold, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{p.new_best}</div>
    </div>
  )
}

export function MilestoneCard({ event }: { event: TeamEvent }) {
  const p = event.payload as PlayerMilestonePayload
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
      <IconBadge color={COLOR.green}><Star size={18} color={COLOR.green} /></IconBadge>
      <div style={{ flex: 1 }}>
        <EventLabel text="Milstolpe" color={COLOR.green} />
        <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink }}>{p.player_name}</div>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{event.body}</div>
      </div>
      <div style={{ fontFamily: FONT.display, fontSize: 32, fontWeight: 900, color: COLOR.green, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{p.milestone}</div>
    </div>
  )
}

export function FormRisingCard({ event }: { event: TeamEvent }) {
  const p = event.payload as FormRisingPayload
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
      <IconBadge color={COLOR.green}><TrendingUp size={18} color={COLOR.green} /></IconBadge>
      <div style={{ flex: 1, minWidth: 0 }}>
        <EventLabel text="Toppform" color={COLOR.green} />
        <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink }}>{p.player_name}</div>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>Säsongssnitt: {p.season_avg} · Senaste 3: {p.recent_avg}</div>
      </div>
      <div style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 900, color: COLOR.green, flexShrink: 0 }}>+{p.delta}</div>
    </div>
  )
}

function PredictionBar({ matchId }: { matchId: string | null }) {
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
    { key: 'W', label: 'Vinst',    color: COLOR.green },
    { key: 'D', label: 'Oavgjort', color: COLOR.ink3  },
    { key: 'L', label: 'Förlust',  color: COLOR.red   },
  ]

  return (
    <div style={{ marginTop: SPACE[3] }}>
      {total > 0 && (
        <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', background: COLOR.surface, marginBottom: SPACE[2], display: 'flex' }}>
          {opts.map(o => pct(o.key) > 0 && (
            <div key={o.key} style={{ width: pct(o.key) + '%', background: o.color, transition: 'width 0.4s ease' }} />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: SPACE[2] }}>
        {opts.map(o => (
          <button
            key={o.key}
            onClick={() => predict(o.key)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: `${SPACE[2]}px 0`, borderRadius: RADIUS.md,
              background: mine === o.key ? o.color + '20' : COLOR.bg,
              border: `1px solid ${mine === o.key ? o.color + '55' : COLOR.hairline}`,
              color: mine === o.key ? o.color : COLOR.ink3,
              fontSize: TYPE.label, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {o.label}
            {total > 0 && <span style={{ fontSize: TYPE.caption, opacity: 0.7, marginTop: 2 }}>{pct(o.key)}%</span>}
          </button>
        ))}
      </div>
      {total > 0 && (
        <div style={{ marginTop: SPACE[1], textAlign: 'center', fontSize: TYPE.caption, color: COLOR.ink3 }}>
          {total} {total === 1 ? 'fan' : 'fans'} har röstat
        </div>
      )}
    </div>
  )
}

export function MatchPreviewCard({ event }: { event: TeamEvent }) {
  const p        = event.payload as MatchPreviewPayload
  const matchDay = new Date(p.match_date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })
  const h2hTotal = p.h2h_wins + p.h2h_losses + p.h2h_draws
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE[3] }}>
        <IconBadge color={COLOR.gold}><Calendar size={18} color={COLOR.gold} /></IconBadge>
        <div style={{ flex: 1, minWidth: 0 }}>
          <EventLabel text="Nästa match" color={COLOR.gold} />
          <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink, marginBottom: 2 }}>{event.title}</div>
          <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>
            {matchDay}
            {h2hTotal > 0 && <span style={{ marginLeft: SPACE[2] }}>· {p.h2h_wins}V {p.h2h_losses}F {p.h2h_draws}O</span>}
          </div>
        </div>
        <div style={{ flexShrink: 0, borderRadius: RADIUS.sm, padding: `${SPACE[1]}px ${SPACE[2]}px`, fontSize: TYPE.label, fontWeight: 700, background: p.is_home ? COLOR.green + '18' : COLOR.surface, color: p.is_home ? COLOR.green : COLOR.ink3 }}>
          {p.is_home ? 'Hemma' : 'Borta'}
        </div>
      </div>
      <PredictionBar matchId={event.match_id} />
    </div>
  )
}

export function EmotionalWinCard({ event }: { event: TeamEvent }) {
  const isRevenge = event.event_type === 'revenge_win'
  const color     = isRevenge ? '#f97316' : COLOR.gold
  const label     = isRevenge ? 'Revansch' : 'Jättedödare'
  const Icon      = isRevenge ? Zap : Trophy
  const p         = event.payload as { my_score: number; opp_score: number; opponent_name: string; rank_gap?: number }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
      <IconBadge color={color}><Icon size={18} color={color} /></IconBadge>
      <div style={{ flex: 1, minWidth: 0 }}>
        <EventLabel text={label} color={color} />
        <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink }}>{event.title}</div>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>
          {p.my_score}–{p.opp_score}
          {!isRevenge && p.rank_gap && <span style={{ marginLeft: SPACE[1] }}>· {p.rank_gap} platser högre upp</span>}
        </div>
      </div>
    </div>
  )
}

export function DivisionClimbedCard({ event }: { event: TeamEvent }) {
  const p = event.payload as DivisionClimbedPayload
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
      <IconBadge color={COLOR.green}><ArrowUp size={18} color={COLOR.green} /></IconBadge>
      <div style={{ flex: 1, minWidth: 0 }}>
        <EventLabel text="Tabellklättring" color={COLOR.green} />
        <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink }}>{event.title}</div>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{p.points} poäng · {p.division}</div>
      </div>
      <div style={{ fontFamily: FONT.display, fontSize: 32, fontWeight: 900, color: COLOR.green, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{p.new_position}</div>
    </div>
  )
}

export function LineupAnnouncedCard({ event }: { event: TeamEvent }) {
  const p = event.payload as LineupAnnouncedPayload
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE[3] }}>
      <IconBadge color={COLOR.gold}><Users size={18} color={COLOR.gold} /></IconBadge>
      <div style={{ flex: 1, minWidth: 0 }}>
        <EventLabel text="Truppen klar" color={COLOR.gold} />
        <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink, marginBottom: SPACE[2] }}>{event.title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[1] }}>
          {p.players.slice(0, 8).map(pl => (
            <span key={pl.id} style={{ borderRadius: RADIUS.sm, padding: `2px ${SPACE[2]}px`, fontSize: TYPE.caption, fontWeight: 600, background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, color: COLOR.ink }}>
              {pl.name.split(' ')[0]}
            </span>
          ))}
          {p.players.length > 8 && <span style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>+{p.players.length - 8}</span>}
        </div>
      </div>
    </div>
  )
}

export function CaptainPostCard({ event }: { event: TeamEvent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE[3] }}>
      <IconBadge color={COLOR.ink3}><MessageSquare size={18} color={COLOR.ink3} /></IconBadge>
      <div>
        <EventLabel text="Kaptenens röst" color={COLOR.ink3} />
        <div style={{ fontSize: 14, lineHeight: 1.55, color: COLOR.ink }}>{(event.payload as { text: string }).text}</div>
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
  C: ReturnType<typeof useColors>['C']
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
    <div style={{
      background: event.is_pinned ? `${COLOR.gold}08` : COLOR.surface,
      border: `1px solid ${event.is_pinned ? COLOR.gold + '35' : COLOR.hairline}`,
      borderRadius: RADIUS.lg,
      padding: SPACE[4],
    }}>
      {event.event_type === 'match_result'      && <MatchResultCard     event={event} />}
      {event.event_type === 'win_streak'        && <StreakCard           event={event} />}
      {event.event_type === 'unbeaten_run'      && <StreakCard           event={event} />}
      {event.event_type === 'personal_best'     && <PersonalBestCard    event={event} />}
      {event.event_type === 'player_milestone'  && <MilestoneCard       event={event} />}
      {event.event_type === 'form_rising'       && <FormRisingCard      event={event} />}
      {event.event_type === 'match_preview'     && <MatchPreviewCard    event={event} />}
      {event.event_type === 'division_climbed'  && <DivisionClimbedCard event={event} />}
      {event.event_type === 'lineup_announced'  && <LineupAnnouncedCard event={event} />}
      {event.event_type === 'revenge_win'       && <EmotionalWinCard    event={event} />}
      {event.event_type === 'giant_killer'      && <EmotionalWinCard    event={event} />}
      {event.event_type === 'captain_post'      && <CaptainPostCard     event={event} />}

      {isAdmin && event.event_type === 'match_result' && event.match_id && (
        <HeroTap event={event} teamId={teamId} onHeroSet={onHeroSet} />
      )}

      {event.captain_note && !editingNote && (
        <div style={{ marginTop: SPACE[3], borderRadius: RADIUS.sm, padding: `${SPACE[2]}px ${SPACE[3]}px`, fontSize: TYPE.body, fontStyle: 'italic', lineHeight: 1.55, background: COLOR.bg, color: COLOR.ink3 }}>
          &ldquo;{event.captain_note}&rdquo;
        </div>
      )}

      {isAdmin && editingNote && (
        <div style={{ marginTop: SPACE[3] }}>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value.slice(0, 140))}
            placeholder="Kommentar... (140 tecken)"
            rows={2}
            style={{ width: '100%', resize: 'none', borderRadius: RADIUS.sm, padding: `${SPACE[2]}px ${SPACE[3]}px`, fontSize: TYPE.body, outline: 'none', background: COLOR.bg, border: `1px solid ${COLOR.gold}55`, color: COLOR.ink, boxSizing: 'border-box' } as React.CSSProperties}
          />
          <div style={{ marginTop: SPACE[2], display: 'flex', justifyContent: 'flex-end', gap: SPACE[2] }}>
            <button onClick={() => { setEditingNote(false); setNoteText(event.captain_note ?? '') }}
              style={{ borderRadius: RADIUS.sm, padding: `6px ${SPACE[3]}px`, fontSize: TYPE.label, fontWeight: 600, color: COLOR.ink3, border: `1px solid ${COLOR.hairline}`, background: 'transparent', cursor: 'pointer' }}>
              Avbryt
            </button>
            <button onClick={saveNote} disabled={saving}
              style={{ borderRadius: RADIUS.sm, padding: `6px ${SPACE[3]}px`, fontSize: TYPE.label, fontWeight: 700, background: COLOR.gold, color: '#1a1400', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </div>
      )}

      <FeedActions
        eventId={event.id}
        reactions={event.reactions ?? []}
        saveKey={`team_event_${event.id}`}
        shareTitle={event.title}
      />

      <div style={{ marginTop: SPACE[2], display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
        <span style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{dateStr}</span>
        {event.is_pinned && (
          <span style={{ borderRadius: 99, padding: `2px ${SPACE[2]}px`, fontSize: TYPE.caption, fontWeight: 700, background: `${COLOR.gold}18`, color: COLOR.gold }}>Fäst</span>
        )}
        {isAdmin && !editingNote && (
          <button onClick={() => setEditingNote(true)} style={{ marginLeft: 'auto', fontSize: TYPE.label, fontWeight: 600, color: COLOR.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {event.captain_note ? 'Redigera kommentar' : '+ Kommentar'}
          </button>
        )}
      </div>
    </div>
  )
}
