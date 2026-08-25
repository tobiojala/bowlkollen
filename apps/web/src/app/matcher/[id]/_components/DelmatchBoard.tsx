'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { Check, Flame } from 'lucide-react'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import type { Delmatch, DelmatchPlayer, DelmatchSerie, DelmatchSummary } from '@bowlkollen/core'

// The 2v2 (or 1v1) bord head-to-head, reconstructed from BITS. Aligned like a
// results table: names outer (first-class, full names), scores in fixed columns
// that line up down the whole page, one calm winner check + bold pair total.
// Series wrap in a grid so it breathes on wide screens.
export function DelmatchBoard({ summary }: { summary: DelmatchSummary }) {
  if (!summary.hasData) {
    return <div style={{ color: COLOR.ink3, textAlign: 'center', padding: `${SPACE[8]}px 0`, fontSize: TYPE.caption }}>Bordsdata saknas för den här matchen.</div>
  }
  const pair = summary.konstellationSize > 1
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: `${SPACE[8]}px ${SPACE[12]}px` }}>
      {summary.series.map(s => <SerieBlock key={s.serie} serie={s} pair={pair} />)}
    </div>
  )
}

function SerieBlock({ serie, pair }: { serie: DelmatchSerie; pair: boolean }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[2] }}>
        <span style={{ color: COLOR.ink2, fontSize: TYPE.caption, fontWeight: 800, letterSpacing: '0.1em' }}>SERIE {serie.serie}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: TYPE.caption, fontWeight: 600, color: serie.pinfallWinner === 'home' ? COLOR.ink2 : COLOR.ink3 }}>{serie.homePinfall}</span>
          <span style={{ fontSize: TYPE.caption, color: COLOR.ink4 }}>–</span>
          <span style={{ fontSize: TYPE.caption, fontWeight: 600, color: serie.pinfallWinner === 'away' ? COLOR.ink2 : COLOR.ink3 }}>{serie.awayPinfall}</span>
          <Flame size={13} color={COLOR.ink3} style={{ marginLeft: 3 }} aria-label="Serievinst-bonus" />
        </span>
      </div>
      {serie.tables.map(d => <BordRow key={d.tableNo} d={d} pair={pair} />)}
    </div>
  )
}

// Fixed grid so every score column lines up vertically across all bords.
const GRID: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 52px 22px 52px minmax(0,1fr)',
  columnGap: SPACE[2], rowGap: 6, alignItems: 'center',
}

function BordRow({ d, pair }: { d: Delmatch; pair: boolean }) {
  const homeWon = d.winner === 'home', awayWon = d.winner === 'away'
  const rows = Math.max(d.home.length, d.away.length)
  return (
    <div style={{ padding: `${SPACE[4]}px 0`, borderTop: `1px solid ${COLOR.hairline}` }}>
      <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.04em', color: COLOR.ink4, marginBottom: SPACE[2] }}>BORD {d.tableNo}</div>
      <div style={GRID}>
        {Array.from({ length: rows }, (_, i) => (
          <Fragment key={i}>
            <Name p={d.home[i]} align="right" />
            <Score p={d.home[i]} win={homeWon} align="right" />
            <span />
            <Score p={d.away[i]} win={awayWon} align="left" />
            <Name p={d.away[i]} align="left" />
          </Fragment>
        ))}

        {/* Result row: winner check on the outer edge + (for 2v2) the pair totals */}
        <span style={{ textAlign: 'right' }}>{homeWon && <Check size={17} color={COLOR.green} style={{ display: 'inline' }} aria-label="Vinnare" />}</span>
        <Total total={pair ? d.homeTotal : null} win={homeWon} align="right" />
        <span />
        <Total total={pair ? d.awayTotal : null} win={awayWon} align="left" />
        <span style={{ textAlign: 'left' }}>{awayWon && <Check size={17} color={COLOR.green} style={{ display: 'inline' }} aria-label="Vinnare" />}</span>
      </div>
    </div>
  )
}

function Name({ p, align }: { p?: DelmatchPlayer; align: 'left' | 'right' }) {
  if (!p) return <span />
  const style: React.CSSProperties = {
    fontSize: 16, fontWeight: 500, textAlign: align, textDecoration: 'none',
    color: p.publicId ? COLOR.ink : COLOR.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  }
  return p.publicId ? <Link href={`/players/${p.publicId}`} style={style}>{p.name}</Link> : <span style={style}>{p.name}</span>
}

function Score({ p, win, align }: { p?: DelmatchPlayer; win: boolean; align: 'left' | 'right' }) {
  return (
    <span style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: win ? 800 : 700, textAlign: align, color: win ? COLOR.ink : COLOR.ink2 }}>
      {p?.score ?? ''}
    </span>
  )
}

function Total({ total, win, align }: { total: number | null; win: boolean; align: 'left' | 'right' }) {
  if (total == null) return <span />
  return (
    <span style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 14, fontWeight: 800, textAlign: align, color: win ? COLOR.ink : COLOR.ink4, paddingTop: 4 }}>
      {total}
    </span>
  )
}
