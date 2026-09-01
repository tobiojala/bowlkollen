'use client'

import { Sheet } from '@/components/mockup/Sheet'
import { rhythmLabel, narrativeParagraph } from '../../helpers'
import type { ProfileData } from '@/lib/profile'

interface SeasonSheetProps {
  data: ProfileData
  firstName: string
  onClose: () => void
}

// "Säsongen i korthet" — the season narrative, now its own sheet (opened from the
// Säsongen action circle) so it leaves the main profile scroll.
export default function SeasonSheet({ data, firstName, onClose }: SeasonSheetProps) {
  const allGames = data.matches.flatMap(m => m.games.filter(g => g > 0))
  const narrative = narrativeParagraph({
    firstName,
    seasonAvg: data.seasonAvg,
    lastSeasonAvg: data.lastSeasonAvg,
    formDiff: data.formDiff,
    hitRate: data.hitRate,
    streakAboveAvg: data.streakAvg.current,
    consistency: data.consistency,
    rhythmLabel: rhythmLabel(data.gameAvgs).label,
    bestSeries: data.bestSeries,
    games200Plus: data.over200,
    totalGames: allGames.length,
  })

  return (
    <Sheet title="Säsongen i korthet" subtitle={`${data.matches.length} matcher · snitt ${data.seasonAvg}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {narrative.map((sentence, i) => (
          <p key={i} style={{ margin: 0, lineHeight: 1.6,
            fontSize: i === 0 ? 15 : 14,
            fontWeight: i === 0 ? 500 : 400,
            color: i === 0 ? 'rgba(244,245,247,0.88)' : i < 3 ? 'rgba(244,245,247,0.6)' : 'rgba(244,245,247,0.45)' }}>
            {sentence}
          </p>
        ))}
      </div>
    </Sheet>
  )
}
