'use client'

import { Trophy, Map as MapIcon } from 'lucide-react'
import { COLOR } from '@/lib/brand'
import { useRecentPlayers, useTopSeries, useMostFollowed } from './queries'
import { SectionLabel, PlayerCard, SeriesRow, FollowedRow, EntryCard } from './cards'

/** Discover's default state: curated shelves, not just recency.
 * Shelves backed by not-yet-applied RPCs fail soft and simply don't render. */
export function Shelves() {
  const { data: recent = [], isLoading: recentLoading }   = useRecentPlayers()
  const { data: topSeries = [] }                          = useTopSeries()
  const { data: mostFollowed = [] }                       = useMostFollowed()

  return (
    <>
      {/* Entry points */}
      <SectionLabel label="Seriespel" />
      <EntryCard href="/divisioner"
        icon={<Trophy size={20} color={COLOR.gold} strokeWidth={1.8} />}
        title="Alla divisioner"
        subtitle="Elitserien · Allsvenskan · Division 1–5" />
      <EntryCard href="/schema/atlas/karta"
        icon={<MapIcon size={20} color={COLOR.gold} strokeWidth={1.8} />}
        title="Utforska säsongen som karta"
        subtitle="Hela Sverige · divisioner · omgångar" />

      {/* Veckans serier — the week's best results, gold reserved for #1 */}
      {topSeries.length > 0 && (
        <>
          <SectionLabel label="Veckans serier" />
          {topSeries.map((s, i) => (
            <SeriesRow key={s.id} rank={i + 1} id={s.id} name={s.name}
              clubName={s.clubName} total={s.total} venue={s.venue} />
          ))}
        </>
      )}

      {/* Mest följda */}
      {mostFollowed.length > 0 && (
        <>
          <SectionLabel label="Mest följda" />
          {mostFollowed.map(f => (
            <FollowedRow key={f.id} id={f.id} name={f.name}
              clubName={f.clubName} followers={f.followers} />
          ))}
        </>
      )}

      {/* Aktiva spelare — recency as the last shelf, not the whole page */}
      <SectionLabel label="Aktiva spelare" />
      {recentLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton"
              style={{ height: 148, borderRadius: 16, background: COLOR.surface }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
          {recent.map(p => <PlayerCard key={p.id} p={p} />)}
        </div>
      )}
    </>
  )
}
