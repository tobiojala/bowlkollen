'use client'

import Link from 'next/link'
import { Check, Flame } from 'lucide-react'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { Delmatch, DelmatchPlayer, DelmatchSerie, DelmatchSummary } from '@bowlkollen/core'

// The 2v2 (or 1v1) bord head-to-head, reconstructed from BITS. Per serie, each
// physical bord shows both konstellationer with EACH player's own score, then the
// combined pair total that decides the delmatch (the banpoäng basis). Winner
// carried by weight + a check, never colour alone (senior-legible). The overall
// banpoäng tally is intentionally NOT repeated here — it's the match hero's score.
export function DelmatchBoard({ summary }: { summary: DelmatchSummary }) {
  if (!summary.hasData) {
    return <div style={{ color: COLOR.ink3, textAlign: 'center', padding: `${SPACE[8]}px 0`, fontSize: TYPE.caption }}>Bordsdata saknas för den här matchen.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[6] }}>
      {summary.series.map(s => <SerieBlock key={s.serie} serie={s} pair={summary.konstellationSize > 1} />)}
    </div>
  )
}

function SerieBlock({ serie, pair }: { serie: DelmatchSerie; pair: boolean }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[3] }}>
        <span style={{ color: COLOR.ink2, fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.12em' }}>SERIE {serie.serie}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: TYPE.caption, fontWeight: 600, color: serie.pinfallWinner === 'home' ? COLOR.ink2 : COLOR.ink3 }}>{serie.homePinfall}</span>
          <span style={{ fontSize: TYPE.caption, color: COLOR.ink4 }}>–</span>
          <span style={{ fontSize: TYPE.caption, fontWeight: 600, color: serie.pinfallWinner === 'away' ? COLOR.ink2 : COLOR.ink3 }}>{serie.awayPinfall}</span>
          <Flame size={13} color={COLOR.ink3} style={{ marginLeft: 3 }} aria-label="Serievinst-bonus" />
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
        {serie.tables.map(d => <BordCard key={d.tableNo} d={d} pair={pair} />)}
      </div>
    </div>
  )
}

function BordCard({ d, pair }: { d: Delmatch; pair: boolean }) {
  const homeWon = d.winner === 'home', awayWon = d.winner === 'away'
  const rows = Math.max(d.home.length, d.away.length)
  return (
    <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
      <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: SPACE[2], textAlign: 'center' }}>BORD {d.tableNo}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto 1fr', columnGap: SPACE[3], rowGap: 6, alignItems: 'center' }}>
        {Array.from({ length: rows }, (_, i) => (
          <PlayerPair key={i} home={d.home[i]} away={d.away[i]} />
        ))}
      </div>

      {/* Combined pair total — the delmatch decider */}
      {pair && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACE[2], marginTop: SPACE[2], paddingTop: SPACE[2], borderTop: `1px solid ${COLOR.hairline}`, fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums' }}>
          {homeWon && <Check size={15} color={COLOR.green} />}
          <span style={{ fontSize: 18, fontWeight: 800, color: homeWon ? COLOR.green : COLOR.ink3 }}>{d.homeTotal}</span>
          <span style={{ fontSize: 13, color: COLOR.ink4 }}>–</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: awayWon ? COLOR.green : COLOR.ink3 }}>{d.awayTotal}</span>
          {awayWon && <Check size={15} color={COLOR.green} />}
        </div>
      )}
    </div>
  )
}

// One player-vs-player line inside a bord: [home name] [home score] · [away score] [away name].
function PlayerPair({ home, away }: { home?: DelmatchPlayer; away?: DelmatchPlayer }) {
  return (
    <>
      <PlayerName p={home} align="right" />
      <span style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 700, color: COLOR.ink, minWidth: 36, textAlign: 'right' }}>{home?.score ?? ''}</span>
      <span style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 700, color: COLOR.ink, minWidth: 36, textAlign: 'left' }}>{away?.score ?? ''}</span>
      <PlayerName p={away} align="left" />
    </>
  )
}

function PlayerName({ p, align }: { p?: DelmatchPlayer; align: 'left' | 'right' }) {
  if (!p) return <span />
  const style: React.CSSProperties = {
    fontSize: TYPE.caption, fontWeight: 600, textAlign: align, textDecoration: 'none',
    color: p.publicId ? COLOR.ink : COLOR.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  }
  return p.publicId
    ? <Link href={`/players/${p.publicId}`} style={style}>{p.name}</Link>
    : <span style={style}>{p.name}</span>
}
