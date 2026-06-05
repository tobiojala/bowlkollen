'use client'

import { useTheme } from '@/components/ThemeProvider'
import { teamAvatarStyle, teamColors } from '@/lib/team-ui'

type Props = {
  name: string
  email: string
  avatarUrl?: string
}

export function ProfileUserCard({ name, email, avatarUrl }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const col = teamColors(email, dark)
  const initials = name?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="flex items-center gap-3.5 border-b border-light-border px-4 pt-5 pb-4 dark:border-dark-border">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="size-12 shrink-0 rounded-full border-2 border-light-border object-cover dark:border-dark-border"
        />
      ) : (
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold"
          style={teamAvatarStyle(col.accent, col.bg, 2)}
        >
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-bold text-light-text dark:text-dark-text">
          {name}
        </div>
        <p className="mt-0.5 text-xs text-dark-muted">{email}</p>
      </div>
    </div>
  )
}
