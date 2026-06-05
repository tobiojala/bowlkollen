'use client'

import { useState } from 'react'
import { User } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { teamColors } from '@/lib/team-ui'
import { sllmPlayerInitials } from '@/lib/sllm-data'

type Player = { id: string; name: string; teamName?: string }

type Claim = {
  id: string
  player_id: string
  status: string
  players: { name: string; team_id: string }
}

type Props = {
  claim: Claim | null
  teams: Record<string, string>
  onClaimChange: (claim: Claim | null) => void
}

const inputClass = cn(
  'min-w-0 flex-1 rounded-[10px] border border-light-border bg-light-surface px-3 py-2 text-[13px] outline-none',
  'text-light-text placeholder:text-dark-muted dark:border-dark-border dark:bg-dark-surface dark:text-dark-text',
)

export function ProfilePlayerClaim({ claim, teams, onClaimChange }: Props) {
  const [searching, setSearching] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<Player[]>([])
  const [claiming, setClaiming] = useState(false)

  const search = async () => {
    if (!searchQ.trim()) return
    const { data } = await createClient()
      .from('players')
      .select('id, name, team_id')
      .ilike('name', `%${searchQ}%`)
      .limit(10)
    setSearchResults(
      data?.map((p: { id: string; name: string; team_id: string }) => ({
        ...p,
        teamName: teams[p.team_id] || '',
      })) || [],
    )
  }

  const claimPlayer = async (player: Player) => {
    setClaiming(true)
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data, error } = await supabase
      .from('player_claims')
      .insert({ user_id: session.user.id, player_id: player.id, status: 'pending' })
      .select('id, player_id, status, players:player_id(name, team_id)')
      .single()
    if (!error && data) {
      onClaimChange(data as unknown as Claim)
      setSearching(false)
      setSearchResults([])
      setSearchQ('')
    }
    setClaiming(false)
  }

  const removeClaim = async () => {
    if (!claim) return
    await createClient().from('player_claims').delete().eq('id', claim.id)
    onClaimChange(null)
  }

  const playerName = claim ? (claim.players as { name: string })?.name : null

  return (
    <div className="border-b border-light-border dark:border-dark-border">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <User size={18} className="shrink-0 text-dark-muted" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-light-text dark:text-dark-text">
            Spelarprofil
          </div>
          <p className="mt-px text-xs text-dark-muted">
            {claim ? `Kopplad till ${playerName}` : 'Länka till din spelarprofil'}
          </p>
        </div>
        {!claim && !searching && (
          <button
            type="button"
            onClick={() => setSearching(true)}
            className="cursor-pointer rounded-lg bg-gold px-3.5 py-[7px] text-xs font-bold text-[#1a1400]"
          >
            Koppla
          </button>
        )}
        {claim && (
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-[10px] font-bold',
              claim.status === 'verified'
                ? 'bg-green/15 text-green'
                : 'bg-gold/15 text-gold',
            )}
          >
            {claim.status === 'verified' ? 'Verifierad' : 'Väntar'}
          </span>
        )}
      </div>

      {searching && !claim && (
        <div className="px-4 pb-4">
          <p className="mb-2.5 text-xs text-dark-muted">
            Sök efter ditt namn i bowlingregistret:
          </p>
          <div className="mb-3 flex gap-2">
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Ditt namn..."
              className={inputClass}
            />
            <button
              type="button"
              onClick={search}
              className="cursor-pointer rounded-[10px] bg-gold px-4 py-2 text-[13px] font-bold text-[#1a1400]"
            >
              Sök
            </button>
          </div>
          {searchResults.map(p => (
            <SearchResultRow
              key={p.id}
              player={p}
              claiming={claiming}
              onClaim={() => claimPlayer(p)}
            />
          ))}
          {searchResults.length === 0 && searchQ && (
            <p className="py-2 text-xs text-dark-muted">
              Inga spelare hittades — prova ett annat namn
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setSearching(false)
              setSearchResults([])
              setSearchQ('')
            }}
            className="mt-2 cursor-pointer border-none bg-transparent p-0 text-xs text-dark-muted"
          >
            Avbryt
          </button>
        </div>
      )}

      {claim && (
        <div className="flex items-center gap-2.5 px-4 pb-3.5">
          <a
            href={`/players/${claim.player_id}`}
            className="flex-1 text-[13px] font-semibold text-gold no-underline"
          >
            Se min spelarprofil →
          </a>
          <button
            type="button"
            onClick={removeClaim}
            className="cursor-pointer rounded-lg border border-light-border bg-transparent px-2.5 py-[5px] text-[11px] text-dark-muted dark:border-dark-border"
          >
            Ta bort
          </button>
        </div>
      )}
    </div>
  )
}

function SearchResultRow({
  player,
  claiming,
  onClaim,
}: {
  player: Player
  claiming: boolean
  onClaim: () => void
}) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const col = teamColors(player.name, dark)
  const ini = sllmPlayerInitials(player.name)

  return (
    <div className="mb-1.5 flex items-center gap-2.5 rounded-[10px] border border-light-border bg-light-surface p-2.5 dark:border-dark-border dark:bg-dark-surface">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{
          background: col.bg,
          border: `1.5px solid ${col.accent}`,
          color: col.accent,
        }}
      >
        {ini}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-light-text dark:text-dark-text">
          {player.name}
        </div>
        {player.teamName && (
          <p className="text-[11px] text-dark-muted">{player.teamName}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClaim}
        disabled={claiming}
        className="cursor-pointer rounded-lg bg-gold px-3 py-1.5 text-[11px] font-bold text-[#1a1400] disabled:opacity-70"
      >
        Det är jag
      </button>
    </div>
  )
}
