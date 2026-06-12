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
      <div style={{ width: '100%', maxWidth: 560, borderRadius: 20,
        background: '#1c2127',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flexShrink: 0, textAlign: 'center',
            minWidth: 64, background: 'rgba(245,194,0,0.1)', borderRadius: 14,
            padding: '10px 10px' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: GOLD,
              lineHeight: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {moment.score}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f4f5f7',
              lineHeight: 1.2, marginBottom: 4 }}>
              {moment.label}
            </div>
            <div style={{ fontSize: 13, color: MUTED }}>{moment.sub}</div>
          </div>
          <CIcon name={moment.iconName} size={22} color={GOLD} />
        </div>
      </div>
    </div>
  )
}
