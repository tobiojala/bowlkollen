'use client'

import { useState } from 'react'
import { SERIE_GOLD_MIN } from '@bowlkollen/core'
import { Sheet } from '@/components/mockup/Sheet'
import { MCFG, type Metric } from '@/components/mockup/Curves'
import SeasonCurve from '@/components/SeasonCurve'
import { RankingChart } from '@/components/RankingChart'
import { COLORS } from '../../data'
import type { ProfileMatch, ProfileUpcoming } from '@/lib/profile'
import type { PlayerRanking } from '@/app/players/[id]/_components/use-player-ranking'
import type { RankingGraphPoint } from '@/app/players/[id]/_components/use-player-ranking-history'

const { GOLD, GREEN, RED } = COLORS
const INK  = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.64)'
const INK3 = 'rgba(244,245,247,0.40)'
const INK4 = 'rgba(244,245,247,0.24)'

interface CurveSheetProps {
  matchAvgs: number[]
  matches: ProfileMatch[]
  upcoming: ProfileUpcoming[]
  seasonAvg: number
  formDiff: number
  recentAvg: number
  initialMetric?: Metric
  /** Real BITS national ranking for this player (null = unranked/mockup). */
  ranking?: PlayerRanking | null
  /** 12-month spelstyrka/ranking/snitt history for the ranking + Alla curves. */
  rankingHistory?: RankingGraphPoint[]
  onClose: () => void
}

