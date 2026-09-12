'use client'

import { X } from 'lucide-react'
import { SessionLogger } from '@/app/mina-spel/_components/SessionLogger'

const INK = '#f4f5f7', INK3 = 'rgba(244,245,247,0.56)', SURFACE = '#14171c'

// Quick logbook entry — the same pin-deck session logger as Mina spel (scores
// series, captures leaves, center/oil/käglor/note), opened in a bottom sheet.
export function LogEntrySheet({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, background: SURFACE, borderRadius: '20px 20px 0 0', padding: 20, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: INK }}>Logga spel</span>
          <button onClick={onClose} aria-label="Stäng" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={24} color={INK3} /></button>
        </div>
        <SessionLogger onSaved={onClose} />
      </div>
    </div>
  )
}
