'use client'

import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import { teamColors } from '@/lib/team-ui'
import { teamInitials } from '@/lib/compare-ui'
import { clubTeamBadgeColor, clubTeamPathLabel, type ClubTeam } from '@/lib/club-ui'

type Props = {
  team: ClubTeam
  clubSlug: string
}

function TeamAvatar({ name, dark }: { name: string; dark: boolean }) {
  const col = teamColors(name, dark)
  const ini = teamInitials(name)

  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-[10px] text-[10px] font-extrabold"
      style={{
        background: col.bg,
        border: `1.5px solid ${col.accent}`,
        color: col.accent,
      }}
    >
      {ini}
    </div>
  )
}

export function ClubTeamRow({ team, clubSlug }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const badgeColor = clubTeamBadgeColor(team.name)
  const label = clubTeamPathLabel(team.team_path)
  const url = team.team_path
    ? `/${clubSlug}/${team.team_path}`
    : `/teams/${team.id}`

  return (
    <a
      href={url}
      className={cn(
        'flex items-center gap-3 border-b border-light-border px-5 py-3.5 no-underline',
        'transition-colors hover:bg-light-card dark:border-dark-border dark:hover:bg-dark-card',
      )}
    >
      <TeamAvatar name={team.name} dark={dark} />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold text-light-text dark:text-dark-text">
          {shortName(team.name)}
        </div>
        {team.team_path && (
          <p className="mt-0.5 text-[11px] text-dark-muted">
            bowlkollen.vercel.app/{clubSlug}/{team.team_path}
          </p>
        )}
      </div>
      <span
        className="shrink-0 rounded-md px-2.5 py-0.5 text-[11px] font-bold"
        style={{ color: badgeColor, background: `${badgeColor}18` }}
      >
        {label}
      </span>
      <span className="text-base text-dark-muted">›</span>
    </a>
  )
}
