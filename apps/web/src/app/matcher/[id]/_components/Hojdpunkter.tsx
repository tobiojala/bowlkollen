'use client'

import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { SCORE } from '@/lib/constants'
import type { DelmatchSummary } from '@bowlkollen/core'
import type { BitsMatchPlayerResult } from '@/lib/types'

type Peak = { k: string; v: string; s: string; gold?: boolean }

// Auto-surfaced highlights of the match — turns raw serie data into the story.
// Pure so it's easy to reason about; needs season_avg on the results for the
// "skräll" (biggest over-snitt) — that one is skipped until the migration lands.
function computeHighlights(results: BitsMatchPlayerResult[], delmatch?: DelmatchSummary): Peak[] {
  const peaks: Peak[] = []
  let hi = { score: 0, name: '', idx: 0 }
  let over200 = 0, totalSeries = 0
  let skrall = { delta: -Infinity, name: '', score: 0 }

  for (const r of results) {
    r.series.forEach((g, i) => {
      if (g <= 0) return
      totalSeries++
      if (g >= SCORE.GOOD) over200++
      if (g > hi.score) hi = { score: g, name: r.player_name, idx: i }
      if (r.season_avg) { const d = g - r.season_avg; if (d > skrall.delta) skrall = { delta: d, name: r.player_name, score: g } }
    })
  }

  if (hi.score) peaks.push({ k: 'HÖGSTA SERIE', v: String(hi.score), s: `${hi.name} · S${hi.idx + 1}`, gold: true })
  if (totalSeries) peaks.push({ k: '200+ SERIER', v: `${over200}/${totalSeries}`, s: `${Math.round((over200 / totalSeries) * 100)}% av alla serier` })

  if (delmatch?.hasData) {
    let bw = { margin: 0, bord: 0, serie: 0 }
    for (const s of delmatch.series) for (const d of s.tables) {
      const m = Math.abs(d.homeTotal - d.awayTotal)
      if (m > bw.margin) bw = { margin: m, bord: d.tableNo, serie: s.serie }
    }
    if (bw.margin) peaks.push({ k: 'STÖRSTA BORDSEGER', v: `+${bw.margin}`, s: `Bord ${bw.bord} · Serie ${bw.serie}` })
  }

  if (Number.isFinite(skrall.delta) && skrall.delta > 0) {
    peaks.push({ k: 'KVÄLLENS SKRÄLL', v: `+${skrall.delta}`, s: `${skrall.name} · ${skrall.score}` })
  }
  return peaks
}

export function Hojdpunkter({ results, delmatch }: { results: BitsMatchPlayerResult[]; delmatch?: DelmatchSummary }) {
  const peaks = computeHighlights(results, delmatch)
  if (!peaks.length) return null
  return (
    <div style={{ display: 'flex', gap: SPACE[3], flexWrap: 'wrap', alignContent: 'center', height: '100%' }}>
      {peaks.map(p => (
        <div key={p.k} style={{ flex: '1 1 150px', background: COLOR.surface, borderRadius: RADIUS.md, padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
          <div style={{ fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.06em', color: COLOR.ink3 }}>{p.k}</div>
          <div style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: 800, marginTop: 4, color: p.gold ? COLOR.gold : COLOR.ink }}>{p.v}</div>
          <div style={{ fontSize: TYPE.caption, color: COLOR.ink2, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.s}</div>
        </div>
      ))}
    </div>
  )
}
