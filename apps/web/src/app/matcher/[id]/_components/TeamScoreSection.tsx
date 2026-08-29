'use client'

import Link from 'next/link'
import FollowButton from '@/components/FollowButton'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { SCORE } from '@/lib/constants'
import { useMediaQuery } from '@/lib/use-media-query'

export type PlayerLine = { name: string; games: number[]; total: number; publicId: string | null; seasonAvg?: number | null }

type Props = {
  teamName:   string
  players:    PlayerLine[]
  serieCount: number
  total:      number
  isWinner:   boolean
  showDeltas?: boolean   // Pro: show each serie's delta vs the player's season snitt
}

const serieColor = (raw: number, played: boolean) => (!played ? COLOR.ink3 : raw >= SCORE.ELITE ? COLOR.gold : COLOR.ink2)

// One team's full roster. Desktop = an aligned grid (name | S1–S4 | TOT). Mobile
// stacks each player — name + TOT on top, the series in a clean row below — so
// the name gets full width instead of collapsing to a single letter.
export function TeamScoreSection({ teamName, players, serieCount, total, isWinner, showDeltas }: Props) {
  const isMobile = useMediaQuery('(max-width: 560px)')
  const cls = `tss-${serieCount}`
  const colLabel: React.CSSProperties = {
    borderLeft: `1px solid ${COLOR.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: TYPE.micro, fontWeight: 700, color: COLOR.ink3, padding: `${SPACE[3]}px 0`,
  }
  const nameEl = (p: PlayerLine) => p.publicId
    ? <Link href={`/players/${p.publicId}`} style={{ color: COLOR.ink, textDecoration: 'none' }}>{p.name}</Link>
    : <span style={{ color: COLOR.ink }}>{p.name}</span>
  const deltaOf = (p: PlayerLine, raw: number, played: boolean) => (showDeltas && played && p.seasonAvg ? raw - p.seasonAvg : null)

  return (
    <div style={{ marginBottom: SPACE[6] }}>
      {!isMobile && <style>{`.${cls} { display: grid; grid-template-columns: minmax(0,1fr) repeat(${serieCount}, 56px) 60px; align-items: stretch; }`}</style>}
      <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
        {/* Team title bar */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: `${SPACE[3]}px ${SPACE[4]}px`, borderBottom: `1px solid ${COLOR.hairline}` }}>
          <span style={{ fontSize: TYPE.body, fontWeight: 800, color: isWinner ? COLOR.ink : COLOR.ink2 }}>{teamName}</span>
          <span style={{ fontSize: 24, fontWeight: 800, fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums', color: isWinner ? COLOR.ink : COLOR.ink2 }}>{total}</span>
        </div>

        {isMobile ? (
          players.map((p, ri) => (
            <div key={p.name} style={{ borderTop: ri === 0 ? 'none' : `1px solid ${COLOR.hairline}`, padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: TYPE.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameEl(p)}</span>
                {p.publicId && <FollowButton entityType="player" entityId={p.publicId} variant="icon" size="sm" />}
                <span style={{ marginLeft: SPACE[2], fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 800, color: COLOR.ink }}>{p.total}</span>
              </div>
              <div style={{ display: 'flex', gap: SPACE[2], marginTop: SPACE[2] }}>
                {Array.from({ length: serieCount }, (_, gi) => {
                  const raw = p.games[gi] ?? 0, played = raw > 0
                  const delta = deltaOf(p, raw, played)
                  return (
                    <div key={gi} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: TYPE.micro, fontWeight: 700, color: COLOR.ink3 }}>S{gi + 1}</div>
                      <div style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 700, color: serieColor(raw, played), marginTop: 2 }}>{played ? raw : '–'}</div>
                      {delta != null && <div style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: delta >= 0 ? COLOR.green : COLOR.ink3 }}>{delta >= 0 ? '+' : '−'}{Math.abs(delta)}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <>
            <div className={cls} style={{ borderBottom: `1px solid ${COLOR.hairline}` }}>
              <span />
              {Array.from({ length: serieCount }, (_, i) => <span key={i} style={colLabel}>S{i + 1}</span>)}
              <span style={{ ...colLabel, paddingRight: SPACE[3] }}>TOT</span>
            </div>
            {players.map((p, ri) => (
              <div key={p.name} className={cls} style={{ borderTop: ri === 0 ? 'none' : `1px solid ${COLOR.hairline}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], minWidth: 0, padding: `${SPACE[3]}px 0 ${SPACE[3]}px ${SPACE[4]}px` }}>
                  <span style={{ minWidth: 0, fontSize: TYPE.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameEl(p)}</span>
                  {p.publicId && <FollowButton entityType="player" entityId={p.publicId} variant="icon" size="sm" />}
                </div>
                {Array.from({ length: serieCount }, (_, gi) => {
                  const raw = p.games[gi] ?? 0, played = raw > 0
                  const delta = deltaOf(p, raw, played)
                  return (
                    <span key={gi} style={{ borderLeft: `1px solid ${COLOR.hairline}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${SPACE[3]}px 0` }}>
                      <span style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 700, color: serieColor(raw, played) }}>{played ? raw : '–'}</span>
                      {delta != null && <span style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 2, color: delta >= 0 ? COLOR.green : COLOR.ink3 }}>{delta >= 0 ? '+' : '−'}{Math.abs(delta)}</span>}
                    </span>
                  )
                })}
                <span style={{ borderLeft: `1px solid ${COLOR.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: SPACE[3], fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 800, color: COLOR.ink }}>{p.total}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
