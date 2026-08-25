import Link from 'next/link'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { SCORE } from '@/lib/constants'

export type PlayerLine = { name: string; games: number[]; total: number; publicId: string | null }

type Props = {
  teamName:   string
  players:    PlayerLine[]
  serieCount: number
  total:      number
  isWinner:   boolean
}

// One team's full roster, sorted by total — the exact data BITS' own
// authoritative match-results endpoint returns, so every player's full
// per-serie line and identity is unambiguous (no "Bord N" grouping needed).
export function TeamScoreSection({ teamName, players, serieCount, total, isWinner }: Props) {
  return (
    <div style={{ marginBottom: SPACE[6] }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: SPACE[3],
      }}>
        <span style={{ fontSize: TYPE.caption, fontWeight: 800, color: isWinner ? COLOR.ink : COLOR.ink3 }}>
          {teamName}
        </span>
        <span style={{
          fontSize: 15, fontWeight: 800, fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums',
          color: isWinner ? COLOR.ink : COLOR.ink3,
        }}>
          {total}
        </span>
      </div>

      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], padding: `0 ${SPACE[3]}px`, marginBottom: SPACE[1] }}>
        <div style={{ flex: 1, minWidth: 0 }} />
        <div style={{ display: 'flex', gap: SPACE[2] }}>
          {Array.from({ length: serieCount }, (_, i) => (
            <span key={i} style={{ width: 28, textAlign: 'center', fontSize: 9, fontWeight: 700, color: COLOR.ink4 }}>
              S{i + 1}
            </span>
          ))}
        </div>
        <span style={{ width: 34, textAlign: 'right', fontSize: 9, fontWeight: 700, color: COLOR.ink4 }}>TOT</span>
      </div>

      <div style={{
        background: COLOR.surface, borderRadius: RADIUS.md,
        border: `1px solid ${COLOR.hairline}`,
        padding: `${SPACE[2]}px ${SPACE[3]}px`,
      }}>
        {players.map((p, i) => (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'center', gap: SPACE[2], padding: '5px 0',
            borderTop: i === 0 ? 'none' : `1px solid ${COLOR.hairline}`,
          }}>
            <div style={{
              flex: 1, minWidth: 0, fontSize: TYPE.caption,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {p.publicId ? (
                <Link href={`/players/${p.publicId}`} style={{ color: COLOR.ink, textDecoration: 'none' }}>
                  {p.name}
                </Link>
              ) : (
                <span style={{ color: COLOR.ink }}>{p.name}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: SPACE[2] }}>
              {Array.from({ length: serieCount }, (_, gi) => {
                const g = p.games[gi] ?? null
                return (
                  <span key={gi} style={{
                    width: 28, textAlign: 'center', fontSize: TYPE.caption, fontVariantNumeric: 'tabular-nums',
                    color: g != null && g >= SCORE.ELITE ? COLOR.gold : COLOR.ink2,
                  }}>
                    {g ?? '–'}
                  </span>
                )
              })}
            </div>
            <span style={{
              width: 34, textAlign: 'right', fontSize: TYPE.caption, fontWeight: 700,
              fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums', color: COLOR.ink,
            }}>
              {p.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
