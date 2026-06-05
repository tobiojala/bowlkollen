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
  const isMyHome = isDemo ? true : followedIds.has((m.home as any)?.id)

  const homeForm: FormResult[] = isDemo ? (MOCK_FORM[m.home.id] ?? []) : []
  const awayForm: FormResult[] = isDemo ? (MOCK_FORM[m.away.id] ?? []) : []
  const formColor = (r: FormResult) => r === 'W' ? '#5a82b4' : r === 'L' ? '#e05555' : C.textMuted

  return (
    <div style={{ padding: '12px 16px 0' }}>
      <a href={'/matches/' + m.id} style={{ display: 'block', borderRadius: 16, overflow: 'hidden', textDecoration: 'none',
        border: `1px solid ${isDark ? 'rgba(91,130,180,0.32)' : 'rgba(91,130,180,0.38)'}`,
        background: isDark
          ? 'linear-gradient(145deg, rgba(91,130,180,0.13) 0%, rgba(11,21,40,0.98) 100%)'
          : 'linear-gradient(145deg, rgba(91,130,180,0.08) 0%, rgba(248,248,252,1) 100%)',
        WebkitTapHighlightColor: 'transparent',
      } as any}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #5a82b4, rgba(91,130,180,0.15))' }} />
        <div style={{ padding: '14px 16px 16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#5a82b4', letterSpacing: 1.4, flex: 1 }}>DIN NÄSTA MATCH</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: divColor(m.division),
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              padding: '3px 8px', borderRadius: 4, letterSpacing: 0.3, marginRight: 8 }}>
              {shortDiv(m.division)}
            </span>
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onHide() }}
              style={{ padding: '3px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                fontSize: 9, fontWeight: 700, color: C.textMuted,
                WebkitTapHighlightColor: 'transparent' } as any}>
              dölj ↓
            </button>
          </div>

          {/* Teams + countdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Home */}
            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortName(m.home?.name || '')}
              </div>
              <div style={{ fontSize: 9, color: isMyHome ? '#5a82b4' : C.textMuted, fontWeight: isMyHome ? 700 : 400, marginTop: 3 }}>
                {isMyHome ? 'MITT LAG' : 'Hemma'}
              </div>
              {homeForm.length > 0 && (
                <>
                  <div style={{ fontSize: 7, color: C.textMuted, fontWeight: 600, letterSpacing: 0.8, marginTop: 6, textAlign: 'right' }}>FORM</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 3, marginTop: 3 }}>
                    {homeForm.map((r, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: formColor(r) }} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Countdown */}
            <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 88 }}>
              {cd ? (
                <>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.accent,
                    fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{cd}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 6 }}>
                    {dateLabel(dStr)} · {time}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{time}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4 }}>{dateLabel(dStr)}</div>
                </>
              )}
            </div>

            {/* Away */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortName(m.away?.name || '')}
              </div>
              <div style={{ fontSize: 9, color: !isMyHome ? '#5a82b4' : C.textMuted, fontWeight: !isMyHome ? 700 : 400, marginTop: 3 }}>
                {!isMyHome ? 'MITT LAG' : 'Borta'}
              </div>
              {awayForm.length > 0 && (
                <>
                  <div style={{ fontSize: 7, color: C.textMuted, fontWeight: 600, letterSpacing: 0.8, marginTop: 6 }}>FORM</div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                    {awayForm.map((r, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: formColor(r) }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Venue + oil profile */}
          {(m.venue || m.oilProfile) && (
            <div style={{ marginTop: 12, textAlign: 'center', fontSize: 10, color: C.textMuted }}>
              {[m.venue, m.oilProfile].filter(Boolean).join(' · ')}
            </div>
          )}

          {/* Stream pills or KOMMANDE indicator */}
          {streams.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 14 }}>
              {streams.map((s, idx) => {
                const ss = streamStyle(s.url)
                return (
                  <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: 10, fontWeight: 700, color: ss.color,
                      background: ss.bg, border: `1px solid ${ss.border}`,
                      borderRadius: 8, padding: '5px 10px', textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: 5,
                      WebkitTapHighlightColor: 'transparent' } as any}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color, flexShrink: 0, display: 'inline-block' }} />
                    {ss.label}
                  </a>
                )
              })}
            </div>
          ) : (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#5a82b4', opacity: 0.7 }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: '#5a82b4', letterSpacing: 1.2 }}>KOMMANDE</span>
            </div>
          )}
        </div>
      </a>
    </div>
  )
}
