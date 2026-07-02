'use client'

import React, { useState } from 'react'
import { Award } from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'
import { COLOR, SPACE, TYPE } from '@/lib/brand'
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
    <section id="team-community" style={{ scrollMarginTop: 60, borderTop: `1px solid ${COLOR.hairline}` }}>
      <div style={{ padding: `${SPACE[6]}px ${SPACE[4]}px ${SPACE[3]}px` }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink, letterSpacing: '-0.01em' }}>
          Säsongens berättelse
        </span>
      </div>

      <TeamNarrativeBanner id={id} />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3], padding: `0 ${SPACE[4]}px ${SPACE[8]}px` }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16, background: COLOR.surface, border: `1px solid ${COLOR.hairline}` }} />
          ))}
        </div>
      ) : displayEvents.length === 0 ? (
        <div style={{ padding: `${SPACE[8]}px ${SPACE[4]}px`, textAlign: 'center' }}>
          <Award size={28} style={{ color: COLOR.ink3, opacity: 0.4, display: 'block', margin: `0 auto ${SPACE[3]}px` }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink }}>Inga händelser än</div>
          <div style={{ marginTop: SPACE[1], fontSize: TYPE.caption, color: COLOR.ink3 }}>Händelser genereras automatiskt när matcher spelas</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3], padding: `0 ${SPACE[4]}px ${SPACE[8]}px` }}>
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
