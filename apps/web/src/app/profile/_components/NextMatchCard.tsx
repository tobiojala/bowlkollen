'use client'

import Link from 'next/link'
import { MapPin, Bookmark, PenLine, ChevronRight } from 'lucide-react'
import { useNextMatch, useHallNotes } from '@/lib/diary'

const INK = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.72)'
const INK3 = 'rgba(244,245,247,0.56)'
const GOLD = '#f5c200'
const SURFACE = '#14171c'
const HAIR = 'rgba(244,245,247,0.08)'

function relativeMatchDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const days = Math.round((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
  if (days === 0) return 'Idag'
  if (days === 1) return 'Imorgon'
  if (days > 1 && days < 7) return `Om ${days} dagar`
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

// Prepare-pillar card: your next fixture → the prep sheet. Hints when diary notes
// from the last time at this center are waiting. Native's NextMatchCard.
export default function NextMatchCard() {
  const { data: next } = useNextMatch()
  const { data: recall = [] } = useHallNotes(next?.hall)
  if (!next) return null
  const hasRecall = recall.length > 0

  return (
    <Link href={`/prep/${next.matchId}`}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 16, background: SURFACE, textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: INK3, letterSpacing: '0.12em' }}>NÄSTA MATCH</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{relativeMatchDate(next.date)}</span>
      </div>

      <div style={{ fontSize: 16, color: INK2 }}>
        {next.isHome ? 'Hemma mot ' : 'Borta mot '}
        <span style={{ color: INK, fontWeight: 700 }}>{next.opponentName}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {next.hall && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, color: INK3, fontSize: 14 }}>
            <MapPin size={16} color={INK3} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next.hall}</span>
          </span>
        )}
        {next.division && <span style={{ marginLeft: 'auto', color: INK3, fontSize: 14 }}>{next.division}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${HAIR}`, paddingTop: 12 }}>
        {hasRecall ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: INK, fontSize: 14, fontWeight: 600 }}>
            <Bookmark size={16} color={GOLD} fill={GOLD} />
            {recall.length === 1 ? 'Din anteckning härifrån väntar' : `${recall.length} anteckningar härifrån väntar`}
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: INK3, fontSize: 14 }}>
            <PenLine size={16} color={INK3} />
            Förbered matchen
          </span>
        )}
        <ChevronRight size={18} color={INK3} />
      </div>
    </Link>
  )
}
