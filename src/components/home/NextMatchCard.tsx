import { dark } from '@/lib/colors'
import { shortName } from '@/lib/utils'
import type { Match } from '@/app/home/types'
import { countdown, dateLabel, divColor, shortDiv, streamStyle } from '@/app/home/helpers'

type FormResult = 'W' | 'L' | 'D'

const MOCK_FORM: Record<string, FormResult[]> = {
  'demo-t3': ['W', 'W', 'D', 'W', 'L'],
  'demo-t4': ['L', 'D', 'W', 'L', 'W'],
}

export default function NextMatchCard({ m, C, isDark, isDemo, followedIds, now, onHide }: {
  m: Match
  C: typeof dark
  isDark: boolean
  isDemo: boolean
  followedIds: Set<string>
  now: number
  onHide: () => void
}) {
  const cd       = countdown(m.date, now)
  const time     = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  const dStr     = m.date.slice(0, 10)
  const streams  = m.streams ?? []
  const isMyHome = isDemo ? true : followedIds.has(m.home?.id ?? '')

  const homeForm: FormResult[] = isDemo ? (MOCK_FORM[m.home.id] ?? []) : []
  const awayForm: FormResult[] = isDemo ? (MOCK_FORM[m.away.id] ?? []) : []
  const formColor = (r: FormResult) => r === 'W' ? '#5dcaa5' : r === 'L' ? '#e05555' : C.textMuted

  const inkFaint = isDark ? 'rgba(244,245,247,0.35)' : 'rgba(26,37,53,0.45)'

  return (
    <div style={{ padding: '12px 16px 0' }}>
      <a href={'/matches/' + m.id} style={{ display: 'block', borderRadius: 20, overflow: 'hidden', textDecoration: 'none',
        background: C.surface,
        WebkitTapHighlightColor: 'transparent',
      } as React.CSSProperties}>
        <div style={{ padding: '16px 16px 18px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: inkFaint, letterSpacing: 1, flex: 1 }}>DIN NÄSTA MATCH</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: divColor(m.division),
              padding: '3px 9px', borderRadius: 999, marginRight: 8,
              background: isDark ? 'rgba(244,245,247,0.06)' : 'rgba(0,0,0,0.05)' }}>
              {shortDiv(m.division)}
            </span>
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onHide() }}
              aria-label="Dölj"
              style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDark ? 'rgba(244,245,247,0.06)' : 'rgba(0,0,0,0.05)',
                fontSize: 13, lineHeight: 1, color: C.textMuted,
                WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
              ✕
            </button>
          </div>

          {/* Teams + countdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Home */}
            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: -0.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortName(m.home?.name || '')}
              </div>
              <div style={{ fontSize: 11, color: isMyHome ? C.text : C.textMuted, fontWeight: isMyHome ? 600 : 400, marginTop: 4 }}>
                {isMyHome ? 'Mitt lag' : 'Hemma'}
              </div>
              {homeForm.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 8 }}>
                  {homeForm.map((r, i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: formColor(r) }} />
                  ))}
                </div>
              )}
            </div>

            {/* Countdown — the one accent on this card */}
            <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 92 }}>
              {cd ? (
                <>
                  <div style={{ fontSize: 30, fontWeight: 900, color: C.accent,
                    fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: -0.5 }}>{cd}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                    {dateLabel(dStr)} · {time}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{time}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{dateLabel(dStr)}</div>
                </>
              )}
            </div>

            {/* Away */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: -0.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortName(m.away?.name || '')}
              </div>
              <div style={{ fontSize: 11, color: !isMyHome ? C.text : C.textMuted, fontWeight: !isMyHome ? 600 : 400, marginTop: 4 }}>
                {!isMyHome ? 'Mitt lag' : 'Borta'}
              </div>
              {awayForm.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {awayForm.map((r, i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: formColor(r) }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Venue + oil profile */}
          {(m.venue || m.oilProfile) && (
            <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: C.textMuted }}>
              {[m.venue, m.oilProfile].filter(Boolean).join(' · ')}
            </div>
          )}

          {/* Stream pills */}
          {streams.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 14, justifyContent: 'center' }}>
              {streams.map((s, idx) => {
                const ss = streamStyle(s.url)
                return (
                  <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: 11, fontWeight: 600, color: ss.color,
                      background: ss.bg,
                      borderRadius: 999, padding: '7px 12px', textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: 6,
                      WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color, flexShrink: 0, display: 'inline-block' }} />
                    {ss.label}
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </a>
    </div>
  )
}
