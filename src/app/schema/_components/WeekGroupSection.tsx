import { COLOR, FONT } from '@/lib/brand'
import { MatchCard } from './MatchCard'
import type { Match } from './types'

const MONTHS_SHORT = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
const DAYS_LONG    = ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag']
const today        = new Date().toISOString().slice(0, 10)

export type WeekGroup = {
  weekKey: string
  hasLive: boolean
  dates:   { date: string; matches: Match[] }[]
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  if (dateStr === today) return 'Idag'
  const tom = new Date(); tom.setDate(tom.getDate() + 1)
  if (dateStr === tom.toISOString().slice(0, 10)) return 'Imorgon'
  return `${DAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

function fmtWeekHero(weekKey: string): { range: string; month: string } {
  const start = new Date(weekKey + 'T12:00:00')
  const end = new Date(start); end.setDate(end.getDate() + 6)
  return { range: `${start.getDate()}–${end.getDate()}`, month: MONTHS_SHORT[end.getMonth()].toUpperCase() }
}

type Props = { group: WeekGroup; currentWeek: string; activeWeek: string | null }

export function WeekGroupSection({ group: g, currentWeek, activeWeek }: Props) {
  const isCurrent = g.weekKey === currentWeek
  const isActive  = g.weekKey === activeWeek
  const multiDate = g.dates.length > 1
  const hero      = fmtWeekHero(g.weekKey)

  return (
    <div id={`week-${g.weekKey}`} data-week={g.weekKey}>
      <div style={{ padding: '20px 20px 4px', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <span style={{
          fontFamily: FONT.display,
          fontSize: 40, fontWeight: 900, lineHeight: 1,
          color: isCurrent ? COLOR.gold : isActive ? COLOR.ink2 : COLOR.ink4,
          transition: 'color 0.25s',
        }}>
          {hero.range}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
          textTransform: 'uppercase' as const,
          color: isCurrent ? COLOR.gold : COLOR.ink4,
          paddingBottom: 8, transition: 'color 0.25s',
        }}>
          {hero.month}
        </span>
      </div>

      {g.dates.map(({ date, matches: dayMs }) => (
        <div key={date}>
          {multiDate && (
            <div style={{ padding: '10px 20px 2px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, letterSpacing: 0.5 }}>
                {fmtDate(date)}
              </span>
            </div>
          )}
          {dayMs.map(m => <MatchCard key={m.bitsMatchId} m={m} />)}
        </div>
      ))}
    </div>
  )
}
