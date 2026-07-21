'use client'

import { COLOR, RADIUS, SPACE } from '@/lib/brand'
import { useTeamLineup } from '@/lib/queries'
import { shortName } from '@/lib/utils'
import type { MatchRow } from '@/lib/division-standings'

type Props = { teamId: number; nextMatch: MatchRow | null }

/** The published lineup for the next match — the fan-facing payoff of the
 * captain toolkit. Renders nothing until a captain actually publishes one
 * (get_team_lineup only returns a draft to verified teammates, so a public
 * visitor sees exactly this: nothing, then the real lineup once it's out). */
export function LagLineupPreview({ teamId, nextMatch }: Props) {
  const { data: lineup } = useTeamLineup(teamId, nextMatch?.bits_match_id ?? 0)
  if (!nextMatch || !lineup || lineup.status !== 'published') return null

  const boards = [1, 2, 3, 4].map(bord => ({
    bord,
    players: lineup.slots.filter(s => s.bord === bord && !s.isReserve).sort((a, b) => a.pos - b.pos),
  }))
  const reserves = lineup.slots.filter(s => s.isReserve)

  return (
    <div style={{ marginTop: SPACE[4] }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2, marginBottom: SPACE[2] }}>
        LAGUPPSTÄLLNING
      </div>
      <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
        {boards.map(b => (
          <div key={b.bord} style={{
            display: 'flex', alignItems: 'center', gap: SPACE[3],
            padding: `${SPACE[2]}px ${SPACE[3]}px`, borderTop: b.bord > 1 ? `1px solid ${COLOR.hairline}` : 'none',
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: COLOR.gold, width: 50, flexShrink: 0 }}>BORD {b.bord}</span>
            <span style={{ fontSize: 14, color: COLOR.ink, flex: 1 }}>{b.players.map(p => shortName(p.playerName)).join(' · ') || '—'}</span>
          </div>
        ))}
        {reserves.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[2]}px ${SPACE[3]}px`, borderTop: `1px solid ${COLOR.hairline}` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, width: 50, flexShrink: 0 }}>RESERV</span>
            <span style={{ fontSize: 14, color: COLOR.ink2, flex: 1 }}>{reserves.map(p => shortName(p.playerName)).join(' · ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
