'use client'

import React, { useState } from 'react'
import { Award } from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'
import { useTeamEvents, useSession } from '@/lib/queries'
import { EventCard } from './EventCards'
import TeamNarrativeBanner from './TeamNarrativeBanner'
import type { TeamEvent } from '@/lib/types'

type Props = { id: string; isAdmin: boolean }

export default function TeamFeed({ id, isAdmin }: Props) {
  const { C }                                    = useColors()
  const { data: events = [], isLoading }         = useTeamEvents(id)
  const { data: session }                        = useSession()
  const [localEvents, setLocalEvents]            = useState<TeamEvent[] | null>(null)

  const displayEvents = localEvents ?? events
  const userId = session?.user?.id ?? null

  const handleNoteAdded = (eventId: string, note: string) => {
    setLocalEvents((localEvents ?? events).map(e =>
      e.id === eventId ? { ...e, captain_note: note || null } : e
    ))
  }

  const handleHeroSet = (eventId: string, playerId: string, playerName: string) => {
    setLocalEvents((localEvents ?? events).map(e => {
      if (e.id !== eventId) return e
      const p = e.payload as any
      return {
        ...e,
        featured_player_id: playerId,
        payload: { ...p, top_scorer: { ...p.top_scorer, player_id: playerId, name: playerName } },
      }
    }))
  }

  return (
    <section id="team-community" style={{ scrollMarginTop: 60, borderTop: '1px solid ' + C.border }}>
      <div className="px-5 pb-3 pt-5">
        <span className="text-xs font-black tracking-widest" style={{ color: C.muted }}>
          SÄSONGENS BERÄTTELSE
        </span>
      </div>

      <TeamNarrativeBanner id={id} />

      {isLoading ? (
        <div className="space-y-3 px-5 pb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-2xl" style={{ background: C.card }} />
          ))}
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Award className="mx-auto mb-3 h-8 w-8 opacity-30" style={{ color: C.muted }} />
          <div className="text-sm font-semibold" style={{ color: C.text }}>Inga händelser än</div>
          <div className="mt-1 text-xs" style={{ color: C.muted }}>Händelser genereras automatiskt när matcher spelas</div>
        </div>
      ) : (
        <div className="space-y-3 px-4 pb-12">
          {displayEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isAdmin={isAdmin}
              teamId={id}
              userId={userId}
              C={C}
              onNoteAdded={handleNoteAdded}
              onHeroSet={handleHeroSet}
            />
          ))}
        </div>
      )}
    </section>
  )
}
