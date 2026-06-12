export function Sheet({ title, subtitle, onClose, children }: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <>
      <style>{`
        @keyframes sheet-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .sheet-panel { animation: sheet-up 0.38s cubic-bezier(0.32,0.72,0,1) both; }
      `}</style>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99 }} />
      <div className="sheet-panel noscroll"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, maxWidth: 600,
          margin: '0 auto', background: '#1c2127', borderRadius: '28px 28px 0 0',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.45)',
          padding: '12px 20px calc(36px + env(safe-area-inset-bottom))', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(244,245,247,0.18)', borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, minHeight: 44, gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: '#f4f5f7', lineHeight: 1.2 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: 'rgba(244,245,247,0.40)', marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'rgba(244,245,247,0.08)', border: 'none', borderRadius: 999, width: 36, height: 36, color: 'rgba(244,245,247,0.6)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
        {children}
      </div>
    </>
  )
}

export const CARD_W = 172, CARD_H = 224

export function Card({ children, onExpand }: { children: React.ReactNode; accent?: string; onExpand: () => void }) {
  return (
    <div onClick={onExpand}
      style={{ width: CARD_W, minWidth: CARD_W, height: CARD_H, borderRadius: 20, flexShrink: 0, overflow: 'hidden',
        background: '#14171c',
        padding: '14px', display: 'flex', flexDirection: 'column', gap: 6,
        cursor: 'pointer', transition: 'background 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#1c2127' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#14171c' }}>
      {children}
    </div>
  )
}

export function CardLabel({ text, isNew }: { text: string; isNew?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(244,245,247,0.38)', letterSpacing: 1.2 }}>{text}</span>
        {isNew && <span style={{ fontSize: 10, fontWeight: 700, color: '#5dcaa5', padding: '1px 6px', borderRadius: 6, background: 'rgba(93,202,165,0.12)' }}>NY</span>}
      </div>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)' }}>⤡</span>
    </div>
  )
}
