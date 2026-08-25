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

// One team's full roster, sorted by total — the exact data BITS' own
// authoritative match-results endpoint returns, so every player's full
// per-serie line and identity is unambiguous (no "Bord N" grouping needed).
export function TeamScoreSection({ teamName, players, serieCount, total, isWinner, showDeltas }: Props) {
  return (
    <div style={{ marginBottom: SPACE[6] }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: SPACE[3],
      }}>
        <span style={{ fontSize: TYPE.body, fontWeight: 800, color: isWinner ? COLOR.ink : COLOR.ink3 }}>
          {teamName}
        </span>
        <span style={{
          fontSize: 24, fontWeight: 800, fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums',
          color: isWinner ? COLOR.ink : COLOR.ink3,
        }}>
          {total}
        </span>
      </div>

      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `0 ${SPACE[3]}px`, marginBottom: SPACE[1] }}>
        <div style={{ flex: 1, minWidth: 0 }} />
        <div style={{ display: 'flex', gap: SPACE[2] }}>
          {Array.from({ length: serieCount }, (_, i) => (
            <span key={i} style={{ width: 36, textAlign: 'center', fontSize: TYPE.micro, fontWeight: 700, color: COLOR.ink4 }}>
              S{i + 1}
            </span>
          ))}
        </div>
        <span style={{ width: 44, textAlign: 'right', fontSize: TYPE.micro, fontWeight: 700, color: COLOR.ink4 }}>TOT</span>
      </div>

      <div style={{
        background: COLOR.surface, borderRadius: RADIUS.md,
        padding: `${SPACE[2]}px ${SPACE[4]}px`,
      }}>
        {players.map((p, i) => (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[3]}px 0`,
            borderTop: i === 0 ? 'none' : `1px solid ${COLOR.hairline}`,
          }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: TYPE.body, display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.publicId ? (
                  <Link href={`/players/${p.publicId}`} style={{ color: COLOR.ink, textDecoration: 'none' }}>{p.name}</Link>
                ) : (
                  <span style={{ color: COLOR.ink }}>{p.name}</span>
                )}
              </span>
              {p.publicId && <FollowButton entityType="player" entityId={p.publicId} variant="icon" size="sm" />}
            </div>
            <div style={{ display: 'flex', gap: SPACE[2] }}>
              {Array.from({ length: serieCount }, (_, gi) => {
                const raw = p.games[gi] ?? 0
                const played = raw > 0            // 0 / missing = didn't bowl that serie (sub)
                const delta = showDeltas && played && p.seasonAvg ? raw - p.seasonAvg : null
                return (
                  <span key={gi} style={{ width: 36, display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 15, fontVariantNumeric: 'tabular-nums',
                      color: !played ? COLOR.ink4 : raw >= SCORE.ELITE ? COLOR.gold : COLOR.ink2,
                    }}>
                      {played ? raw : '–'}
                    </span>
                    {delta != null && (
                      <span style={{ fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: delta >= 0 ? COLOR.green : COLOR.ink4 }}>
                        {delta >= 0 ? '+' : '−'}{Math.abs(delta)}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
            <span style={{
              width: 44, textAlign: 'right', fontSize: 20, fontWeight: 800,
              fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', color: COLOR.ink,
            }}>
              {p.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
