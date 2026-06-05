'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ChevronRight, Users } from 'lucide-react'
import { shortName } from '@/lib/utils'
import { cn } from '@/lib/cn'
import { teamAvatarStyle } from '@/lib/team-ui'

type Player = { id: string; name: string; team_id: string; teamName?: string }

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: ps } = await supabase.from('players').select('id, name, team_id').order('name')
      const { data: ts } = await supabase.from('teams').select('id, name')
      const teamMap: Record<string, string> = {}
      if (ts) ts.forEach((t: { id: string; name: string }) => { teamMap[t.id] = t.name })
      if (ps) setPlayers(ps.map((p: Player) => ({ ...p, teamName: teamMap[p.team_id] || '' })))
      setLoading(false)
    }
    load()
  }, [])

  const grouped = players.reduce((acc, p) => {
    const letter = p.name[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(p)
    return acc
  }, {} as Record<string, Player[]>)

  return (
    <main className="min-h-screen bg-light-bg font-sans dark:bg-dark-bg">
      <div className="mx-auto max-w-app">
        {loading && (
          <div className="flex flex-col gap-px px-4 pt-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="h-[34px] w-[34px] animate-pulse rounded-full bg-black/7 dark:bg-white/7" />
                <div className="h-3.5 flex-1 animate-pulse rounded bg-black/7 dark:bg-white/7" />
              </div>
            ))}
          </div>
        )}

        {!loading && players.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Users size={32} className="mx-auto mb-3 text-dark-muted" />
            <div className="mb-1.5 text-sm font-semibold bk-text-primary">Inga spelare registrerade</div>
            <div className="text-[13px] text-dark-muted">Spelare laggs till via live scoring i Admin</div>
          </div>
        )}

        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b, 'sv'))
          .map(([letter, letterPlayers]) => (
            <div key={letter}>
              <div className="border-b border-light-border px-4 pt-3 pb-1 text-[10px] font-extrabold tracking-[2px] text-dark-muted dark:border-dark-border">
                {letter}
              </div>
              {letterPlayers.map(p => {
                const hue = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                const tc = `hsl(${hue},50%,45%)`
                const tclo = `hsl(${hue},40%,92%)`
                const tcloDark = `hsl(${hue},40%,15%)`

                return (
                  <Link
                    key={p.id}
                    href={`/players/${p.id}`}
                    className={cn(
                      'flex items-center gap-3 border-b px-4 py-2.75 no-underline transition-colors',
                      'border-light-border hover:bg-light-card dark:border-dark-border dark:hover:bg-dark-card',
                    )}
                  >
                    <div
                      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold dark:hidden"
                      style={teamAvatarStyle(tc, tclo)}
                    >
                      {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div
                      className="hidden h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold dark:flex"
                      style={teamAvatarStyle(tc, tcloDark)}
                    >
                      {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium bk-text-primary">{p.name}</div>
                      {p.teamName ? (
                        <div className="text-[11px] text-dark-muted">{shortName(p.teamName)}</div>
                      ) : null}
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-dark-muted" />
                  </Link>
                )
              })}
            </div>
          ))}
      </div>
    </main>
  )
}
