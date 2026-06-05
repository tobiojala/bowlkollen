'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { shortName } from '@/lib/utils'
import WidgetGrid from '@/components/widgets/WidgetGrid'
import { ProfilePageSkeleton } from '@/components/profile/ProfilePageSkeleton'
import { ProfileUserCard } from '@/components/profile/ProfileUserCard'
import { ProfileSectionHeader } from '@/components/profile/ProfileSectionHeader'
import { ProfilePlayerClaim } from '@/components/profile/ProfilePlayerClaim'
import { ProfileClubClaims, type ClubClaim } from '@/components/profile/ProfileClubClaims'
import { ProfileSignOut } from '@/components/profile/ProfileSignOut'

type Claim = {
  id: string
  player_id: string
  status: string
  players: { name: string; team_id: string }
}

export default function ProfilePage() {
  const [user, setUser] = useState<{
    email?: string
    user_metadata?: { avatar_url?: string; full_name?: string }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [claim, setClaim] = useState<Claim | null>(null)
  const [teams, setTeams] = useState<Record<string, string>>({})
  const [clubClaims, setClubClaims] = useState<ClubClaim[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        window.location.href = '/login'
        return
      }
      setUser(session.user)

      const { data: claimData } = await supabase
        .from('player_claims')
        .select('id, player_id, status, players:player_id(name, team_id)')
        .eq('user_id', session.user.id)
        .single()
      if (claimData) setClaim(claimData as unknown as Claim)

      const { data: clubClaimData } = await supabase
        .from('club_claims')
        .select('id, team_id, role, status, teams:team_id(name, club)')
        .eq('user_id', session.user.id)
      if (clubClaimData) setClubClaims(clubClaimData as unknown as ClubClaim[])

      const { data: teamsData } = await supabase.from('teams').select('id, name')
      if (teamsData) {
        const map: Record<string, string> = {}
        teamsData.forEach((t: { id: string; name: string }) => {
          map[t.id] = shortName(t.name)
        })
        setTeams(map)
      }

      setLoading(false)
    })
  }, [])

  const signOut = async () => {
    await createClient().auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <ProfilePageSkeleton />

  const name = user?.user_metadata?.full_name || user?.email || ''
  const email = user?.email || ''

  return (
    <main className="min-h-screen bg-light-bg pb-12 font-sans text-light-text dark:bg-dark-bg dark:text-dark-text">
      <div className="mx-auto max-w-app">
        <ProfileUserCard
          name={name}
          email={email}
          avatarUrl={user?.user_metadata?.avatar_url}
        />

        <WidgetGrid />

        <ProfileSectionHeader label="KONTO" />

        <ProfilePlayerClaim claim={claim} teams={teams} onClaimChange={setClaim} />

        <ProfileClubClaims clubClaims={clubClaims} onClubClaimsChange={setClubClaims} />

        <ProfileSignOut onSignOut={signOut} />
      </div>
    </main>
  )
}
