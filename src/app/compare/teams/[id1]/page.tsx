'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { ComparePageSkeleton } from '@/components/compare/ComparePageSkeleton'
import { CompareBackLink } from '@/components/compare/CompareBackLink'
import { CompareSplitHero } from '@/components/compare/CompareSplitHero'
import { TeamCompareSearch } from '@/components/compare/TeamCompareSearch'

type Props = { params: Promise<{ id1: string }> }
type Team = { id: string; name: string; city: string | null }

export default function TeamPickerPage({ params }: Props) {
  const [id1, setId1] = useState<string | null>(null)
  const [team1, setTeam1] = useState<Team | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => setId1(p.id1))
  }, [params])

  useEffect(() => {
    if (!id1) return
    createClient()
      .from('teams')
      .select('id,name,city')
      .eq('id', id1)
      .single()
      .then(({ data }) => {
        if (data) setTeam1(data as Team)
        setLoading(false)
      })
  }, [id1])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const t = setTimeout(() => {
      createClient()
        .from('teams')
        .select('id,name,city')
        .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
        .neq('id', id1 ?? '')
        .order('name')
        .limit(8)
        .then(({ data }) => setResults((data || []) as Team[]))
    }, 200)
    return () => clearTimeout(t)
  }, [query, id1])

  if (loading || !team1 || !id1) return <ComparePageSkeleton />

  return (
    <main className="min-h-screen bg-light-bg font-sans text-light-text dark:bg-dark-bg dark:text-dark-text">
      <CompareBackLink href={`/teams/${id1}`}>← Tillbaka</CompareBackLink>

      <CompareSplitHero team1={{ name: team1.name, city: team1.city }} />

      <TeamCompareSearch
        id1={id1}
        query={query}
        onQueryChange={setQuery}
        results={results}
      />
    </main>
  )
}
