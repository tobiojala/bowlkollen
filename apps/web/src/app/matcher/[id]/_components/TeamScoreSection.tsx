import Link from 'next/link'
import FollowButton from '@/components/FollowButton'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { SCORE } from '@/lib/constants'

export type PlayerLine = { name: string; games: number[]; total: number; publicId: string | null; seasonAvg?: number | null }

type Props = {
  teamName:   string
  players:    PlayerLine[]
  serieCount: number
  total:      number
  isWinner:   boolean
  showDeltas?: boolean   // Pro: show each serie's delta vs the player's season snitt
}

// One team's full roster in a single contained card: the S1–S4/TOT header lives
// inside, columns are divided by hairlines, and each serie cell has room for the
// score + its snitt-delta. Names first-class, tabular figures aligned.
export function TeamScoreSection({ teamName, players, serieCount, total, isWinner, showDeltas }: Props) {
  const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `minmax(0,1fr) repeat(${serieCount}, 60px) 64px`,
    alignItems: 'stretch',
  }
  const colLabel: React.CSSProperties = {
    borderLeft: `1px solid ${COLOR.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: TYPE.micro, fontWeight: 700, color: COLOR.ink3, padding: `${SPACE[3]}px 0`,
  }

  return (
    <div style={{ marginBottom: SPACE[6] }}>
      <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
        {/* Team title bar — inside the card */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: `${SPACE[3]}px ${SPACE[4]}px`, borderBottom: `1px solid ${COLOR.hairline}` }}>
          <span style={{ fontSize: TYPE.body, fontWeight: 800, color: isWinner ? COLOR.ink : COLOR.ink2 }}>{teamName}</span>
          <span style={{ fontSize: 24, fontWeight: 800, fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums', color: isWinner ? COLOR.ink : COLOR.ink2 }}>{total}</span>
        </div>

        {/* Column header — inside the card */}
        <div style={{ ...grid, borderBottom: `1px solid ${COLOR.hairline}` }}>
          <span />
          {Array.from({ length: serieCount }, (_, i) => <span key={i} style={colLabel}>S{i + 1}</span>)}
          <span style={{ ...colLabel, paddingRight: SPACE[3] }}>TOT</span>
        </div>

        {players.map((p, ri) => (
          <div key={p.name} style={{ ...grid, borderTop: ri === 0 ? 'none' : `1px solid ${COLOR.hairline}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], minWidth: 0, padding: `${SPACE[3]}px 0 ${SPACE[3]}px ${SPACE[4]}px` }}>
              <span style={{ minWidth: 0, fontSize: TYPE.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.publicId
                  ? <Link href={`/players/${p.publicId}`} style={{ color: COLOR.ink, textDecoration: 'none' }}>{p.name}</Link>
                  : <span style={{ color: COLOR.ink }}>{p.name}</span>}
              </span>
              {p.publicId && <FollowButton entityType="player" entityId={p.publicId} variant="icon" size="sm" />}
            </div>

            {Array.from({ length: serieCount }, (_, gi) => {
              const raw = p.games[gi] ?? 0
              const played = raw > 0
              const delta = showDeltas && played && p.seasonAvg ? raw - p.seasonAvg : null
              return (
                <span key={gi} style={{ borderLeft: `1px solid ${COLOR.hairline}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${SPACE[3]}px 0` }}>
                  <span style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 700, color: !played ? COLOR.ink3 : raw >= SCORE.ELITE ? COLOR.gold : COLOR.ink2 }}>
                    {played ? raw : '–'}
                  </span>
                  {delta != null && (
                    <span style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 2, color: delta >= 0 ? COLOR.green : COLOR.ink3 }}>
                      {delta >= 0 ? '+' : '−'}{Math.abs(delta)}
                    </span>
                  )}
                </span>
              )
            })}

            <span style={{ borderLeft: `1px solid ${COLOR.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: SPACE[3], fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 800, color: COLOR.ink }}>
              {p.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
