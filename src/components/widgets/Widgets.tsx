'use client'

import React from 'react'
import {
  ChevronRight,
  Trophy,
  Calendar,
  Heart,
  BarChart2,
  Bell,
  FileText,
  User,
  Check,
  HelpCircle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { shortName, shortDiv, teamColor, teamInitials } from '@/lib/utils'
import {
  widgetShell,
  widgetLink,
  widgetEyebrow,
  widgetEyebrowGold,
  widgetEyebrowMuted,
  widgetEyebrowBlue,
  widgetEyebrowHeart,
  widgetEmpty,
  widgetYes,
  widgetNo,
  widgetIconMuted,
  widgetAvailMaybeBtn,
  widgetAvailNoBtn,
  widgetAvailYesBtn,
  widgetOutcomeBadgeClass,
  widgetTeamBadgeBorder2,
  widgetTeamBadgeStyle,
  widgetTierAccentClass,
  widgetTierBadgeClass,
  widgetTierBorderClass,
} from '@/lib/widget-ui'

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function calcRating(avg: number, best: number, over200: number) {
  if (!avg) return 0
  return Math.min(99, Math.round(avg * 0.4 + (best / 4 / 10) * 0.4 + over200 * 1.5))
}
function getTierLabel(r: number) {
  if (r >= 95) return 'LEGEND'
  if (r >= 85) return 'ELITE'
  if (r >= 75) return 'PRO'
  if (r >= 60) return 'VETERAN'
  return 'ROOKIE'
}

type WProps = { isDark: boolean; data: Record<string, unknown> }

export function NextMatchWidget({ isDark, data }: WProps) {
  const m = data.myNextMatch as Record<string, unknown> | undefined
  if (!m) {
    return (
      <div className={widgetShell()}>
        <div className={cn(widgetEyebrowGold, 'mb-2')}>NÄSTA MATCH</div>
        <div className={widgetEmpty}>Inga kommande matcher</div>
      </div>
    )
  }
  const myTeam = data.myTeam as { id?: string } | undefined
  const isHome = m.home_team_id === myTeam?.id
  const opp = (isHome ? m.away : m.home) as { name?: string } | undefined
  const tc = teamColor(opp?.name || '', isDark)

  const today = localDate(new Date())
  const tomorrow = localDate(new Date(Date.now() + 86400000))
  const mDate = (m.date as string).slice(0, 10)
  const days = Math.max(0, Math.round((new Date(mDate).getTime() - new Date(today).getTime()) / 86400000))
  const urgent = days <= 1
  const countdownLabel = mDate === today ? 'IDAG' : mDate === tomorrow ? 'IMORGON' : String(days)
  const countdownSub = mDate === today || mDate === tomorrow ? '' : days === 1 ? 'DAG' : 'DAGAR'

  return (
    <a
      href={'/matches/' + m.id}
      className={cn(
        widgetShell(),
        widgetLink,
        'border-gold/20 bg-gradient-to-br from-[#e8f4ff] to-[#ddeeff]',
        'dark:border-gold/15 dark:from-[#0d1a2e] dark:to-[#192540]',
      )}
    >
      <div className="mb-2.5 flex items-start justify-between">
        <div className={widgetEyebrowGold}>NÄSTA MATCH</div>
        <div className="text-[9px] text-dark-muted">{isHome ? 'HEMMA' : 'BORTA'}</div>
      </div>
      <div className="flex flex-1 items-center gap-2.5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[9px] font-extrabold"
          style={widgetTeamBadgeBorder2(tc)}
        >
          {teamInitials(opp?.name || '')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold bk-text-primary">{shortName(opp?.name || '')}</div>
          <div className="mt-0.5 text-[10px] text-dark-muted">
            {new Date(mDate + 'T12:00:00').toLocaleDateString('sv-SE', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </div>
          {!!m.division && (
            <div className="mt-px text-[9px] text-gold/70">{shortDiv(m.division as string)}</div>
          )}
        </div>
        <div
          className={cn(
            'min-w-[52px] shrink-0 rounded-[10px] px-2.5 py-1.5 text-center',
            urgent
              ? 'border border-gold/40 bg-gold/15'
              : 'border border-black/8 bg-black/4 dark:border-white/10 dark:bg-white/5',
          )}
        >
          <div
            className={cn(
              'leading-none font-black',
              countdownLabel.length > 4 ? 'text-[11px]' : 'text-xl',
              urgent ? 'text-gold' : 'bk-text-primary',
            )}
          >
            {countdownLabel}
          </div>
          {countdownSub && <div className="mt-px text-[7px] text-dark-muted">{countdownSub}</div>}
        </div>
      </div>
      <div className="mt-2.5 h-[3px] overflow-hidden rounded-sm bg-black/6 dark:bg-white/6">
        <div
          className="h-full rounded-sm bg-gradient-to-r from-gold to-gold/40"
          style={{ width: `${Math.max(5, Math.min(95, (1 - days / 14) * 100))}%` }}
        />
      </div>
    </a>
  )
}

export function LastResultWidget({ isDark, data }: WProps) {
  const m = data.myLastMatch as Record<string, unknown> | undefined
  if (!m) {
    return (
      <div className={widgetShell()}>
        <div className={cn(widgetEyebrowMuted, 'mb-2')}>SENASTE MATCH</div>
        <div className={widgetEmpty}>Inga resultat</div>
      </div>
    )
  }
  const myTeam = data.myTeam as { id?: string } | undefined
  const isHome = m.home_team_id === myTeam?.id
  const opp = (isHome ? m.away : m.home) as { name?: string } | undefined
  const myScore = (isHome ? m.home_score : m.away_score) as number
  const oppScore = (isHome ? m.away_score : m.home_score) as number
  const won = myScore > oppScore
  const drew = myScore === oppScore
  const rl = won ? 'V' : drew ? 'O' : 'F'
  const mDate = (m.date as string).slice(0, 10)
  const dateStr = new Date(mDate + 'T12:00:00').toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return (
    <a href={'/matches/' + m.id} className={cn(widgetShell(), widgetLink)}>
      <div className="mb-2 flex items-center justify-between">
        <div className={widgetEyebrowMuted}>SENASTE MATCH</div>
        <div className="text-[9px] text-dark-muted">{isHome ? 'HEMMA' : 'BORTA'}</div>
      </div>
      <div className="flex flex-1 items-center gap-2">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black',
            widgetOutcomeBadgeClass(won, drew),
          )}
        >
          {rl}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xl leading-none font-black bk-text-primary">
            {myScore} – {oppScore}
          </div>
          <div className="mt-0.5 truncate text-[10px] text-dark-muted">vs {shortName(opp?.name || '')}</div>
          <div className="mt-px text-[9px] text-dark-muted">{dateStr}</div>
        </div>
      </div>
    </a>
  )
}

export function StandingsWidget({ data }: WProps) {
  const myTeam = data.myTeam as { id?: string } | undefined
  const myTeamId = myTeam?.id
  const all = (data.standings as { team: { id: string; name: string }; points: number }[]) || []
  const myPos = myTeamId ? all.findIndex(r => r.team.id === myTeamId) : -1

  type RowEntry = { row: (typeof all)[0] | null; pos: number; ellipsis?: true }
  let rows: RowEntry[]
  if (myPos >= 4) {
    rows = [
      { row: all[0], pos: 0 },
      { row: all[1], pos: 1 },
      { row: null, pos: -1, ellipsis: true },
      { row: all[myPos], pos: myPos },
    ]
  } else {
    rows = all.slice(0, 4).map((r, i) => ({ row: r, pos: i }))
  }

  return (
    <a href="/league" className={cn(widgetShell(), widgetLink)}>
      <div className="mb-2 flex items-center justify-between">
        <div className={widgetEyebrowBlue}>ELITSERIEN H</div>
        <ChevronRight size={12} className={widgetIconMuted} />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1">
        {rows.map(({ row, pos, ellipsis }) => {
          if (ellipsis) {
            return (
              <div key="ellipsis" className="text-center text-[10px] leading-none tracking-[3px] text-dark-muted">
                ···
              </div>
            )
          }
          if (!row) return null
          const isMe = myTeamId && row.team.id === myTeamId
          return (
            <div
              key={row.team.id}
              className={cn(
                'flex items-center gap-1.5',
                isMe && '-mx-1 rounded-md bg-gold/9 px-1 py-0.5',
              )}
            >
              <div
                className={cn(
                  'w-3.5 text-[10px] font-bold',
                  pos < 2 ? 'text-gold' : 'text-dark-muted',
                )}
              >
                {pos + 1}
              </div>
              <div
                className={cn(
                  'min-w-0 flex-1 truncate text-[11px]',
                  isMe && 'font-bold text-gold',
                  !isMe && pos === 0 && 'font-semibold bk-text-primary',
                  !isMe && pos !== 0 && 'text-dark-muted',
                )}
              >
                {shortName(row.team.name)}
              </div>
              <div
                className={cn(
                  'text-[11px] font-bold',
                  isMe && 'text-gold',
                  !isMe && pos < 2 && 'text-gold',
                  !isMe && pos >= 2 && 'text-dark-muted',
                )}
              >
                {row.points}p
              </div>
            </div>
          )
        })}
      </div>
    </a>
  )
}

export function MyStatsWidget({ isDark, data }: WProps) {
  const stats = data.myStats as { avg?: number; best?: number; over200?: number; matches?: number } | undefined
  const player = data.myPlayer as { id: string } | undefined
  if (!stats || !player) {
    return (
      <a href="/profile" className={cn(widgetShell(), widgetLink)}>
        <div className={cn(widgetEyebrowMuted, 'mb-2')}>MIN STATISTIK</div>
        <div className={cn(widgetEmpty, 'flex-col gap-1.5')}>
          <User size={24} className={widgetIconMuted} />
          <span>Claima din spelarprofil</span>
        </div>
      </a>
    )
  }
  const rating = calcRating(stats.avg || 0, stats.best || 0, stats.over200 || 0)
  const tl = getTierLabel(rating)
  const tierAccent = widgetTierAccentClass(rating)
  return (
    <a
      href={'/players/' + player.id}
      className={cn(widgetShell(), widgetLink, widgetTierBorderClass(rating))}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <div className={cn(widgetEyebrow, tierAccent)}>MIN STATISTIK</div>
        <div className={cn('rounded-md px-1.5 py-0.5 text-[8px] font-bold', widgetTierBadgeClass(rating))}>
          {tl}
        </div>
      </div>
      <div className={cn('mb-1 text-[30px] leading-none font-black', tierAccent)}>
        {stats.avg || '—'}
      </div>
      <div className="mb-2 text-[9px] text-dark-muted">SNITT · {stats.matches} MATCHER</div>
      <div className="mt-auto flex gap-1.5">
        {[
          { l: 'BÄSTA', v: stats.best || '—' },
          { l: '200+', v: stats.over200 },
        ].map(s => (
          <div
            key={s.l}
            className={cn(
              'flex-1 rounded-lg px-1 py-1.25 text-center',
              isDark ? 'bg-black/20' : 'bg-black/4',
            )}
          >
            <div className="text-[13px] font-bold bk-text-primary">{s.v}</div>
            <div className="mt-px text-[7px] text-dark-muted">{s.l}</div>
          </div>
        ))}
      </div>
    </a>
  )
}

export function AvailabilityWidget({
  isDark,
  data,
  onRespond,
}: WProps & { onRespond: (r: string) => void }) {
  const m = data.availabilityMatch as Record<string, unknown> | undefined
  const myResponse = data.availabilityStatus as string | undefined
  const myTeam = data.myTeam as { id: string } | undefined
  const teamId = myTeam?.id
  if (!m || !teamId) {
    return (
      <div className={widgetShell()}>
        <div className={cn(widgetEyebrowMuted, 'mb-2')}>TILLGÄNGLIGHET</div>
        <div className={widgetEmpty}>Inga matcher</div>
      </div>
    )
  }
  const isHome = m.home_team_id === teamId
  const opp = (isHome ? m.away : m.home) as { name?: string } | undefined
  const counts = data.availabilityCounts as { yes: number; maybe: number; no: number } | undefined

  return (
    <div
      className={cn(
        widgetShell(),
        'border-gold/25 bg-gold/4 dark:border-gold/20 dark:bg-gold/6',
      )}
    >
      <div className={cn(widgetEyebrowGold, 'mb-1.5')}>TILLGÄNGLIGHET</div>
      <div className="mb-0.5 text-xs font-semibold bk-text-primary">vs {shortName(opp?.name || '')}</div>
      <div className="mb-2.5 text-[10px] text-dark-muted">
        {new Date(m.date as string).toLocaleDateString('sv-SE', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        })}
      </div>
      {myResponse ? (
        <div>
          <div className="mb-2 flex items-center gap-2">
            {myResponse === 'yes' && (
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                  'border-[#3d6090] bg-[#3d6090]/13 dark:border-[#5a82b4] dark:bg-[#5a82b4]/13',
                )}
              >
                <Check size={16} className={widgetYes} />
              </div>
            )}
            {myResponse === 'maybe' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-gold/13">
                <HelpCircle size={16} className="text-gold" />
              </div>
            )}
            {myResponse === 'no' && (
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                  'border-[#d63b3b] bg-[#d63b3b]/13 dark:border-[#e05555] dark:bg-[#e05555]/13',
                )}
              >
                <X size={16} className={widgetNo} />
              </div>
            )}
            <div>
              <div
                className={cn(
                  'text-xs font-semibold',
                  myResponse === 'yes' && widgetYes,
                  myResponse === 'maybe' && 'text-gold',
                  myResponse === 'no' && widgetNo,
                )}
              >
                {myResponse === 'yes' ? 'Du spelar!' : myResponse === 'maybe' ? 'Kanske' : 'Kan inte'}
              </div>
              <a
                href={'/team/' + teamId + '/tillganglighet/' + m.id}
                className="text-[10px] text-dark-muted no-underline"
              >
                Ändra →
              </a>
            </div>
          </div>
          {counts && (
            <div className="flex gap-1.5 text-[10px] text-dark-muted">
              <span className={cn('font-semibold', widgetYes)}>{counts.yes} ja</span>
              <span>·</span>
              <span className="font-semibold text-gold">{counts.maybe} kanske</span>
              <span>·</span>
              <span className={cn('font-semibold', widgetNo)}>{counts.no} nej</span>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-1.5 flex gap-1.5">
            {[
              { k: 'yes', l: 'Ja', btn: widgetAvailYesBtn },
              { k: 'maybe', l: '?', btn: widgetAvailMaybeBtn },
              { k: 'no', l: 'Nej', btn: widgetAvailNoBtn },
            ].map(r => (
              <button key={r.k} type="button" onClick={() => onRespond(r.k)} className={r.btn}>
                {r.l}
              </button>
            ))}
          </div>
          {counts && counts.yes + counts.maybe + counts.no > 0 && (
            <div className="flex gap-1.5 text-[10px] text-dark-muted">
              <span className={cn('font-semibold', widgetYes)}>{counts.yes} ja</span>
              <span>·</span>
              <span className="font-semibold text-gold">{counts.maybe} kanske</span>
              <span>·</span>
              <span className={cn('font-semibold', widgetNo)}>{counts.no} nej</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function TeamFeedWidget({ isDark, data }: WProps) {
  const posts = (data.teamPosts as { id: string; post_type: string; content: string }[]) || []
  const team = data.myTeam as { id: string } | undefined
  if (!team) return null
  return (
    <a href={'/team/' + team.id + '/intern'} className={cn(widgetShell(), widgetLink)}>
      <div className="mb-2 flex items-center justify-between">
        <div className={widgetEyebrowMuted}>LAGFEED</div>
        <ChevronRight size={12} className={widgetIconMuted} />
      </div>
      {posts.length === 0 ? (
        <div className={widgetEmpty}>Inga inlägg än</div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {posts.slice(0, 2).map(p => (
            <div
              key={p.id}
              className={cn(
                'mb-2 border-b pb-2',
                isDark ? 'border-white/6' : 'border-black/6',
              )}
            >
              <div
                className={cn(
                  'mb-0.5 text-[9px] font-bold',
                  p.post_type === 'lineup' ? 'text-gold' : 'text-[#1d9e75]',
                )}
              >
                {p.post_type === 'lineup' ? 'LAGUTTAGNING' : 'NYHET'}
              </div>
              <div className="line-clamp-2 text-xs leading-snug bk-text-primary">{p.content}</div>
            </div>
          ))}
        </div>
      )}
    </a>
  )
}

export function UpcomingWidget({ isDark, data }: WProps) {
  const upcoming = (data.upcoming as Record<string, unknown>[]) || []
  return (
    <a href="/schema" className={cn(widgetShell(), widgetLink)}>
      <div className="mb-2 flex items-center justify-between">
        <div className={widgetEyebrowMuted}>KOMMANDE</div>
        <ChevronRight size={12} className={widgetIconMuted} />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        {upcoming.slice(0, 3).map(m => {
          const home = m.home as { name?: string } | undefined
          const away = m.away as { name?: string } | undefined
          const hc = teamColor(home?.name || '', isDark)
          const ac = teamColor(away?.name || '', isDark)
          return (
            <div key={m.id as string} className="flex items-center gap-1.25">
              <div
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-[5px] font-extrabold"
                style={widgetTeamBadgeStyle(hc)}
              >
                {teamInitials(home?.name || '')}
              </div>
              <div className="min-w-0 flex-1 truncate text-[10px] text-dark-muted">
                {shortName(home?.name || '')} – {shortName(away?.name || '')}
              </div>
              <div
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-[5px] font-extrabold"
                style={widgetTeamBadgeStyle(ac)}
              >
                {teamInitials(away?.name || '')}
              </div>
            </div>
          )
        })}
      </div>
    </a>
  )
}

export function RecentResultsWidget({ isDark, data }: WProps) {
  const recentResults = (data.recentResults as Record<string, unknown>[]) || []
  return (
    <a href="/schema" className={cn(widgetShell(), widgetLink)}>
      <div className="mb-2 flex items-center justify-between">
        <div className={widgetEyebrowMuted}>SENASTE RESULTAT</div>
        <ChevronRight size={12} className={widgetIconMuted} />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.25">
        {recentResults.slice(0, 4).map(m => {
          const home = m.home as { name?: string } | undefined
          const away = m.away as { name?: string } | undefined
          const hc = teamColor(home?.name || '', isDark)
          const ac = teamColor(away?.name || '', isDark)
          const hw = (m.home_score as number) > (m.away_score as number)
          const aw = (m.away_score as number) > (m.home_score as number)
          return (
            <div key={m.id as string} className="flex items-center gap-1">
              <div
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-[5px] font-extrabold"
                style={widgetTeamBadgeStyle(hc)}
              >
                {teamInitials(home?.name || '')}
              </div>
              <div className="min-w-0 flex-1 truncate text-[9px] text-dark-muted">
                {shortName(home?.name || '')}
              </div>
              <div className="min-w-8 text-center text-[11px] font-extrabold">
                <span className={hw ? 'text-gold' : 'text-dark-muted'}>{m.home_score as number}</span>
                <span className="text-[9px] text-dark-muted">–</span>
                <span className={aw ? 'text-gold' : 'text-dark-muted'}>{m.away_score as number}</span>
              </div>
              <div className="min-w-0 flex-1 truncate text-right text-[9px] text-dark-muted">
                {shortName(away?.name || '')}
              </div>
              <div
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-[5px] font-extrabold"
                style={widgetTeamBadgeStyle(ac)}
              >
                {teamInitials(away?.name || '')}
              </div>
            </div>
          )
        })}
      </div>
    </a>
  )
}

export function FavTeamsWidget({ isDark, data }: WProps) {
  const teams = (data.favTeams as Record<string, unknown>[]) || []
  if (!teams.length) {
    return (
      <a href="/teams" className={cn(widgetShell(), widgetLink)}>
        <div className={cn(widgetEyebrowHeart, 'mb-2')}>FAVORITLAG</div>
        <div className={cn(widgetEmpty, 'flex-col gap-1.5')}>
          <Heart size={22} className={widgetIconMuted} />
          <span>Följ lag för att se dem här</span>
        </div>
      </a>
    )
  }
  return (
    <a href="/teams" className={cn(widgetShell(), widgetLink)}>
      <div className={cn(widgetEyebrowHeart, 'mb-2')}>FAVORITLAG</div>
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        {teams.slice(0, 3).map(t => {
          const tc = teamColor(t.name as string, isDark)
          const m = t.lastResult as Record<string, unknown> | undefined
          const isHome = m?.home_team_id === t.id
          const myScore = (isHome ? m?.home_score : m?.away_score) as number | undefined
          const oppScore = (isHome ? m?.away_score : m?.home_score) as number | undefined
          return (
            <div key={t.id as string} className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[6px] font-extrabold"
                style={widgetTeamBadgeBorder2(tc)}
              >
                {teamInitials(t.name as string)}
              </div>
              <div className="min-w-0 flex-1 truncate text-[11px] font-semibold bk-text-primary">
                {shortName(t.name as string)}
              </div>
              {m && myScore != null && oppScore != null && (
                <div
                  className={cn(
                    'text-[11px] font-bold',
                    myScore > oppScore ? 'text-gold' : 'text-dark-muted',
                  )}
                >
                  {myScore}–{oppScore}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </a>
  )
}

export const WIDGET_REGISTRY = [
  { id: 'next_match', label: 'Nästa match', desc: 'Nedräkning till nästa match', icon: Calendar, requiresTeam: true },
  { id: 'last_result', label: 'Senaste match', desc: 'Ditt lags senaste resultat', icon: Trophy, requiresTeam: true },
  { id: 'standings', label: 'Serietabell', desc: 'Elitserien topp 4', icon: BarChart2 },
  { id: 'my_stats', label: 'Min statistik', desc: 'Ditt snitt och tier', icon: User, requiresPlayer: true },
  { id: 'availability', label: 'Tillgänglighet', desc: 'Svara direkt från startsidan', icon: Bell, requiresTeam: true },
  { id: 'team_feed', label: 'Lagfeed', desc: 'Senaste från ditt lag', icon: FileText, requiresTeam: true },
  { id: 'upcoming', label: 'Kommande matcher', desc: 'Nästa matcher', icon: Calendar },
  { id: 'recent_results', label: 'Senaste resultat', desc: 'Nyliga matchresultat', icon: Trophy },
  { id: 'fav_teams', label: 'Favoritlag', desc: 'Dina följda lag', icon: Heart },
]
