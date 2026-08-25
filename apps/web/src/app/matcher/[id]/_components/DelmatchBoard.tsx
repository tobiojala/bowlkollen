'use client'

import Link from 'next/link'
import { Check, Flame } from 'lucide-react'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import type { Delmatch, DelmatchSerie, DelmatchSummary } from '@bowlkollen/core'

// The 2v2 (or 1v1) bord head-to-head, reconstructed from BITS — per serie, each
// physical bord shows the home konstellation vs the away one, who took the
// delmatch, and the serie pinfall bonus. Winner carried by weight + a check icon,
// never colour alone (senior-legible). Port of the native DelmatchBoard.
const side = (a: number, b: number): 'home' | 'away' | 'tie' => (a > b ? 'home' : b > a ? 'away' : 'tie')

export function DelmatchBoard({ summary }: { summary: DelmatchSummary }) {
  if (!summary.hasData) {
    return <div style={{ color: COLOR.ink3, textAlign: 'center', padding: `${SPACE[8]}px 0`, fontSize: TYPE.caption }}>Bordsdata saknas för den här matchen.</div>
  }
  const homeLead = side(summary.homeBanp, summary.awayBanp) === 'home'
  const awayLead = side(summary.awayBanp, summary.homeBanp) === 'away'
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: SPACE[6] }}>
        <div style={{ color: COLOR.ink3, fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.12em' }}>BANPOÄNG</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: SPACE[3], marginTop: 2, fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: homeLead ? COLOR.ink : COLOR.ink3 }}>{summary.homeBanp}</span>
          <span style={{ fontSize: 22, color: COLOR.ink4 }}>–</span>
          <span style={{ fontSize: 34, fontWeight: 800, color: awayLead ? COLOR.ink : COLOR.ink3 }}>{summary.awayBanp}</span>
        </div>
      </div>
      {summary.series.map(s => <SerieBlock key={s.serie} serie={s} />)}
    </div>
  )
}

function SerieBlock({ serie }: { serie: DelmatchSerie }) {
  return (
    <div style={{ marginBottom: SPACE[6] }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: SPACE[3], paddingBottom: SPACE[2], borderBottom: `1px solid ${COLOR.hairline}`,
      }}>
        <span style={{ color: COLOR.ink2, fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.12em' }}>SERIE {serie.serie}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: TYPE.caption, fontWeight: 600, color: serie.pinfallWinner === 'home' ? COLOR.ink2 : COLOR.ink3 }}>{serie.homePinfall}</span>
          <span style={{ fontSize: TYPE.caption, color: COLOR.ink4 }}>–</span>
          <span style={{ fontSize: TYPE.caption, fontWeight: 600, color: serie.pinfallWinner === 'away' ? COLOR.ink2 : COLOR.ink3 }}>{serie.awayPinfall}</span>
          <Flame size={13} color={COLOR.ink3} style={{ marginLeft: 3 }} />
        </span>
      </div>
      {serie.tables.map(d => <BordRow key={d.tableNo} d={d} />)}
    </div>
  )
}

function BordRow({ d }: { d: Delmatch }) {
  const homeWon = d.winner === 'home', awayWon = d.winner === 'away'
  const scoreColor = (win: boolean, lose: boolean) => (win ? COLOR.green : lose ? COLOR.ink3 : COLOR.ink2)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], padding: `${SPACE[3]}px 0` }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
        {d.home.map((p, i) => <PlayerName key={i} name={p.name} publicId={p.publicId} align="left" />)}
      </div>
      <div style={{ minWidth: 124, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums' }}>
          {homeWon && <Check size={16} color={COLOR.green} />}
          <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor(homeWon, awayWon) }}>{d.homeTotal}</span>
          <span style={{ fontSize: 15, color: COLOR.ink4 }}>–</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor(awayWon, homeWon) }}>{d.awayTotal}</span>
          {awayWon && <Check size={16} color={COLOR.green} />}
        </div>
        <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginTop: 1 }}>BORD {d.tableNo}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
        {d.away.map((p, i) => <PlayerName key={i} name={p.name} publicId={p.publicId} align="right" />)}
      </div>
    </div>
  )
}

function PlayerName({ name, publicId, align }: { name: string; publicId: string | null; align: 'left' | 'right' }) {
  const style: React.CSSProperties = {
    fontSize: TYPE.caption, fontWeight: 600, textAlign: align, textDecoration: 'none',
    color: publicId ? COLOR.ink : COLOR.ink2, display: 'block',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
  }
  return publicId
    ? <Link href={`/players/${publicId}`} style={style}>{name}</Link>
    : <span style={style}>{name}</span>
}
