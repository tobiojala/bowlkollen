'use client'

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { teamColors } from '@/lib/team-ui'
import { profileRoleLabel } from '@/lib/profile-ui'

export type ClubClaim = {
  id: string
  team_id: string
  role: string
  status: string
  teams: { name: string; club: string }
}

type TeamResult = {
  id: string
  name: string
  club: string
  city: string | null
}

type Props = {
  clubClaims: ClubClaim[]
  onClubClaimsChange: (claims: ClubClaim[]) => void
}

const inputClass = cn(
  'min-w-0 flex-1 rounded-[10px] border border-light-border bg-light-surface px-3 py-2 text-[13px] outline-none',
  'text-light-text placeholder:text-dark-muted dark:border-dark-border dark:bg-dark-surface dark:text-dark-text',
)

const ROLES = [
  { key: 'captain', label: 'Kapten' },
  { key: 'admin', label: 'Admin' },
  { key: 'board', label: 'Styrelse' },
] as const

export function ProfileClubClaims({ clubClaims, onClubClaimsChange }: Props) {
  const [searchingClub, setSearchingClub] = useState(false)
  const [clubSearchQ, setClubSearchQ] = useState('')
  const [clubSearchResults, setClubSearchResults] = useState<TeamResult[]>([])
  const [claimingClub, setClaimingClub] = useState(false)
  const [selectedRole, setSelectedRole] = useState('captain')

  const searchClubs = async () => {
    if (!clubSearchQ.trim()) return
    const { data } = await createClient()
      .from('teams')
      .select('id, name, club, city')
      .ilike('club', `%${clubSearchQ}%`)
      .limit(10)
    setClubSearchResults((data as TeamResult[]) || [])
  }

  const claimClub = async (team: TeamResult) => {
    setClaimingClub(true)
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data, error } = await supabase
      .from('club_claims')
      .insert({
        user_id: session.user.id,
        team_id: team.id,
        role: selectedRole,
        status: 'pending',
      })
      .select('id, team_id, role, status, teams:team_id(name, club)')
      .single()
    if (!error && data) {
      onClubClaimsChange([...clubClaims, data as unknown as ClubClaim])
      setSearchingClub(false)
      setClubSearchResults([])
      setClubSearchQ('')
    }
    setClaimingClub(false)
  }

  const removeClubClaim = async (claimId: string) => {
    await createClient().from('club_claims').delete().eq('id', claimId)
    onClubClaimsChange(clubClaims.filter(c => c.id !== claimId))
  }

  return (
    <div className="border-b border-light-border dark:border-dark-border">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <Trophy size={18} className="shrink-0 text-dark-muted" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-light-text dark:text-dark-text">
            Mina klubbar
          </div>
          <p className="mt-px text-xs text-dark-muted">
            {clubClaims.length > 0
              ? `${clubClaims.length} lag registrerade`
              : 'Koppla till din klubb eller ditt lag'}
          </p>
        </div>
        {!searchingClub && (
          <button
            type="button"
            onClick={() => setSearchingClub(true)}
            className="cursor-pointer rounded-lg bg-gold px-3.5 py-[7px] text-xs font-bold text-[#1a1400]"
          >
            + Lägg till
          </button>
        )}
      </div>

      {clubClaims.map(cc => (
        <div
          key={cc.id}
          className="flex items-center gap-2.5 border-t border-light-border px-4 py-2.5 dark:border-dark-border"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-light-text dark:text-dark-text">
              {cc.teams?.club || cc.teams?.name}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="rounded-md border border-light-border bg-light-surface px-2 py-0.5 text-[10px] font-bold text-dark-muted dark:border-dark-border dark:bg-dark-surface">
                {profileRoleLabel(cc.role)}
              </span>
              <span
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] font-bold',
                  cc.status === 'verified'
                    ? 'bg-green/15 text-green'
                    : 'bg-gold/15 text-gold',
                )}
              >
                {cc.status === 'verified' ? 'Verifierad' : 'Väntar'}
              </span>
            </div>
          </div>
          <a
            href={`/teams/${cc.team_id}`}
            className="mr-2 text-xs font-semibold text-gold no-underline"
          >
            Se sida →
          </a>
          <button
            type="button"
            onClick={() => removeClubClaim(cc.id)}
            className="cursor-pointer rounded-lg border border-light-border bg-transparent px-2.5 py-[5px] text-[11px] text-dark-muted dark:border-dark-border"
          >
            Ta bort
          </button>
        </div>
      ))}

      {searchingClub && (
        <div className="border-t border-light-border px-4 pb-4 dark:border-dark-border">
          <p className="my-3 text-xs text-dark-muted">Sök efter din klubb:</p>
          <div className="mb-2.5 flex gap-1.5">
            {ROLES.map(r => (
              <button
                key={r.key}
                type="button"
                onClick={() => setSelectedRole(r.key)}
                className={cn(
                  'flex-1 cursor-pointer rounded-lg border px-2 py-[7px] text-xs font-semibold',
                  selectedRole === r.key
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-light-border text-dark-muted dark:border-dark-border',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="mb-3 flex gap-2">
            <input
              value={clubSearchQ}
              onChange={e => setClubSearchQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchClubs()}
              placeholder="Klubbnamn..."
              className={inputClass}
            />
            <button
              type="button"
              onClick={searchClubs}
              className="cursor-pointer rounded-[10px] bg-gold px-4 py-2 text-[13px] font-bold text-[#1a1400]"
            >
              Sök
            </button>
          </div>
          {clubSearchResults.map(t => (
            <ClubSearchRow
              key={t.id}
              team={t}
              alreadyClaimed={clubClaims.some(cc => cc.team_id === t.id)}
              claimingClub={claimingClub}
              onClaim={() => claimClub(t)}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              setSearchingClub(false)
              setClubSearchResults([])
              setClubSearchQ('')
            }}
            className="mt-2 cursor-pointer border-none bg-transparent p-0 text-xs text-dark-muted"
          >
            Avbryt
          </button>
        </div>
      )}
    </div>
  )
}

function ClubSearchRow({
  team,
  alreadyClaimed,
  claimingClub,
  onClaim,
}: {
  team: TeamResult
  alreadyClaimed: boolean
  claimingClub: boolean
  onClaim: () => void
}) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const col = teamColors(team.club, dark)
  const ini = team.club
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
          {team.club}
        </div>
        {team.city && <p className="text-[11px] text-dark-muted">{team.city}</p>}
      </div>
      <button
        type="button"
        onClick={onClaim}
        disabled={claimingClub || alreadyClaimed}
        className={cn(
          'rounded-lg px-3 py-1.5 text-[11px] font-bold',
          alreadyClaimed
            ? 'cursor-default border border-light-border bg-light-surface text-dark-muted dark:border-dark-border dark:bg-dark-surface'
            : 'cursor-pointer bg-gold text-[#1a1400] disabled:opacity-70',
        )}
      >
        {alreadyClaimed ? 'Redan kopplat' : 'Det är mitt lag'}
      </button>
    </div>
  )
}
