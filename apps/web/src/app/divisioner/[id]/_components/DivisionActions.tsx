'use client'

import { Heart, CalendarPlus, ListOrdered } from 'lucide-react'
import { useSession, useIsFollowing, useToggleFollow } from '@/lib/queries'
import { DownloadMenu, type CsvScope } from '@/components/DownloadMenu'
import { COLOR, SPACE } from '@/lib/brand'
import { toCsv, downloadText, fileStem } from '@/lib/csv'
import type { MatchRow } from '@/lib/division-standings'

type Props = {
  divisionId:   number
  divisionName: string
  matches:      MatchRow[]
  onShowTable:  () => void
}

const ghost = (accent?: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '6px 2px', background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 14, fontWeight: 600, color: accent ?? COLOR.ink2,
  WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
})

function fmtDate(iso: string) {
  return new Date(iso + (iso.length <= 10 ? 'T12:00:00' : '')).toLocaleString('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export function DivisionActions({ divisionId, divisionName, matches, onShowTable }: Props) {
  const { data: session }        = useSession()
  const isFollowing              = useIsFollowing('division', String(divisionId))
  const { mutate: toggleFollow, isPending } = useToggleFollow('division', String(divisionId))

  const subscribe = () => {
    window.location.href = `webcal://${window.location.host}/api/calendar/division/${divisionId}`
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
    downloadText(`${fileStem(divisionName)}-${new Date().getFullYear()}${suffix}.csv`, csv, 'text/csv')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[6], flexWrap: 'wrap', marginTop: SPACE[4] }}>
      <button onClick={onShowTable} style={ghost(COLOR.ink)}>
        <ListOrdered size={16} strokeWidth={2} color={COLOR.ink} />
        Tabell
      </button>

      {session && (
        <button onClick={() => toggleFollow()} disabled={isPending} style={ghost(isFollowing ? COLOR.gold : COLOR.ink2)}>
          <Heart size={16} strokeWidth={2} color={isFollowing ? COLOR.gold : COLOR.ink2} fill={isFollowing ? COLOR.gold : 'none'} />
          {isFollowing ? 'Följer' : 'Följ'}
        </button>
      )}

      <button onClick={subscribe} style={ghost()}>
        <CalendarPlus size={16} strokeWidth={2} color={COLOR.ink2} />
        Kalender
      </button>

      <DownloadMenu onPick={downloadCsv} />
    </div>
  )
}
