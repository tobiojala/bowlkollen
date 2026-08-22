'use client'

import { useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { COLOR, FONT } from '@/lib/brand'
import { useColors } from '@/components/ThemeProvider'
import { buildBrackets } from './bracket'
import { ChampionBracket } from './ChampionBracket'

type Tab = 'herrar' | 'damer'

const NAV_H = 56
const GOLD  = COLOR.gold

// Change to 'pagaende' when the event is live, 'kommande' before it starts
const STATUS = 'avslutad' as 'avslutad' | 'pagaende' | 'kommande'

export function SmSlutspelClient() {
  const { C } = useColors()
  // Deep-link the bracket: Elitserien Damer → ?gender=damer opens on Damer.
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('gender') === 'damer') return 'damer'
    return 'herrar'
  })
  const { herrar, damer } = useMemo(() => buildBrackets(), [])

  const activeBracket   = tab === 'herrar' ? herrar : damer
  const hasChampions    = STATUS === 'avslutad' && (!!herrar.champion || !!damer.champion)

  return (
    <main style={{ minHeight: '100dvh', background: C.bg, paddingTop: NAV_H, paddingBottom: 80 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* ── Gold accent line ────────────────────────────────────────────── */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />

        {hasChampions ? (
          /* ── CHAMPION HERO — first thing you see when the title is decided ── */
          <div style={{
            padding: '40px 20px 32px',
            borderBottom: `1px solid ${C.border}`,
            textAlign: 'center',
          }}>
            {/* Labels */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text,
                letterSpacing: 4, marginBottom: 6 }}>
                SVENSKA MÄSTARE {String(herrar.year).slice(2)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted,
                letterSpacing: 2.5 }}>
                SM-SLUTSPEL {String(herrar.year - 1).slice(2)}/{String(herrar.year).slice(2)}
              </div>
            </div>

            {/* Champion names — the hero */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {[
                { division: 'HERRAR', bracket: herrar },
                { division: 'DAMER',  bracket: damer  },
              ].map(({ division, bracket }) => bracket.champion && (
                <div key={division}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted,
                    letterSpacing: 1.5, marginBottom: 8 }}>
                    {division}
                  </div>

                  {/* Champion name — shimmer sweep + glow + definition stroke */}
                  <div style={{
                    fontFamily: FONT.display, fontSize: 34, fontWeight: 900,
                    letterSpacing: -1, lineHeight: 1.1,
                    background: 'linear-gradient(105deg, #b8860b 0%, #f5c200 25%, #fff8e1 42%, #ffffff 50%, #fff8e1 58%, #f5c200 75%, #b8860b 100%)',
                    backgroundSize: '250% auto',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.5)',
                    textShadow: '0 0 32px rgba(245,194,0,0.6), 0 0 80px rgba(245,194,0,0.2)',
                    animation: 'bk-champion-shimmer 3.5s linear infinite',
                  } as React.CSSProperties}>
                    {bracket.champion}
                  </div>

                  {bracket.story && (
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: C.text,
                      fontStyle: 'italic', fontWeight: 400,
                      marginTop: 14, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
                      {bracket.story}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Venue + date — footnote */}
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 28 }}>
              {herrar.venue} · {herrar.dates}
            </div>
          </div>

        ) : (
          /* ── EVENT HERO — before/during the event ───────────────────────── */
          <div style={{ padding: '28px 20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              {STATUS === 'pagaende' && (
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e05555',
                  boxShadow: '0 0 8px #e05555', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 11, fontWeight: 700,
                color: STATUS === 'pagaende' ? '#e05555' : C.textMuted, letterSpacing: 1.2 }}>
                {STATUS === 'pagaende' ? 'TÄVLING PÅGÅR' : 'KOMMANDE TÄVLING'}
              </span>
            </div>

            <div style={{ fontFamily: FONT.display, fontSize: 36, fontWeight: 900,
              letterSpacing: -1, color: C.text, lineHeight: 1 }}>
              SM-SLUTSPEL
            </div>
            <div style={{ fontFamily: FONT.display, fontSize: 22, fontWeight: 700,
              color: C.text, letterSpacing: -0.5, marginTop: 4, marginBottom: 12 }}>
              {herrar.year}/{String(herrar.year + 1).slice(2)}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted }}>
              {herrar.venue} · {herrar.dates}
            </div>
          </div>
        )}

        {/* ── Tab selector ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 6, padding: '16px 16px 0' }}>
          {(['herrar', 'damer'] as const).map(t => {
            const active = tab === t
            return (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: FONT.body, fontSize: 13, fontWeight: 700,
                  letterSpacing: 0.5, textTransform: 'uppercase' as const,
                  background: active ? GOLD : C.surface,
                  color:      active ? '#1a1400' : C.text,
                  transition: 'background 0.15s, color 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                } as React.CSSProperties}>
                {t === 'herrar' ? 'Herrar' : 'Damer'}
              </button>
            )
          })}
        </div>

        {/* ── Bracket ────────────────────────────────────────────────────── */}
        <ChampionBracket bracket={activeBracket} />

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
