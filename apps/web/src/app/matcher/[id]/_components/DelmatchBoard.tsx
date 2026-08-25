'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { Check, Flame } from 'lucide-react'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import type { Delmatch, DelmatchPlayer, DelmatchSerie, DelmatchSummary } from '@bowlkollen/core'

// The 2v2 (or 1v1) bord head-to-head, reconstructed from BITS. Aligned like a
// results table: names outer (first-class, full names), scores in fixed columns
// that line up down the whole page, one calm winner check + bold pair total.
// Pro: a snitt-delta under each score (over/under the player's season average).
type Avg = Record<string, number>

export function DelmatchBoard({ summary, avg, showDeltas }: { summary: DelmatchSummary; avg?: Avg; showDeltas?: boolean }) {
  if (!summary.hasData) {
    return <div style={{ color: COLOR.ink3, textAlign: 'center', padding: `${SPACE[8]}px 0`, fontSize: TYPE.caption }}>Bordsdata saknas för den här matchen.</div>
  }
  const pair = summary.konstellationSize > 1
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: `${SPACE[8]}px ${SPACE[12]}px` }}>
      {summary.series.map(s => <SerieBlock key={s.serie} serie={s} pair={pair} avg={avg} showDeltas={showDeltas} />)}
    </div>
  )
}

function SerieBlock({ serie, pair, avg, showDeltas }: { serie: DelmatchSerie; pair: boolean; avg?: Avg; showDeltas?: boolean }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[2] }}>
        <span style={{ color: COLOR.ink2, fontSize: TYPE.caption, fontWeight: 800, letterSpacing: '0.1em' }}>SERIE {serie.serie}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: TYPE.caption, fontWeight: serie.pinfallWinner === 'home' ? 700 : 600, color: COLOR.ink2 }}>{serie.homePinfall}</span>
          <span style={{ fontSize: TYPE.caption, color: COLOR.ink4 }}>–</span>
          <span style={{ fontSize: TYPE.caption, fontWeight: serie.pinfallWinner === 'away' ? 700 : 600, color: COLOR.ink2 }}>{serie.awayPinfall}</span>
          <Flame size={13} color={COLOR.ink3} style={{ marginLeft: 3 }} aria-label="Serievinst-bonus" />
        </span>
      </div>
      {serie.tables.map(d => <BordRow key={d.tableNo} d={d} pair={pair} avg={avg} showDeltas={showDeltas} />)}
    </div>
  )
}

const GRID: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 58px 22px 58px minmax(0,1fr)',
  columnGap: SPACE[2], rowGap: 8, alignItems: 'start',
}

function BordRow({ d, pair, avg, showDeltas }: { d: Delmatch; pair: boolean; avg?: Avg; showDeltas?: boolean }) {
  const homeWon = d.winner === 'home', awayWon = d.winner === 'away'
  const rows = Math.max(d.home.length, d.away.length)
  const avgOf = (p?: DelmatchPlayer) => (showDeltas && p?.publicId ? avg?.[p.publicId] : undefined)
  return (
    <div style={{ padding: `${SPACE[4]}px 0`, borderTop: `1px solid ${COLOR.hairline}` }}>
      <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.04em', color: COLOR.ink3, marginBottom: SPACE[2] }}>BORD {d.tableNo}</div>
      <div style={GRID}>
        {Array.from({ length: rows }, (_, i) => (
          <Fragment key={i}>
            <Name p={d.home[i]} align="right" />
            <Score p={d.home[i]} win={homeWon} align="right" avg={avgOf(d.home[i])} />
            <span />
            <Score p={d.away[i]} win={awayWon} align="left" avg={avgOf(d.away[i])} />
            <Name p={d.away[i]} align="left" />
          </Fragment>
        ))}

        {/* Result row: winner check on the outer edge + (for 2v2) the pair totals */}
        <span style={{ textAlign: 'right', paddingTop: 4 }}>{homeWon && <Check size={17} color={COLOR.green} style={{ display: 'inline' }} aria-label="Vinnare" />}</span>
        <Total total={pair ? d.homeTotal : null} win={homeWon} align="right" />
        <span />
        <Total total={pair ? d.awayTotal : null} win={awayWon} align="left" />
        <span style={{ textAlign: 'left', paddingTop: 4 }}>{awayWon && <Check size={17} color={COLOR.green} style={{ display: 'inline' }} aria-label="Vinnare" />}</span>
      </div>
    </div>
  )
}

function Name({ p, align }: { p?: DelmatchPlayer; align: 'left' | 'right' }) {
  if (!p) return <span />
  const style: React.CSSProperties = {
    fontSize: 16, fontWeight: 500, textAlign: align, textDecoration: 'none', paddingTop: 1,
    color: p.publicId ? COLOR.ink : COLOR.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  }
  return p.publicId ? <Link href={`/players/${p.publicId}`} style={style}>{p.name}</Link> : <span style={style}>{p.name}</span>
}

function Score({ p, win, align, avg }: { p?: DelmatchPlayer; win: boolean; align: 'left' | 'right'; avg?: number }) {
  const delta = p && avg ? p.score - avg : null
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <span style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: win ? 800 : 700, lineHeight: 1, color: win ? COLOR.ink : COLOR.ink2 }}>
        {p?.score ?? ''}
      </span>
      {delta != null && (
        <span style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 2, color: delta >= 0 ? COLOR.green : COLOR.ink3 }}>
          {delta >= 0 ? '+' : '−'}{Math.abs(delta)}
        </span>
      )}
    </span>
  )
}

function Total({ total, win, align }: { total: number | null; win: boolean; align: 'left' | 'right' }) {
  if (total == null) return <span />
  return (
    <span style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 14, fontWeight: 800, textAlign: align, color: win ? COLOR.ink : COLOR.ink3, paddingTop: 4, display: 'block' }}>
      {total}
    </span>
  )
}
