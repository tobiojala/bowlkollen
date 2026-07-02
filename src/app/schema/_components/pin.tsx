'use client'

import { useCallback, useState } from 'react'
import { COLOR } from '@/lib/brand'

const KEY = 'bk-atlas-pin'
const todayStr = new Date().toISOString().slice(0, 10)

/** The Atlas pin — "you are here" on the season map. Defaults to today;
 * moves to wherever the user last dove into the feed from (commitWeek),
 * so returning to the Atlas always shows where the journey started. */
export function usePinnedDate(): [string, (d: string) => void] {
  const [pin, setPinState] = useState<string>(() => {
    if (typeof window === 'undefined') return todayStr
    return localStorage.getItem(KEY) ?? todayStr
  })
  const setPin = useCallback((d: string) => {
    setPinState(d)
    try { localStorage.setItem(KEY, d) } catch { /* private mode */ }
  }, [])
  return [pin, setPin]
}

/** Map-pin glyph, gold with a dark keyline so it reads on any cell color.
 * Anchored by its tip: place with left/top at the target point and it
 * points exactly there. */
export function PinGlyph({ size = 16 }: { size?: number }) {
  const w = size, h = Math.round(size * 1.3)
  return (
    <svg width={w} height={h} viewBox="0 0 16 21" style={{ display: 'block', overflow: 'visible',
      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
      <path d="M8 0C3.6 0 0 3.6 0 8c0 6 8 13 8 13s8-7 8-13c0-4.4-3.6-8-8-8z"
        fill={COLOR.gold} stroke="#0b0d10" strokeWidth="1.4" />
      <circle cx="8" cy="7.8" r="2.8" fill="#0b0d10" />
    </svg>
  )
}
