'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useToggleFollow } from '@/lib/queries'
import { COLOR, SPACE, TYPE, RADIUS } from '@/lib/brand'
import { QUERY } from '@/lib/constants'

type TeamHit = { bitsTeamId: number; name: string; clubName: string | null }

export default function TeamPicker({ onPicked }: { onPicked: (id: number, name: string) => void }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<TeamHit[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (query.trim().length < QUERY.SEARCH_MIN_CHARS) { setResults([]); setSearching(false); return }
    setSearching(true)
    const t = setTimeout(async () => {
      const { data } = await createClient()
        .from('bits_teams')
        .select('bits_team_id,name,club_name')
        .or(`name.ilike.%${query.trim()}%,club_name.ilike.%${query.trim()}%`)
        .limit(20)
      setResults((data ?? []).map(row => ({ bitsTeamId: row.bits_team_id, name: row.name, clubName: row.club_name })))
      setSearching(false)
    }, 220)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: SPACE[2],
        background: COLOR.surface2, border: `1px solid ${COLOR.hairline}`,
        borderRadius: RADIUS.md, padding: '10px 14px',
      }}>
        <Search size={15} color={COLOR.ink3} />
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Sök ditt lag..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: COLOR.ink, fontSize: TYPE.body }}
        />
      </div>
      {searching && (
        <div style={{ padding: SPACE[4], textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.caption }}>Söker…</div>
      )}
      {!searching && query.trim().length >= QUERY.SEARCH_MIN_CHARS && results.length === 0 && (
        <div style={{ padding: SPACE[4], textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.caption }}>Inga lag hittades</div>
      )}
      {!searching && results.map(team => (
        <TeamPickRow key={team.bitsTeamId} team={team} onPicked={onPicked} />
      ))}
    </div>
  )
}

function TeamPickRow({ team, onPicked }: { team: TeamHit; onPicked: (id: number, name: string) => void }) {
  const { mutate } = useToggleFollow('team', String(team.bitsTeamId))
  return (
    <button
      onClick={() => { mutate(); onPicked(team.bitsTeamId, team.name) }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%',
        padding: '12px 14px', background: 'transparent', border: 'none',
        borderBottom: `1px solid ${COLOR.hairline}`, cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink }}>{team.name}</span>
      {team.clubName && team.clubName !== team.name && (
        <span style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{team.clubName}</span>
      )}
    </button>
  )
}
