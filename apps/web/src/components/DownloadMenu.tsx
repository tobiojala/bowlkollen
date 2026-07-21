'use client'

import { useState, useRef, useEffect } from 'react'
import { Download } from 'lucide-react'
import { COLOR } from '@/lib/brand'

export type CsvScope = 'all' | 'upcoming' | 'played'

const ITEMS: { scope: CsvScope; label: string }[] = [
  { scope: 'all',      label: 'Hela säsongen'   },
  { scope: 'upcoming', label: 'Endast kommande' },
  { scope: 'played',   label: 'Endast spelade'  },
]

const ghost: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '6px 2px',
  background: 'none', border: 'none',
  color: COLOR.ink2, fontSize: 14, fontWeight: 600,
  cursor: 'pointer', WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
}

/** "Ladda ner" ghost button that opens a small scope menu and calls back with
 * the pick. Menu anchored right so it stays on-screen on narrow phones. */
export function DownloadMenu({ onPick }: { onPick: (scope: CsvScope) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={ghost} aria-haspopup="menu" aria-expanded={open}>
        <Download size={16} strokeWidth={2} color={COLOR.ink2} />
        Ladda ner
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30,
            minWidth: 180, padding: 6,
            background: COLOR.surface2, border: `1px solid ${COLOR.hairline}`,
            borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
          }}
        >
          {ITEMS.map(it => (
            <button
              key={it.scope}
              role="menuitem"
              onClick={() => { setOpen(false); onPick(it.scope) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 12px', borderRadius: 8,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: COLOR.ink, fontSize: 14, fontWeight: 600,
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = COLOR.surface)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
