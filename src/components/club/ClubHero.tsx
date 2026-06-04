'use client'

import { useTheme } from '@/components/ThemeProvider'
import { teamColors } from '@/lib/team-ui'
import { clubHeroGradient, clubInitials } from '@/lib/club-ui'

type Props = {
  club: string
  city: string | null
  clubSlug: string
  teamCount: number
}

export function ClubHero({ club, city, clubSlug, teamCount }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const col = teamColors(club, dark)
  const ini = clubInitials(club)

  return (
    <div className="px-5 pt-6 pb-5" style={{ background: clubHeroGradient(dark) }}>
      <a
        href="/teams"
        className="mb-5 inline-flex items-center gap-1 text-xs text-dark-muted no-underline"
      >
        ← Alla lag
      </a>
      <div className="flex items-center gap-4">
        <div
          className="flex size-[68px] shrink-0 items-center justify-center rounded-2xl text-lg font-black"
          style={{
            background: col.bg,
            border: `2.5px solid ${col.accent}`,
            color: col.accent,
          }}
        >
          {ini}
        </div>
        <div>
          <h1 className="mb-1 text-[22px] font-black text-light-text dark:text-dark-text">
            {club}
          </h1>
          <div className="flex items-center gap-1.5">
            {city && <span className="text-xs text-dark-muted">{city}</span>}
            <span className="text-[11px] text-dark-muted">{teamCount} lag</span>
          </div>
          <p className="mt-1.5 text-[11px] text-dark-muted">
            bowlkollen.vercel.app/{clubSlug}
          </p>
        </div>
      </div>
    </div>
  )
}
