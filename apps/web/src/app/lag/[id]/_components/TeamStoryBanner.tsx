'use client'

import { COLOR, SPACE, RADIUS, TYPE } from '@/lib/brand'
import { buildTeamNarrativeInput, type MatchRow, type TeamStanding } from '@/lib/division-standings'
import { computeTeamNarrative, NARRATIVE_COLOR, NARRATIVE_ICON } from '@/lib/team-narrative'

type Props = {
  teamId:    number
  matches:   MatchRow[]
  standings: TeamStanding[]
}

/** The season's story, not just its number — "3 poäng från serieledning"
 * reads very differently to a fan or sponsor than a bare table position. */
export function TeamStoryBanner({ teamId, matches, standings }: Props) {
  const narrative = computeTeamNarrative(buildTeamNarrativeInput(teamId, matches, standings))
  if (!narrative.headline) return null

  const color = NARRATIVE_COLOR[narrative.archetype]
  const Icon  = NARRATIVE_ICON[narrative.archetype]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: SPACE[3],
      marginTop: SPACE[4], borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px`,
      background: `${color}18`, border: `1px solid ${color}40`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}22`,
      }}>
        <Icon size={17} strokeWidth={2.2} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.35, color: COLOR.ink }}>
          {narrative.headline}
        </div>
        {narrative.subtext && (
          <div style={{ marginTop: 2, fontSize: TYPE.caption, color: COLOR.ink3 }}>{narrative.subtext}</div>
        )}
      </div>
    </div>
  )
}
