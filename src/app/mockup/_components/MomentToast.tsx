'use client'

import { CIcon } from '@/components/mockup/StatCards'
import { COLORS } from '../data'

const { GOLD, MUTED } = COLORS

interface MomentToastProps {
  moment: { score: string; label: string; sub: string; iconName: string }
  momentIdx: number
}

export default function MomentToast({ moment, momentIdx }: MomentToastProps) {
  return (
    <div key={momentIdx} className="toast-card"
      style={{ position: 'fixed', bottom: 88, left: 0, right: 0, zIndex: 200,
        display: 'flex', justifyContent: 'center', padding: '0 20px',
        pointerEvents: 'none' }}>
      <div style={{ width: '100%', maxWidth: 560, borderRadius: 18,
        background: 'rgba(11,18,30,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(245,194,0,0.45)',
        boxShadow: '0 8px 40px rgba(245,194,0,0.25), 0 2px 12px rgba(0,0,0,0.5)',
        overflow: 'hidden' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #f5c200, rgba(245,194,0,0.2))' }} />
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flexShrink: 0, textAlign: 'center',
            minWidth: 64, background: 'rgba(245,194,0,0.1)', borderRadius: 12,
            padding: '8px 10px', border: '1px solid rgba(245,194,0,0.25)' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: GOLD,
              lineHeight: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {moment.score}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'white',
              lineHeight: 1.2, marginBottom: 4 }}>
              {moment.label}
            </div>
            <div style={{ fontSize: 12, color: MUTED }}>{moment.sub}</div>
          </div>
          <CIcon name={moment.iconName} size={22} color={GOLD} />
        </div>
      </div>
    </div>
  )
}
