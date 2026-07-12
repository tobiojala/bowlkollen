'use client'

import { CalendarPlus } from 'lucide-react'
import { DownloadMenu, type CsvScope } from '@/components/DownloadMenu'
import { COLOR, SPACE } from '@/lib/brand'
import { toCsv, downloadText, fileStem } from '@/lib/csv'
import type { Match } from '@/lib/types'

type Props = {
  teamId:   string
  teamName: string
  matches:  Match[]
}

const ghost: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '6px 2px', background: 'none', border: 'none',
  color: COLOR.ink3, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
}

export function TeamActions({ teamId, teamName, matches }: Props) {
  const subscribe = () => {
    window.location.href = `webcal://${window.location.host}/api/calendar/team/${teamId}`
  }

  const downloadCsv = (scope: CsvScope) => {
    const isPlayed = (m: Match) => m.status === 'completed'
    const picked = scope === 'upcoming' ? matches.filter(m => !isPlayed(m))
                 : scope === 'played'   ? matches.filter(isPlayed)
                 : matches
    const done = (m: Match) => isPlayed(m) && m.home_score !== null
    const rows = picked.map(m => [
      m.date.slice(0, 10),
      m.home.name,
      m.away.name,
      done(m) ? (m.home_score ?? '') : '',
      done(m) ? (m.away_score ?? '') : '',
      m.division,
      isPlayed(m) ? 'Spelad' : 'Kommande',
    ])
    const csv = toCsv(
      ['Datum', 'Hemmalag', 'Bortalag', 'Hemma', 'Borta', 'Division', 'Status'],
      rows,
    )
    const suffix = scope === 'all' ? '' : `-${scope === 'upcoming' ? 'kommande' : 'spelade'}`
    downloadText(`${fileStem(teamName)}-${new Date().getFullYear()}${suffix}.csv`, csv, 'text/csv')
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[2] }}>
      <button onClick={subscribe} style={ghost}>
        <CalendarPlus size={15} strokeWidth={2} color={COLOR.ink3} />
        Kalender
      </button>
      <DownloadMenu onPick={downloadCsv} />
    </div>
  )
}
