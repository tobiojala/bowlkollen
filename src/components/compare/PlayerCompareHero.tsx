'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import {
  COMPARE_SPRING,
  compareColorStyle,
  compareHeroSideStyle,
  comparePlayerAvatarBorder,
  comparePlayerAvatarStyle,
  compareTeamColors,
  compareVsLabel,
} from '@/lib/compare-ui'

export type PlayerCompareHeroPlayer = {
  id: string
  name: string
  avatar_url: string | null
}

export type PlayerCompareHeroSide = {
  player: PlayerCompareHeroPlayer
  teamName?: string | null
  href?: string
  isWinner?: boolean
}

type Props = {
  player1: PlayerCompareHeroSide
  player2: PlayerCompareHeroSide
}

function PlayerAvatar({
  player,
  borderColor,
  bgColor,
}: {
  player: PlayerCompareHeroPlayer
  borderColor: string
  bgColor: string
}) {
  const ini = player.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (player.avatar_url) {
    return (
      <img
        src={player.avatar_url}
        alt={player.name}
        className="size-[68px] rounded-full object-cover"
        style={comparePlayerAvatarBorder(borderColor)}
      />
    )
  }

  return (
    <div
      className="flex size-[68px] items-center justify-center rounded-full text-xl font-black"
      style={comparePlayerAvatarStyle(borderColor, bgColor)}
    >
      {ini}
    </div>
  )
}

function PlayerSide({
  side,
  dark,
  align,
  delay,
}: {
  side: PlayerCompareHeroSide
  dark: boolean
  align: 'left' | 'right'
  delay: number
}) {
  const col = compareTeamColors(side.player.name, dark)
  const parts = side.player.name.split(' ')
  const first = parts[0]
  const rest = parts.slice(1).join(' ')

  const block = (
    <>
      <PlayerAvatar player={side.player} borderColor={col.border} bgColor={col.bg} />
      <div className="text-center">
        <div className="text-[15px] font-black leading-tight text-light-text dark:text-dark-text">
          {first}
        </div>
        {rest && (
          <div className="text-xs font-bold leading-snug" style={compareColorStyle(col.border)}>
            {rest}
          </div>
        )}
        {side.teamName && (
          <div className="mt-0.5 text-[10px] text-dark-muted">{shortName(side.teamName)}</div>
        )}
      </div>
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
      style={compareHeroSideStyle(col.bg, dark, align)}
    >
      {side.href ? (
        <a href={side.href} className="flex flex-col items-center gap-2.5 no-underline">
          {block}
        </a>
      ) : (
        <div className="flex flex-col items-center gap-2.5">{block}</div>
      )}
      {side.isWinner && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...COMPARE_SPRING, delay: 0.6 }}
          className="rounded-[20px] border border-gold/30 bg-gold/[0.08] px-2.5 py-0.5 text-[9px] font-extrabold tracking-wide text-gold"
        >
          VINNER
        </motion.div>
      )}
    </motion.div>
  )
}

export function PlayerCompareHero({ player1, player2 }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div className="relative flex h-[230px] overflow-hidden">
      <PlayerSide side={player1} dark={dark} align="left" delay={0.05} />
      <PlayerSide side={player2} dark={dark} align="right" delay={0.05} />

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
