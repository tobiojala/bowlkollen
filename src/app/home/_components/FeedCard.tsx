'use client'

import Link from 'next/link'
import { COLOR, MOTION, SPACE, TYPE } from '@/lib/brand'
import { KeyStat } from './KeyStat'
import { FeedActions } from '@/components/FeedActions'
import type {
  TeamEvent,
  TeamEventType,
  MatchResultPayload,
  PersonalBestPayload,
  FormRisingPayload,
} from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const LABELS: Partial<Record<TeamEventType, string>> = {
  win_streak:         'SEGERSVIT',
  personal_best:      'PERSONBÄSTA',
  player_milestone:   'MILSTOLPE',
  form_rising:        'I FORM',
  division_climbed:   'KLÄTTRAR',
  match_preview:      'KOMMANDE',
  lineup_announced:   'UPPSTÄLLNING',
  comeback_win:       'COMEBACK',
  revenge_win:        'REVANSCH',
  giant_killer:       'JÄTTEDÖDARE',
  captain_post:       'KAPTEN',
}

function labelFor(event: TeamEvent): string {
  if (event.event_type === 'match_result') {
    const p = event.payload as MatchResultPayload
    return p.result === 'W' ? 'SEGER' : p.result === 'L' ? 'FÖRLUST' : 'OAVGJORT'
  }
  return LABELS[event.event_type] ?? event.event_type.toUpperCase().replace(/_/g, ' ')
}

function accentFor(event: TeamEvent): string {
  if (event.event_type === 'match_result') {
    const p = event.payload as MatchResultPayload
    return p.result === 'W' ? COLOR.gold : p.result === 'L' ? COLOR.red : COLOR.ink3
  }
  if (event.event_type === 'form_rising' || event.event_type === 'division_climbed') return COLOR.green
  return COLOR.gold
}

function linkFor(event: TeamEvent): string {
  const p = event.payload
  if (event.match_id && (event.event_type === 'match_result' || event.event_type === 'match_preview')) {
    return `/matches/${event.match_id}`
  }
  if (event.event_type === 'personal_best' || event.event_type === 'form_rising' || event.event_type === 'player_milestone') {
    const playerId = (p as PersonalBestPayload | FormRisingPayload).player_id
    if (playerId) return `/players/${playerId}`
  }
  return `/teams/${event.team_id}`
}

function fmtDate(dateStr: string): string {
  const d    = new Date(dateStr + 'T12:00:00')
  const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diff <= -2) return `Om ${-diff} dagar`
  if (diff === -1) return 'Imorgon'
  if (diff === 0) return 'Idag'
  if (diff === 1) return 'Igår'
  if (diff < 7)  return `${diff} dagar sedan`
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function FeedCard({ event, myTeamId }: { event: TeamEvent; myTeamId?: string | null }) {
  const isMyTeam = !!myTeamId && event.team_id === myTeamId
  const accent   = accentFor(event)
  const label    = labelFor(event)
  const dateStr  = fmtDate(event.event_date)
  const teamName = isMyTeam ? 'Ditt lag' : event.team?.name

  return (
    <div style={{ borderBottom: `1px solid ${COLOR.hairline}` }}>
      <Link href={linkFor(event)} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{ padding: `${SPACE[6]}px ${SPACE[4]}px ${SPACE[3]}px`, transition: `opacity ${MOTION.fast}s ease` }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[4] }}>
            <span style={{ fontSize: TYPE.label, fontWeight: 700, letterSpacing: '0.08em', color: accent }}>
              {label}
            </span>
            <span style={{ fontSize: TYPE.label, color: isMyTeam ? COLOR.gold : COLOR.ink2 }}>
              {teamName ? `${teamName} · ` : ''}{dateStr}
            </span>
          </div>

          {/* Title */}
          <div style={{ fontSize: 17, fontWeight: 700, color: COLOR.ink, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
            {event.title}
          </div>

          <KeyStat event={event} accent={accent} />
        </div>
      </Link>

      <FeedActions
        eventId={event.id}
        reactions={event.reactions}
        followType="team"
        followId={event.team_id}
        saveKey={event.id}
        shareTitle={event.title}
        shareUrl={`/teams/${event.team_id}`}
      />

      {event.body && (
        <div style={{ padding: `0 ${SPACE[4]}px ${SPACE[6]}px`, fontSize: TYPE.body, color: COLOR.ink, lineHeight: 1.6 }}>
          {event.body}
        </div>
      )}
    </div>
  )
}
