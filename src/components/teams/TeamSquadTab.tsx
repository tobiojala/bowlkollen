'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { teamAvatarStyle, teamColors } from '@/lib/team-ui'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

type Player = { id: string; name: string }

type PlayerStats = { avg: number; matches: number; high: number }

type Props = {
  players: Player[]
  playerStats: Record<string, PlayerStats>
  dark: boolean
}

export function TeamSquadTab({ players, playerStats, dark }: Props) {
  if (players.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <User size={28} className="mx-auto mb-3 text-dark-muted" />
        <p className="mb-1.5 text-sm font-semibold bk-text-primary">Inga spelare registrerade</p>
        <p className="text-[13px] text-dark-muted">Spelare läggs till när live scoring används</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {players.map((p, idx) => {
        const stats = playerStats[p.id]
        const { accent: ptc, bg: ptclo } = teamColors(p.name, dark)
        const ini = p.name
          .split(' ')
          .map(w => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: idx * 0.04 }}
          >
            <Link
              href={`/players/${p.id}`}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-[18px] border border-light-border px-3 pt-5 pb-4 text-center no-underline',
                dark ? 'bg-white/4' : 'bg-white',
                'dark:border-dark-border',
              )}
            >
              <div
                className="mb-1 flex h-[54px] w-[54px] items-center justify-center rounded-full text-[15px] font-extrabold"
                style={teamAvatarStyle(ptc, ptclo, 2)}
              >
                {ini}
              </div>
              <div className="text-[13px] font-bold leading-snug bk-text-primary">{p.name}</div>
              {stats && stats.avg > 0 ? (
                <div className="mt-1 flex flex-col items-center gap-0.5">
                  <div className="text-[26px] font-black leading-none text-gold">{stats.avg}</div>
                  <div className="mt-0.5 text-[9px] tracking-widest text-dark-muted">SNITT</div>
                  <div className="mt-1 flex gap-2">
                    <div className="text-center">
                      <div className="text-[11px] font-bold bk-text-primary">{stats.high}</div>
                      <div className="text-[8px] tracking-wide text-dark-muted">BÄST</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] font-bold bk-text-primary">{stats.matches}</div>
                      <div className="text-[8px] tracking-wide text-dark-muted">MATCHER</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-sm text-dark-muted">—</div>
              )}
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
