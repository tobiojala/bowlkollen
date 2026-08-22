'use client'

import { COLOR } from '@/lib/brand'
import { useColors } from '@/components/ThemeProvider'
import type { GenderPrognos } from './prognos'

// Honest live prognosis: the real top-4 of the Elitserien table (or TBD slots
// until the season has enough rounds), plus the SvBF format — never fabricated
// semifinal pairings, because #1 picks the opponent.
export function PrognosView({ prognos, seasonLabel }: { prognos: GenderPrognos; seasonLabel: string }) {
  const { C } = useColors()
  const rows = prognos.meaningful
    ? prognos.top4.map((t, i) => ({ seed: i + 1, name: t.teamName, sub: `${t.points} p · ${t.played} matcher` }))
    : [1, 2, 3, 4].map(n => ({ seed: n, name: 'Avgörs av grundserien', sub: null as string | null }))

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: C.textMuted, marginBottom: 4 }}>
        PROGNOS · SÄSONG {seasonLabel}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 16 }}>
        På väg till slutspel
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => {
          const settled = prognos.meaningful
          return (
            <div key={r.seed} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: C.surface, borderRadius: 14, padding: '12px 14px',
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800,
                background: r.seed === 1 ? COLOR.gold : `${C.text}14`,
                color: r.seed === 1 ? '#1a1400' : C.text,
              }}>{r.seed}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: settled ? C.text : C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </div>
                {r.sub && <div style={{ fontSize: 13, color: C.textMuted, marginTop: 1 }}>{r.sub}</div>}
              </div>
              {settled && r.seed === 1 && (
                <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: COLOR.gold }}>väljer motståndare</span>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, marginTop: 18 }}>
        Topp 4 går till SM-slutspel. <strong style={{ color: C.text }}>1:an väljer</strong> sin semifinalmotståndare
        (3:an eller 4:an); 2:an möter den kvarvarande. Sedan semifinaler, final (bäst av 3) och bronsmatch.
        {' '}Prognosen bygger på tabellen just nu och är inte officiell.
      </div>
    </div>
  )
}
