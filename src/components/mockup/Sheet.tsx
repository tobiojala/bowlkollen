export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes sheet-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .sheet-panel { animation: sheet-up 0.38s cubic-bezier(0.32,0.72,0,1) both; }
      `}</style>
      {/* Transparent backdrop — click to close; page overlay handles darkening */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'transparent' }} />
      <div className="sheet-panel noscroll"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, maxWidth: 600,
          margin: '0 auto', borderRadius: '22px 22px 0 0',
          background: 'rgba(11,18,30,0.70)',
          backdropFilter: 'blur(32px) saturate(220%) brightness(1.08)',
          WebkitBackdropFilter: 'blur(32px) saturate(220%) brightness(1.08)',
          borderTop: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
          padding: '20px 20px 44px', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 14px', color: 'rgba(255,255,255,0.45)', fontSize: 12, cursor: 'pointer' }}>Stäng</button>
        </div>
        {children}
      </div>
    </>
  )
}

export const CARD_W = 172, CARD_H = 224

export function Card({ children, accent, onExpand }: { children: React.ReactNode; accent?: string; onExpand: () => void }) {
  return (
    <div onClick={onExpand}
      style={{ width: CARD_W, minWidth: CARD_W, height: CARD_H, borderRadius: 20, flexShrink: 0, overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent ? accent + '28' : 'rgba(255,255,255,0.08)'}`,
        padding: '14px', display: 'flex', flexDirection: 'column', gap: 6,
        cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accent ? accent + '55' : 'rgba(255,255,255,0.18)'; e.currentTarget.style.boxShadow = `0 4px 20px ${accent ? accent + '15' : 'rgba(255,255,255,0.04)'}` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = accent ? accent + '28' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}>
      {children}
    </div>
  )
}

export function CardLabel({ text, isNew }: { text: string; isNew?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.32)', letterSpacing: 1.5 }}>{text}</span>
        {isNew && <span style={{ fontSize: 8, fontWeight: 700, color: '#5dcaa5', padding: '1px 5px', borderRadius: 6, background: 'rgba(93,202,165,0.12)', border: '1px solid rgba(93,202,165,0.25)' }}>NY</span>}
      </div>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)' }}>⤡</span>
    </div>
  )
}
