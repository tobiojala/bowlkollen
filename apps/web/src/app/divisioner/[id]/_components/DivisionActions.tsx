'use client'

import { Heart, CalendarPlus, Download } from 'lucide-react'
import { useSession, useIsFollowing, useToggleFollow } from '@/lib/queries'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { toCsv, downloadText, fileStem } from '@/lib/csv'
import type { MatchRow } from '@/lib/division-standings'

type Props = {
  divisionId:   number
  divisionName: string
  matches:      MatchRow[]
}

function fmtDate(iso: string) {
  return new Date(iso + (iso.length <= 10 ? 'T12:00:00' : '')).toLocaleString('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

// A native-style action button — icon over label, on a tonal surface (no border).
function ActionButton({ icon, label, onClick, disabled, accent }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; accent?: string
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[1],
      background: COLOR.surface, border: 'none', borderRadius: RADIUS.md, padding: `${SPACE[3]}px`,
      cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
      WebkitTapHighlightColor: 'transparent',
    }}>
      {icon}
      <span style={{ fontSize: TYPE.caption, fontWeight: 600, color: accent ?? COLOR.ink }}>{label}</span>
    </button>
  )
}

// Follow · Kalender · Export — same button row as native ScheduleActions. The
// standings table is shown in the layout (aside on desktop, inline on mobile),
// so there's no "Tabell" action here.
export function DivisionActions({ divisionId, divisionName, matches }: Props) {
  const { data: session }        = useSession()
  const isFollowing              = useIsFollowing('division', String(divisionId))
  const { mutate: toggleFollow, isPending } = useToggleFollow('division', String(divisionId))

  const subscribe = () => {
    window.location.href = `webcal://${window.location.host}/api/calendar/division/${divisionId}`
  }

  const exportCsv = () => {
    const rows = matches.map(m => [
      fmtDate(m.match_date), m.round_id ?? '',
      m.home_team_name, m.away_team_name,
      m.is_finished ? (m.home_result ?? '') : '',
      m.is_finished ? (m.away_result ?? '') : '',
      m.is_finished ? 'Spelad' : 'Kommande',
    ])
    const csv = toCsv(['Datum', 'Omgång', 'Hemmalag', 'Bortalag', 'Hemma', 'Borta', 'Status'], rows)
    downloadText(`${fileStem(divisionName)}-${new Date().getFullYear()}.csv`, csv, 'text/csv')
  }

  const upcomingCount = matches.filter(m => !m.is_finished).length

  return (
    <div style={{ display: 'flex', gap: SPACE[2], marginTop: SPACE[4] }}>
      {session && (
        <ActionButton
          icon={<Heart size={20} strokeWidth={2} color={isFollowing ? COLOR.gold : COLOR.ink} fill={isFollowing ? COLOR.gold : 'none'} />}
          label={isFollowing ? 'Följer' : 'Följ'}
          accent={isFollowing ? COLOR.gold : undefined}
          onClick={() => toggleFollow()}
          disabled={isPending}
        />
      )}
      <ActionButton icon={<CalendarPlus size={20} strokeWidth={2} color={COLOR.ink} />} label="Kalender" onClick={subscribe} disabled={upcomingCount === 0} />
      <ActionButton icon={<Download size={20} strokeWidth={2} color={COLOR.ink} />} label="Export" onClick={exportCsv} disabled={matches.length === 0} />
    </div>
  )
}
