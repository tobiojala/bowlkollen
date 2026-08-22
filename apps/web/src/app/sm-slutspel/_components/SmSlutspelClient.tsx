'use client'

import { useMemo, useState } from 'react'
import { COLOR, FONT } from '@/lib/brand'
import { useColors } from '@/components/ThemeProvider'
import { buildBrackets } from './bracket'
import { ChampionBracket } from './ChampionBracket'
import { PrognosView } from './PrognosView'
import { useSlutspelPrognos, type GenderPrognos } from './prognos'

type Tab = 'herrar' | 'damer'
type View = 'resultat' | 'kommande'
const EMPTY_PROGNOS: GenderPrognos = { top4: [], meaningful: false }

const NAV_H = 56
const GOLD  = COLOR.gold

export function SmSlutspelClient() {
  const { C } = useColors()
  // Deep-link the bracket: Elitserien Damer → ?gender=damer opens on Damer.
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('gender') === 'damer') return 'damer'
    return 'herrar'
  })
  const { herrar, damer } = useMemo(() => buildBrackets(), [])

  const [view, setView] = useState<View>('resultat')
  const { data: prognos } = useSlutspelPrognos()
  const activeBracket   = tab === 'herrar' ? herrar : damer
  const activePrognos   = (tab === 'herrar' ? prognos?.herrar : prognos?.damer) ?? EMPTY_PROGNOS
  const genderLabel     = tab === 'herrar' ? 'HERRAR' : 'DAMER'
  // Finished season (the played slutspel) vs the season now heading to slutspel.
  const playedLabel     = `${String(herrar.year - 1).slice(2)}/${String(herrar.year).slice(2)}`       // 25/26
  const nextLabel       = `${String(herrar.year).slice(2)}/${String(herrar.year + 1).slice(2)}`        // 26/27

  return (
    <main style={{ minHeight: '100dvh', background: C.bg, paddingTop: NAV_H, paddingBottom: 80 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* ── Gold accent line ────────────────────────────────────────────── */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />

        {/* ── Gender selector (deep-linked from the Elitserien division) ───── */}
        <div style={{ display: 'flex', gap: 6, padding: '16px 16px 0' }}>
          {(['herrar', 'damer'] as const).map(t => {
            const active = tab === t
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: FONT.body, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' as const,
                background: active ? GOLD : C.surface, color: active ? '#1a1400' : C.text,
                WebkitTapHighlightColor: 'transparent',
              } as React.CSSProperties}>
                {t === 'herrar' ? 'Herrar' : 'Damer'}
              </button>
            )
          })}
        </div>

        {/* ── Season selector — 25/26 (mästare) vs 26/27 (kommande) ───────── */}
        <div style={{ display: 'flex', gap: 6, padding: '8px 16px 0' }}>
          {([['resultat', playedLabel], ['kommande', nextLabel]] as const).map(([v, label]) => {
            const active = view === v
            return (
              <button key={v} onClick={() => setView(v)} style={{
                flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: FONT.body, fontSize: 13, fontWeight: 700, letterSpacing: 0.4,
                background: active ? C.surface : 'transparent', color: active ? C.text : C.textMuted,
                WebkitTapHighlightColor: 'transparent',
              }}>{label}</button>
            )
          })}
        </div>

        {view === 'resultat' ? (
          /* ── 25/26 — this gender's champion + bracket ────────────────────── */
          <>
            {activeBracket.champion && (
              <div style={{ padding: '36px 20px 28px', borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: 4, marginBottom: 6 }}>
                  SVENSKA MÄSTARE
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 2.5, marginBottom: 28 }}>
                  {genderLabel} · SM-SLUTSPEL {playedLabel}
                </div>
                <div style={{
                  fontFamily: FONT.display, fontSize: 34, fontWeight: 900, letterSpacing: -1, lineHeight: 1.1,
                  background: 'linear-gradient(105deg, #b8860b 0%, #f5c200 25%, #fff8e1 42%, #ffffff 50%, #fff8e1 58%, #f5c200 75%, #b8860b 100%)',
                  backgroundSize: '250% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent', WebkitTextStroke: '0.5px rgba(0,0,0,0.5)',
                  textShadow: '0 0 32px rgba(245,194,0,0.6), 0 0 80px rgba(245,194,0,0.2)',
                  animation: 'bk-champion-shimmer 3.5s linear infinite',
                } as React.CSSProperties}>
                  {activeBracket.champion}
                </div>
                {activeBracket.story && (
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: C.text, fontStyle: 'italic',
                    marginTop: 14, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                    {activeBracket.story}
                  </p>
                )}
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 24 }}>
                  {activeBracket.venue} · {activeBracket.dates}
                </div>
              </div>
            )}
            <ChampionBracket bracket={activeBracket} />
          </>
        ) : (
          /* ── 26/27 — this gender's live prognosis ────────────────────────── */
          <PrognosView prognos={activePrognos} seasonLabel={prognos?.seasonLabel ?? nextLabel} />
        )}

      </div>

      <style>{`
        @keyframes bk-champion-shimmer {
          0%   { background-position: -100% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </main>
  )
}
