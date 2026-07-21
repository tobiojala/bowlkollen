'use client'

import React, { useState } from 'react'
import { ClipboardList, Star, MessageSquare, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useColors } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase'
import { useTeamEvents } from '@/lib/queries'
import type { Match, MatchResultPayload } from '@/lib/types'

type Props = {
  id: string
  upcomingMatches: Match[]
}

export default function TeamCaptainDash({ id, upcomingMatches }: Props) {
  const { C, isDark } = useColors()
  const { data: events = [] } = useTeamEvents(id)

  const [noteOpen,  setNoteOpen]  = useState(false)
  const [noteText,  setNoteText]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  const today    = new Date().toISOString().slice(0, 10)
  const in72h    = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // Match coming up within 72h
  const nextMatch = upcomingMatches.find(m => m.date <= in72h && m.date >= today)

  // Latest match_result without a captain_note or featured_player set in last 24h
  const latestResult = events.find(e => e.event_type === 'match_result')
  const resultNeedsHero = latestResult && !latestResult.captain_note &&
    (Date.now() - new Date(latestResult.created_at).getTime()) < 24 * 60 * 60 * 1000

  const saveNote = async () => {
    if (!noteText.trim() || saving) return
    setSaving(true)
    // captain_post event
    await createClient().from('team_events').insert({
      team_id:    id,
      event_type: 'captain_post',
      event_date: today,
      title:      'Kaptenens kommentar',
      payload:    { text: noteText.trim() },
    })
    setSaving(false)
    setSaved(true)
    setNoteText('')
    setNoteOpen(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const actions: { icon: React.ReactNode; label: string; sub: string; href?: string; onClick?: () => void }[] = []

  if (nextMatch) {
    const opp = nextMatch.home_team_id === id ? nextMatch.away : nextMatch.home
    actions.push({
      icon: <ClipboardList className="h-4 w-4" />,
      label: 'Bekräfta truppen',
      sub:   `mot ${opp.name}`,
      href:  `/team/${id}/laguttagning/${nextMatch.id}`,
    })
  }

  if (resultNeedsHero && latestResult) {
    const p = latestResult.payload as MatchResultPayload
    actions.push({
      icon: <Star className="h-4 w-4" />,
      label: 'Utse matchhjälte',
      sub:   `${p.opponent_name} — välj en spelare`,
      href:  `/team/${id}/intern`,
    })
  }

  actions.push({
    icon:    <MessageSquare className="h-4 w-4" />,
    label:   saved ? 'Publicerat!' : 'Skriv en kommentar',
    sub:     'Syns i flödet',
    onClick: () => setNoteOpen(v => !v),
  })

  return (
    <div
      className="mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{ border: '1px solid ' + C.accent + '30', background: isDark ? C.accent + '08' : C.accent + '05' }}
    >
      <div className="px-4 pt-3 pb-1">
        <span className="text-xs font-black tracking-widest" style={{ color: C.accent }}>
          KAPTENENS ÅTGÄRDER
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: C.border }}>
        {actions.map((a, i) => (
          a.href ? (
            <Link
              key={i}
              href={a.href}
              className="flex items-center gap-3 px-4 py-3 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: C.accent + '20', color: C.accent }}>
                {a.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold" style={{ color: C.text }}>{a.label}</div>
                <div className="text-xs" style={{ color: C.muted }}>{a.sub}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: C.muted }} />
            </Link>
          ) : (
            <button
              key={i}
              onClick={a.onClick}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: saved && a.label.includes('Publicerat') ? C.green + '20' : C.accent + '20', color: saved && a.label.includes('Publicerat') ? C.green : C.accent }}>
                {a.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold" style={{ color: saved && a.label.includes('Publicerat') ? C.green : C.text }}>{a.label}</div>
                <div className="text-xs" style={{ color: C.muted }}>{a.sub}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: C.muted }} />
            </button>
          )
        ))}
      </div>

      {noteOpen && (
        <div className="px-4 pb-4 pt-2">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value.slice(0, 280))}
            placeholder="Dela en tanke med fansen... (280 tecken)"
            rows={3}
            className="w-full resize-none rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: C.bg, border: '1px solid ' + C.accent + '40', color: C.text, fontFamily: 'system-ui' }}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs" style={{ color: C.muted }}>{noteText.length}/280</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setNoteOpen(false); setNoteText('') }}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ color: C.muted, border: '1px solid ' + C.border }}
              >
                Avbryt
              </button>
              <button
                onClick={saveNote}
                disabled={!noteText.trim() || saving}
                className="rounded-lg px-4 py-1.5 text-xs font-bold"
                style={{ background: noteText.trim() ? C.accent : C.border, color: noteText.trim() ? '#1a1400' : C.muted, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Publicerar...' : 'Publicera'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
