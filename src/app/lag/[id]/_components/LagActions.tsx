'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Clock, Share2, CalendarPlus } from 'lucide-react'
import { useSession, useTeamClaim } from '@/lib/queries'
import FollowButton from '@/components/FollowButton'
import { DownloadMenu, type CsvScope } from '@/components/DownloadMenu'
import { COLOR, SPACE } from '@/lib/brand'
import { toCsv, downloadText, fileStem } from '@/lib/csv'
import type { MatchRow } from '@/lib/division-standings'
import { ClaimTeamSheet } from './ClaimTeamSheet'
import { RolePicker } from './RolePicker'

type Props = {
  teamId:   number
  teamName: string
  clubId:   number | null
  matches:  MatchRow[]
}

const ghost = (accent?: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 2px', background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 14, fontWeight: 600, color: accent ?? COLOR.ink2,
  WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
})

function fmtDate(iso: string) {
  return new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString('sv-SE')
}

export function LagActions({ teamId, teamName, clubId, matches }: Props) {
  const { data: session }         = useSession()
  const { data: claim }           = useTeamClaim(teamId)
  const [claimOpen, setClaimOpen] = useState(false)

  const subscribe = () => {
    window.location.href = `webcal://${window.location.host}/api/calendar/lag/${teamId}`
  }

  const share = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: teamName, url: location.href }).catch(() => {})
    }
  }

  const downloadCsv = (scope: CsvScope) => {
    const picked = scope === 'upcoming' ? matches.filter(m => !m.is_finished)
                 : scope === 'played'   ? matches.filter(m => m.is_finished)
                 : matches
    const rows = picked.map(m => [
      fmtDate(m.match_date), m.round_id ?? '',
      m.home_team_name, m.away_team_name,
      m.is_finished ? (m.home_result ?? '') : '',
      m.is_finished ? (m.away_result ?? '') : '',
      m.is_finished ? 'Spelad' : 'Kommande',
    ])
    const csv = toCsv(['Datum', 'Omgång', 'Hemmalag', 'Bortalag', 'Hemma', 'Borta', 'Status'], rows)
    const suffix = scope === 'all' ? '' : `-${scope === 'upcoming' ? 'kommande' : 'spelade'}`
    downloadText(`${fileStem(teamName)}-${new Date().getFullYear()}${suffix}.csv`, csv, 'text/csv')
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[6], flexWrap: 'wrap' }}>
        <FollowButton entityType="team" entityId={String(teamId)} variant="pill" size="md" />

        {/* Claim your spot — membership, then a private self-chosen role.
            'Kapten' is what will unlock lineup/admin tools. */}
        {session && claim?.status === 'verified' && (
          <RolePicker bitsTeamId={teamId} role={claim.role} />
        )}
        {session && claim?.status === 'pending' && (
          <span style={{ ...ghost(), cursor: 'default' }}>
            <Clock size={16} strokeWidth={2} color={COLOR.ink2} /> Väntar på granskning
          </span>
        )}
        {session && (claim == null || claim.status === 'rejected') && (
          <button onClick={() => setClaimOpen(true)} style={ghost()}>
            <ShieldCheck size={16} strokeWidth={2} color={COLOR.ink2} /> Spelar du här?
          </button>
        )}

        <button onClick={share} style={ghost()}>
          <Share2 size={16} strokeWidth={2} color={COLOR.ink2} />
          Dela
        </button>

        <button onClick={subscribe} style={ghost()}>
          <CalendarPlus size={16} strokeWidth={2} color={COLOR.ink2} />
          Kalender
        </button>

        <DownloadMenu onPick={downloadCsv} />

        {clubId != null && <Link href={`/clubs/${clubId}`} style={ghost()}>Till klubben →</Link>}
      </div>

      <ClaimTeamSheet open={claimOpen} onClose={() => setClaimOpen(false)} teamId={teamId} teamName={teamName} />
    </>
  )
}
