'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import {
  COMPARE_SPRING,
  compareColorStyle,
  compareHeroGradient,
  compareHeroSideStyle,
  compareTeamBadgeStyle,
  compareTeamColors,
  compareVsLabel,
  teamInitials,
} from '@/lib/compare-ui'

export type CompareHeroTeam = {
  name: string
  city?: string | null
  href?: string
  isFavorite?: boolean
}

type Props = {
  team1: CompareHeroTeam
  team2?: CompareHeroTeam | null
  /** Split last word in team accent color (full compare page). */
  nameLayout?: 'compact' | 'split'
}

function TeamAvatar({
  name,
  dark,
  size = 'lg',
}: {
  name: string
  dark: boolean
  size?: 'lg' | 'md'
}) {
  const col = compareTeamColors(name, dark)
  const ini = teamInitials(name)
  const lg = size === 'lg'
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-2xl font-black',
        lg ? 'size-16 text-[17px]' : 'size-10 rounded-[10px] text-[11px]',
      )}
      style={compareTeamBadgeStyle(col, lg ? 'lg' : 'sm')}
    >
      {ini}
    </div>
  )
}

function TeamNameBlock({
  name,
  accentColor,
  layout,
}: {
  name: string
  accentColor: string
  layout: 'compact' | 'split'
}) {
  const sn = shortName(name)
  if (layout === 'compact') {
    return (
      <div className="text-center">
        <div className="text-sm font-black leading-tight text-light-text dark:text-dark-text">
          {sn}
        </div>
      </div>
    )
  }
  const words = sn.split(' ')
  const head = words.slice(0, -1).join(' ') || sn
  const tail = words.slice(-1)[0]
  return (
    <div className="text-center">
      <div className="text-[13px] font-black leading-tight text-light-text dark:text-dark-text">
        {head}
      </div>
      <div className="text-xs font-bold" style={compareColorStyle(accentColor)}>
        {tail}
      </div>
    </div>
  )
}

function TeamSide({
  team,
  dark,
  filled,
  align,
  delay,
  nameLayout,
}: {
  team: CompareHeroTeam
  dark: boolean
  filled: boolean
  align: 'left' | 'right'
  delay: number
  nameLayout: 'compact' | 'split'
}) {
  const col = compareTeamColors(team.name, dark)
  const content = (
    <>
      <TeamAvatar name={team.name} dark={dark} />
      <TeamNameBlock name={team.name} accentColor={col.border} layout={nameLayout} />
      {team.city && (
        <div className="mt-0.5 text-[10px] text-dark-muted">{team.city}</div>
      )}
    </>
  )

  return (
    <motion.div
      initial={{ x: align === 'left' ? -40 : 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ ...COMPARE_SPRING, delay }}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-2.5',
        align === 'left' ? 'pr-10 pl-5 pt-10 pb-5' : 'pl-10 pr-5 pt-10 pb-5',
      )}
      style={filled ? compareHeroSideStyle(col.bg, dark, align) : undefined}
    >
      {filled ? (
        <>
          {team.href ? (
            <a href={team.href} className="flex flex-col items-center gap-2 no-underline">
              {content}
            </a>
          ) : (
            <div className="flex flex-col items-center gap-2">{content}</div>
          )}
          {team.isFavorite && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...COMPARE_SPRING, delay: 0.6 }}
              className="rounded-[20px] border border-gold/30 bg-gold/[0.08] px-2.5 py-0.5 text-[9px] font-extrabold tracking-wide text-gold"
            >
              FAVORIT
            </motion.div>
          )}
        </>
      ) : (
        <>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn(
              'flex size-16 items-center justify-center rounded-2xl border-2 border-dashed text-[26px]',
              dark ? 'border-white/20 text-white/20' : 'border-black/15 text-black/15',
            )}
          >
            ?
          </motion.div>
          <div className="text-center text-xs font-semibold text-dark-muted">Välj ett lag</div>
        </>
      )}
    </motion.div>
  )
}

export function CompareSplitHero({ team1, team2, nameLayout = 'compact' }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div className="relative flex h-[220px] overflow-hidden">
      <TeamSide
        team={team1}
        dark={dark}
        filled
        align="left"
        delay={0.05}
        nameLayout={nameLayout}
      />

      {team2 ? (
        <TeamSide
          team={team2}
          dark={dark}
          filled
          align="right"
          delay={0.05}
          nameLayout={nameLayout}
        />
      ) : (
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ ...COMPARE_SPRING, delay: 0.05 }}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-2.5 pl-10 pr-5 pt-10 pb-5',
            dark ? 'bg-white/[0.03]' : 'bg-black/[0.03]',
          )}
        >
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn(
              'flex size-16 items-center justify-center rounded-2xl border-2 border-dashed text-[26px]',
              dark ? 'border-white/20 text-white/20' : 'border-black/15 text-black/15',
            )}
          >
            ?
          </motion.div>
          <div className="text-center text-xs font-semibold text-dark-muted">Välj ett lag</div>
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...COMPARE_SPRING, delay: 0.18 }}
        className={compareVsLabel}
      >
        VS
      </motion.div>

      <div
        className={cn(
          'absolute top-0 left-1/2 h-full w-px -translate-x-1/2',
          dark ? 'bg-white/[0.06]' : 'bg-black/[0.06]',
        )}
      />
    </div>
  )
}
