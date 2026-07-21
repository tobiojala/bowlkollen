'use client'

import { COLOR, FONT } from '@/lib/brand'
import { groupDivisionsByTier, TIER_COLOR } from '@/lib/division-standings'

type DivisionRow = { bits_division_id: number; name: string }

type Props = {
  divisions: DivisionRow[]
  loading: boolean
  onSelect: (division: { id: number; name: string }) => void
  onClose: () => void
}

export function DivisionBrowseOverlay({ divisions, loading, onSelect, onClose }: Props) {
  const groups = groupDivisionsByTier(divisions)

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 51, background: COLOR.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '70px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: COLOR.ink4 }}>
          Bläddra divisioner
        </span>
        <button
          onClick={onClose}
          style={{ background: COLOR.surface2, border: 'none', borderRadius: 100, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: COLOR.ink, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 40px' }}>
        {loading && (
          <div style={{ fontSize: 13, color: COLOR.ink3, padding: '20px 0' }}>Laddar divisioner…</div>
        )}

        {[...groups.entries()].map(([tier, tierDivs]) => {
          const tc = TIER_COLOR[tier] ?? COLOR.ink3
          return (
            <section key={tier} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: tc, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: tc, fontFamily: FONT.body, textTransform: 'uppercase' as const }}>
                  {tier}
                </span>
                <span style={{ fontSize: 11, color: COLOR.ink4 }}>{tierDivs.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {tierDivs.map((d, i) => (
                  <button
                    key={d.bits_division_id}
                    onClick={() => onSelect({ id: d.bits_division_id, name: d.name })}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: `1px solid ${COLOR.hairline}`,
                      borderTop: i === 0 ? `1px solid ${COLOR.hairline}` : 'none',
                      background: 'none', border: 'none', borderRadius: 0,
                      textAlign: 'left', cursor: 'pointer', width: '100%',
                      WebkitTapHighlightColor: 'transparent',
                    } as React.CSSProperties}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink, fontFamily: FONT.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.name}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLOR.ink4} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: 8 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
