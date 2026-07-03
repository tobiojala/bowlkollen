'use client'

import { COLOR } from '@/lib/brand'
import { useSearch, useMostFollowed, SEARCH_MIN } from './queries'
import { SectionLabel, PlayerRow, TeamRow, DivisionRow, FollowedRow } from './cards'

type Props = { query: string }

export function SearchResults({ query }: Props) {
  const { data: results, isLoading, divisions } = useSearch(query)
  const { data: mostFollowed = [] }             = useMostFollowed()

  if (query.trim().length < SEARCH_MIN) return null

  const noResults = !isLoading
    && results?.players.length === 0
    && results?.teams.length === 0
    && divisions.length === 0

  return (
    <>
      {isLoading && (
        <div style={{ color: COLOR.ink4, fontSize: 14, paddingTop: 24, textAlign: 'center' }}>Söker…</div>
      )}

      {noResults && (
        <>
          <div style={{ color: COLOR.ink4, fontSize: 14, paddingTop: 24, textAlign: 'center' }}>
            Inga resultat för &ldquo;{query}&rdquo;
          </div>
          <div style={{ color: COLOR.ink4, fontSize: 12, paddingTop: 6, textAlign: 'center' }}>
            Prova ett kortare sökord — eller upptäck någon ny:
          </div>
          {mostFollowed.length > 0 && (
            <>
              <SectionLabel label="Mest följda" />
              {mostFollowed.map(f => (
                <FollowedRow key={f.id} id={f.id} name={f.name}
                  clubName={f.clubName} followers={f.followers} />
              ))}
            </>
          )}
        </>
      )}

      {divisions.length > 0 && (
        <>
          <SectionLabel label="Divisioner" />
          {divisions.map(d => <DivisionRow key={d.id} d={d} />)}
        </>
      )}
      {results?.players && results.players.length > 0 && (
        <>
          <SectionLabel label="Spelare" />
          {results.players.map(p => <PlayerRow key={p.id} p={p} />)}
        </>
      )}
      {results?.teams && results.teams.length > 0 && (
        <>
          <SectionLabel label="Lag" />
          {results.teams.map(t => <TeamRow key={t.bitsTeamId} t={t} />)}
        </>
      )}
    </>
  )
}
