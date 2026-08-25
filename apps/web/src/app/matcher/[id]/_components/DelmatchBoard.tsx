'use client'

import Link from 'next/link'
import { Check, Flame } from 'lucide-react'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import type { Delmatch, DelmatchPlayer, DelmatchSerie, DelmatchSummary } from '@bowlkollen/core'

// The 2v2 (or 1v1) bord head-to-head, reconstructed from BITS. Series wrap in a
// grid so it breathes on wide screens; each bord is a roomy row — big individual
// scores, small names — with the winning konstellation carried by green + a check
// (never colour alone). The banpoäng tally is the match hero's score, not repeated.
export function DelmatchBoard({ summary }: { summary: DelmatchSummary }) {
  if (!summary.hasData) {
    return <div style={{ color: COLOR.ink3, textAlign: 'center', padding: `${SPACE[8]}px 0`, fontSize: TYPE.caption }}>Bordsdata saknas för den här matchen.</div>
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: `${SPACE[8]}px ${SPACE[12]}px` }}>
      {summary.series.map(s => <SerieBlock key={s.serie} serie={s} />)}
    </div>
  )
}

function SerieBlock({ serie }: { serie: DelmatchSerie }) {
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
      {serie.tables.map(d => <BordRow key={d.tableNo} d={d} />)}
    </div>
  )
}

function BordRow({ d }: { d: Delmatch }) {
  const homeWon = d.winner === 'home', awayWon = d.winner === 'away'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[4]}px 0`, borderTop: `1px solid ${COLOR.hairline}` }}>
      <span style={{ width: 44, flexShrink: 0, fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.04em', color: COLOR.ink4 }}>BORD {d.tableNo}</span>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: SPACE[3] }}>
        {d.home.map((p, i) => <ScorePlayer key={i} p={p} win={homeWon} />)}
        {homeWon && <Check size={18} color={COLOR.green} style={{ flexShrink: 0 }} />}
      </div>

      <span style={{ width: 1, alignSelf: 'stretch', background: COLOR.hairline, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: SPACE[3] }}>
        {awayWon && <Check size={18} color={COLOR.green} style={{ flexShrink: 0 }} />}
        {d.away.map((p, i) => <ScorePlayer key={i} p={p} win={awayWon} />)}
      </div>
    </div>
  )
}

// One player: a big score with a small name under it.
function ScorePlayer({ p, win }: { p: DelmatchPlayer; win: boolean }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <div style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: win ? 800 : 700, lineHeight: 1, color: win ? COLOR.ink : COLOR.ink2 }}>
        {p.score}
      </div>
      <PlayerName p={p} />
    </div>
  )
}

function PlayerName({ p }: { p: DelmatchPlayer }) {
  const style: React.CSSProperties = {
    display: 'block', fontSize: 15, fontWeight: 600, marginTop: 5, textDecoration: 'none',
    color: p.publicId ? COLOR.ink2 : COLOR.ink3,
    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  }
  return p.publicId
    ? <Link href={`/players/${p.publicId}`} style={style}>{p.name}</Link>
    : <span style={style}>{p.name}</span>
}
