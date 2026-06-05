import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { shortName } from '@/lib/utils'
import { divisionDotStyle } from '@/lib/match-ui'

type Props = {
  playerName: string
  teamName: string
  total: number
  playerId: string | null
  divisionColor: string
}

export function MatchBestPlayer({ playerName, teamName, total, playerId, divisionColor }: Props) {
  return (
    <div className="border-t border-light-border dark:border-dark-border">
      <div className="flex items-center gap-2 border-b border-light-border px-4 py-3 pb-1 dark:border-dark-border">
        <div className="h-2 w-2 rounded-sm" style={divisionDotStyle(divisionColor)} />
        <span className="text-[10px] font-extrabold tracking-widest text-dark-muted">BÄSTA SPELARE</span>
      </div>
      <div className="flex items-center gap-3 border-b border-light-border px-4 py-3 dark:border-dark-border">
        <Trophy size={16} className="text-gold" />
        <div className="flex-1">
          {playerId ? (
            <Link href={`/players/${playerId}`} className="text-sm font-bold text-gold no-underline">
              {playerName}
            </Link>
          ) : (
            <div className="text-sm font-bold bk-text-primary">{playerName}</div>
          )}
          <div className="mt-0.5 text-[11px] text-dark-muted">{shortName(teamName)}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black leading-none text-gold tabular-nums">{total}</div>
          <div className="text-[9px] tracking-wide text-dark-muted">PINS</div>
        </div>
      </div>
    </div>
  )
}
