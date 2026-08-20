'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Search, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useBitsTeamName } from '@/lib/team-stats-data'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'

type Props = { params: Promise<{ id1: string }> }
type Hit = { bits_team_id: number; name: string; club_name: string | null }

function useTeamSearch(query: string) {
  const q = query.trim()
  return useQuery<Hit[]>({
    queryKey: ['team-compare-search', q],
    enabled: q.length >= 2,
    queryFn: async () => {
      const { data } = await createClient()
        .from('bits_teams')
        .select('bits_team_id, name, club_name')
        .or(`name.ilike.%${q}%,club_name.ilike.%${q}%`)
        .limit(20)
      return (data as Hit[]) ?? []
    },
  })
}

export default function ComparePickerPage({ params }: Props) {
  const { id1 } = use(params)
  const idA = Number(id1)
  const router = useRouter()
  const { data: nameA } = useBitsTeamName(idA)

  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => { const t = setTimeout(() => setQ(text), 220); return () => clearTimeout(t) }, [text])
  const { data: results = [], isFetching } = useTeamSearch(q)

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: `${SPACE[6]}px ${SPACE[4]}px 96px` }}>
        <Link href={`/lag/${idA}/statistik`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: TYPE.caption, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4] }}>
          <ChevronLeft size={15} /> Statistik
        </Link>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: 4 }}>JÄMFÖR LAG</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: `0 0 ${SPACE[6]}px` }}>{nameA ?? 'Laget'} mot…</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px`, marginBottom: SPACE[4] }}>
          <Search size={16} color={COLOR.ink3} />
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Sök lag att jämföra med…" autoFocus
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: COLOR.ink, fontSize: 16 }} />
        </div>

        {isFetching && <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, textAlign: 'center', padding: SPACE[4] }}>Söker…</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.filter(r => r.bits_team_id !== idA).map(r => (
            <button key={r.bits_team_id} onClick={() => router.push(`/compare/teams/${idA}/${r.bits_team_id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], textAlign: 'left', width: '100%', cursor: 'pointer',
                background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px`, color: COLOR.ink }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: COLOR.ink }}>{r.name}</span>
                {r.club_name && r.club_name !== r.name && <span style={{ display: 'block', fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 2 }}>{r.club_name}</span>}
              </span>
              <ChevronRight size={16} color={COLOR.ink3} />
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
