'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ClubPageSkeleton } from '@/components/club/ClubPageSkeleton'
import { ClubHero } from '@/components/club/ClubHero'
import { ClubTeamRow } from '@/components/club/ClubTeamRow'
import type { ClubTeam } from '@/lib/club-ui'

type Props = { params: Promise<{ club_slug: string }> }

export default function ClubPage({ params }: Props) {
  const [clubSlug, setClubSlug] = useState<string | null>(null)
  const [teams, setTeams] = useState<ClubTeam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => setClubSlug(p.club_slug))
  }, [params])

  useEffect(() => {
    if (!clubSlug) return
    createClient()
      .from('teams')
      .select('id, name, club, city, club_slug, team_path')
      .eq('club_slug', clubSlug)
      .order('name')
      .then(({ data }) => {
        if (data) setTeams(data as ClubTeam[])
        setLoading(false)
      })
  }, [clubSlug])

  if (loading) return <ClubPageSkeleton />

  if (teams.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
        <p className="text-dark-muted">Klubb hittades inte</p>
      </main>
    )
  }

  const club = teams[0].club
  const city = teams[0].city

  return (
    <main className="min-h-screen bg-light-bg pb-12 font-sans text-light-text dark:bg-dark-bg dark:text-dark-text">
      <div className="mx-auto max-w-app">
        <ClubHero
          club={club}
          city={city}
          clubSlug={clubSlug!}
          teamCount={teams.length}
        />

        <div className="px-5 pt-4 pb-2 text-[10px] font-extrabold tracking-[2px] text-dark-muted uppercase">
          LAGETS LAG
        </div>

        {teams.map(t => (
          <ClubTeamRow key={t.id} team={t} clubSlug={clubSlug!} />
        ))}
      </div>
    </main>
  )
}