export default function CurveSheet({ matchAvgs, matches, seasonAvg, formDiff, recentAvg, initialMetric, ranking, rankingHistory, onClose }: CurveSheetProps) {
  const [curveMetric, setCurveMetric] = useState<Metric>(initialMetric ?? 'snitt')
  const [curveTapped, setCurveTapped] = useState<number | null>(null)

  const curveTapM = curveTapped !== null ? matches[curveTapped] : null
  const scoreColor  = (g: number) => g >= 250 ? GOLD : g >= 200 ? INK : INK3
  const scoreWeight = (g: number) => g >= 250 ? 900 : g >= 200 ? 700 : 400

  // Real dates + milestone flags for the honest season curve. A match earns a
  // gold dot when it held a milestone series (≥ SERIE_GOLD_MIN) — gold stays rare.
  const dates      = matches.map(m => m.date)
  const highlights = matches.map(m => {
    const gs = m.games.filter(g => g > 0)
    return gs.length > 0 && Math.max(...gs) >= SERIE_GOLD_MIN
  })

  return (
    <Sheet title="Säsongskurva" subtitle={`${matches.length} matcher`} onClose={onClose}>

      {/* Hero — snitt only; other metrics are "kommer snart" */}
      {curveMetric === 'snitt' && (
        <>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="num" style={{ fontSize: 40, color: INK }}>{seasonAvg}</span>
            <span className="text-caption font-bold rounded-full px-2.5 py-1 tabular-nums"
              style={{ color: formDiff > 0 ? GREEN : RED, background: formDiff > 0 ? 'rgba(93,202,165,0.10)' : 'rgba(224,85,85,0.10)' }}>
              {formDiff > 0 ? '+' : ''}{formDiff} form
            </span>
          </div>
          <p className="text-[13px] mb-5" style={{ color: INK3 }}>senaste 4 matcher mot säsongssnittet</p>
        </>
      )}

      {/* Metric selector — neutral pills, color only as a dot */}
      <div className="flex gap-1.5 mb-4">
        {(Object.keys(MCFG) as Metric[]).map(m => {
          const active = curveMetric === m
          return (
            <button key={m} onClick={() => { setCurveMetric(m); setCurveTapped(null) }}
              className="flex-1 min-h-[40px] rounded-full text-[13px] font-semibold cursor-pointer border-none
                         flex items-center justify-center gap-1.5 transition-colors duration-150"
              style={{
                background: active ? INK : 'rgba(244,245,247,0.06)',
                color: active ? '#0b0d10' : INK3,
              }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: MCFG[m].color,
                opacity: active ? 1 : 0.45, flexShrink: 0 }} />
              {m === 'alla' ? 'Alla' : MCFG[m].label}
            </button>
          )
        })}
      </div>

      {curveMetric === 'snitt' ? (
        <SeasonCurve matchAvgs={matchAvgs} dates={dates} highlights={highlights}
          seasonAvg={seasonAvg} recentAvg={recentAvg} tapped={curveTapped} onTap={setCurveTapped} />
      ) : curveMetric === 'ranking' ? (
        ranking || (rankingHistory && rankingHistory.length >= 2)
          ? <RankingCard r={ranking ?? null} history={rankingHistory} />
          : <ComingSoon text="Ingen rankingpoäng registrerad än." />
      ) : curveMetric === 'bk' ? (
        <ComingSoon text="BK-rating är under utveckling – vi visar den så fort den är redo." />
      ) : (
        rankingHistory && rankingHistory.length >= 2
          ? <ComboLines history={rankingHistory} />
          : <ComingSoon text="Kommer när ranking är på plats – då jämförs snitt, ranking och spelstyrka här." />
      )}

      {/* Ghost fan legend */}
      {curveMetric === 'snitt' && (
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="rgba(245,194,0,0.55)" strokeWidth="1.5" strokeDasharray="4,3" /></svg>
            <span className="text-[12px]" style={{ color: INK3 }}>om formen håller · <span className="tabular-nums font-semibold" style={{ color: INK2 }}>{recentAvg}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="rgba(244,245,247,0.28)" strokeWidth="1.5" strokeDasharray="4,3" /></svg>
            <span className="text-[12px]" style={{ color: INK3 }}>om snittet håller · <span className="tabular-nums font-semibold" style={{ color: INK2 }}>{seasonAvg}</span></span>
          </div>
        </div>
      )}

      {curveMetric === 'snitt' && !curveTapM && (
        <p className="text-[12px] text-center mt-3" style={{ color: INK4 }}>
          Tryck på en punkt för matchinfo
        </p>
      )}

      {/* Tapped match detail */}
      {curveTapM && (
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(244,245,247,0.07)' }}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <p className="text-[15px] font-bold">vs {curveTapM.opp}</p>
              <p className="text-[12px] mt-0.5" style={{ color: INK3 }}>{curveTapM.date}</p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full text-[13px] font-bold"
              style={{
                background: curveTapM.result.startsWith('W') ? 'rgba(93,202,165,0.12)' : curveTapM.result.startsWith('L') ? 'rgba(224,85,85,0.12)' : 'rgba(244,245,247,0.06)',
                color: curveTapM.result.startsWith('W') ? GREEN : curveTapM.result.startsWith('L') ? RED : INK3,
              }}>
              {curveTapM.result}
            </span>
          </div>

          <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `repeat(${curveTapM.games.length}, 1fr)` }}>
            {curveTapM.games.map((g: number, i: number) => (
              <div key={i} className="text-center">
                <div className="num text-4xl" style={{ color: scoreColor(g), fontWeight: scoreWeight(g) }}>{g}</div>
                <div className="text-[11px] mt-1.5" style={{ color: INK4 }}>Spel {i + 1}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 pt-4" style={{ borderTop: '1px solid rgba(244,245,247,0.07)' }}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: INK3 }}>Totalt</p>
              <p className="num text-2xl" style={{ color: INK }}>{curveTapM.games.reduce((a: number, b: number) => a + b)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: INK3 }}>Matchsnitt</p>
              <p className="num text-2xl" style={{ color: INK2 }}>{Math.round(curveTapM.games.reduce((a: number, b: number) => a + b) / curveTapM.games.length)}</p>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  )
}

// BITS national ranking: current figure + place as the header, with the 12-month
// rankingpoäng line below when history is available.
function RankingCard({ r, history }: { r: PlayerRanking | null; history?: RankingGraphPoint[] }) {
  const place = r ? (r.place_male ?? r.place_female) : null
  const genderLabel = r?.gender === 'F' ? 'damer' : 'herrar'
  const points = r?.rank_points != null ? r.rank_points.toFixed(2).replace('.', ',') : '–'
  const hasChart = !!history && history.length >= 2
  return (
    <div>
      {r && (
        <>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="num" style={{ fontSize: 40, color: INK }}>{points}</span>
            <span className="text-[13px]" style={{ color: INK3 }}>rankingpoäng</span>
          </div>
          {place
            ? <p className="text-[14px] mb-4" style={{ color: INK2 }}>Placering <b style={{ color: INK }}>#{place}</b> i Sverige ({genderLabel})</p>
            : <div className="mb-4" />}
        </>
      )}
      {hasChart && (
        <RankingChart xLabels={history!.map(h => h.xLabel)}
          lines={[{ label: 'Rankingpoäng', color: GOLD, values: history!.map(h => h.ranking) }]} />
      )}
      {r && (
        <div className="grid grid-cols-3 gap-3 pt-4 mt-4" style={{ borderTop: '1px solid rgba(244,245,247,0.07)' }}>
          <RankStat label="Snitt" value={r.average != null ? Math.round(r.average) : '–'} />
          <RankStat label="Serier" value={r.total_rounds ?? '–'} />
          <RankStat label="Spelstyrka" value={r.skill_level != null ? Math.round(r.skill_level) : '–'} />
        </div>
      )}
      <p className="text-[12px] mt-4" style={{ color: INK3 }}>Officiell ranking från BITS, uppdateras dagligen.</p>
    </div>
  )
}

// Alla — spelstyrka + ranking + snitt on one axis (BITS Spelarprofil style).
function ComboLines({ history }: { history: RankingGraphPoint[] }) {
  return (
    <div style={{ minHeight: 152 }}>
      <RankingChart xLabels={history.map(h => h.xLabel)} zeroBased lines={[
        { label: 'Spelstyrka', color: GREEN, values: history.map(h => h.spelstyrka) },
        { label: 'Rankingpoäng', color: GOLD, values: history.map(h => h.ranking) },
        { label: 'Snitt', color: INK2, values: history.map(h => h.snitt) },
      ]} />
      <p className="text-[12px] mt-3" style={{ color: INK3 }}>Officiell ranking från BITS, uppdateras dagligen.</p>
    </div>
  )
}
function RankStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: INK3 }}>{label}</p>
      <p className="num text-2xl" style={{ color: INK }}>{value}</p>
    </div>
  )
}

// Honest placeholder for metrics that aren't wired to real data yet — never a fake curve.
function ComingSoon({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 152, gap: 8 }}>
      <div className="text-[15px] font-bold" style={{ color: INK }}>Kommer snart</div>
      <p className="text-[13px]" style={{ color: INK3, maxWidth: '34ch' }}>{text}</p>
    </div>
  )
}
