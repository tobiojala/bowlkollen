'use client'

import { Surface, SectionHeader, Hairline } from '@/components/ui/primitives'
import { characterSentence, rhythmLabel, narrativeParagraph } from '../helpers'
import { COLORS } from '../data'
import type { ProfileData } from '@/lib/profile'

const { GOLD } = COLORS
const INK  = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.64)'
const INK3 = 'rgba(244,245,247,0.40)'
const INK4 = 'rgba(244,245,247,0.24)'

interface AnalysisSectionProps {
  data: ProfileData
  /** First name for the season narrative copy. */
  firstName: string
  onOpenCurve: () => void
}

export default function AnalysisSection({ data, firstName, onOpenCurve }: AnalysisSectionProps) {
  const { seasonAvg, formDiff } = data
  const allGames    = data.matches.flatMap(m => m.games.filter(g => g > 0))
  const n           = allGames.length
  const over200     = data.over200
  const sd          = data.sd
  const consistency = data.consistency
  const hitRate     = data.hitRate
  const s200        = data.streak200
  const sAvg        = data.streakAvg
  const bestSeries  = data.bestSeries
  const bestIdx     = data.bestSeriesIdx
  const bestMatch   = data.matches[bestIdx]
  const gameAvgs    = data.gameAvgs
  const rhythm      = rhythmLabel(gameAvgs)
  const lastSeasonAvg = data.lastSeasonAvg
  const narrative   = narrativeParagraph({
    firstName, seasonAvg, lastSeasonAvg, formDiff, hitRate,
    streakAboveAvg: sAvg.current, consistency, rhythmLabel: rhythm.label,
    bestSeries, games200Plus: over200, totalGames: n,
  })

  const bkts = [
    { c: 'rgba(244,245,247,0.18)', v: allGames.filter(g => g < 180).length,             l: 'u.180' },
    { c: 'rgba(244,245,247,0.34)', v: allGames.filter(g => g >= 180 && g < 200).length, l: '180–199' },
    { c: 'rgba(244,245,247,0.78)', v: allGames.filter(g => g >= 200 && g < 250).length, l: '200–249' },
    { c: GOLD,                     v: allGames.filter(g => g >= 250).length,            l: '250+' },
  ].filter(b => b.v > 0)

  const cardLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, marginBottom: 10 }

  return (
    <>
      <div style={{ padding: '28px 20px 0' }}>
        <SectionHeader label="Prestanda" />

        {/* 2×2 stat cards — each stat with its own micro-visualisation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>

          {/* TRÄFF */}
          <Surface level={1} onClick={onOpenCurve} className="px-3.5 pt-4 pb-3.5">
            <div style={cardLabel}>TRÄFF</div>
            <div className="num" style={{ fontSize: 34, color: INK }}>{hitRate}%</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 12 }}>
              {allGames.slice(-20).map((g, i) => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: 2,
                  background: g >= 200 ? 'rgba(244,245,247,0.65)' : 'rgba(244,245,247,0.10)' }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: INK3, marginTop: 9 }}>{over200} av {n} spel ≥200p</div>
          </Surface>

          {/* KARAKTÄR */}
          <Surface level={1} onClick={onOpenCurve} className="px-3.5 pt-4 pb-3.5">
            <div style={cardLabel}>KARAKTÄR</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: INK, lineHeight: 1.15 }}>{consistency}</div>
            <div style={{ position: 'relative', height: 26, marginTop: 14 }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%',
                height: 1, background: 'rgba(244,245,247,0.08)', transform: 'translateY(-50%)' }} />
              {allGames.slice(-12).map((g, i) => {
                const mn = Math.min(...allGames), mx = Math.max(...allGames)
                const pct = (g - mn) / (mx - mn || 1) * 92
                return (
                  <div key={i} style={{
                    position: 'absolute', top: '50%', left: `${pct}%`,
                    width: 6, height: 6, borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: g >= seasonAvg ? 'rgba(244,245,247,0.55)' : 'rgba(244,245,247,0.16)',
                  }} />
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: INK3, marginTop: 9 }}>±{sd}p std.avv.</div>
          </Surface>

          {/* BÄSTA SERIE */}
          <Surface level={1} className="px-3.5 pt-4 pb-3.5">
            <div style={cardLabel}>BÄSTA SERIE</div>
            <div className="num" style={{ fontSize: 34, color: GOLD }}>{bestSeries}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
              {bestMatch?.games.map((g, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 700, color: g >= 250 ? GOLD : INK2, fontVariantNumeric: 'tabular-nums' }}>{g}</span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: INK3, marginTop: 9 }}>vs {bestMatch?.opp} · {bestMatch?.date}</div>
          </Surface>

          {/* 200+-SVIT */}
          <Surface level={1} className="px-3.5 pt-4 pb-3.5">
            <div style={cardLabel}>200+-SVIT</div>
            <div className="num" style={{ fontSize: 34, color: INK }}>{s200.best}</div>
            <div style={{ display: 'flex', gap: 3, marginTop: 12 }}>
              {Array.from({ length: Math.min(s200.best, 18) }).map((_, i) => (
                <div key={i} style={{ flex: 1, maxWidth: 8, height: 7, borderRadius: 2, background: 'rgba(244,245,247,0.4)' }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: INK3, marginTop: 9 }}>spel i rad över 200 · nu {s200.current}</div>
          </Surface>
        </div>

        {/* Spelanalys: distribution + character + rhythm */}
        <Surface level={1} className="px-4 py-4 mt-3">
          <div style={{ display: 'flex', height: 8, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
            {bkts.map((b, i) => <div key={i} style={{ flex: b.v, background: b.c, minWidth: 4 }} />)}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
            {bkts.map(b => (
              <div key={b.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: b.c, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: INK3 }}>{b.l}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: b.c === GOLD ? GOLD : INK2, fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(b.v / n * 100)}%
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: INK2, fontStyle: 'italic', lineHeight: 1.5 }}>
            {characterSentence({ hitRate, formDiff, streakAboveAvg: sAvg.current, streakAbove200: s200.current, consistency, seasonAvg, bestSeries })}
          </div>

          <Hairline className="my-4" />

          {/* Rhythm */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
              {gameAvgs.map((avg, i) => {
                const mn    = Math.min(...gameAvgs), mx = Math.max(...gameAvgs)
                const barH  = 10 + ((avg - mn) / (mx - mn || 1)) * 26
                const isPeak = avg === mx
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 22, height: barH, borderRadius: 4,
                      background: isPeak ? INK : 'rgba(244,245,247,0.14)' }} />
                    <span style={{ fontSize: 11, color: isPeak ? INK2 : INK4, fontWeight: isPeak ? 700 : 400 }}>S{i + 1}</span>
                  </div>
                )
              })}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, marginBottom: 4 }}>RYTM</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1.2 }}>{rhythm.label}</div>
              <div style={{ fontSize: 12, color: INK3, marginTop: 3 }}>{rhythm.detail}</div>
            </div>
          </div>
        </Surface>
      </div>

      {/* Season narrative */}
      <div style={{ padding: '28px 20px 0' }}>
        <SectionHeader label="Säsongen i korthet" />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {narrative.map((sentence, i) => (
            <p key={i} style={{ margin: 0, lineHeight: 1.6,
              fontSize: i === 0 ? 15 : 14,
              fontWeight: i === 0 ? 500 : 400,
              color: i === 0 ? 'rgba(244,245,247,0.88)' : i < 3 ? 'rgba(244,245,247,0.6)' : 'rgba(244,245,247,0.45)' }}>
              {sentence}
            </p>
          ))}
        </div>
      </div>
    </>
  )
}
