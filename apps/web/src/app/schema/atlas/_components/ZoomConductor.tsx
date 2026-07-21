'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'

type Props = {
  /** Pinch-in past the threshold → go up one altitude (month→year, year→karta) */
  onZoomOut:  () => void
  /** Pinch-out past the threshold → descend at the gesture's midpoint
   * (year → the month under your fingers). Omit when already at the bottom. */
  onZoomInAt?: (clientX: number, clientY: number) => void
  children:   React.ReactNode
}

const OUT_THRESHOLD = 0.78  // fingers closed to 78% of start distance
const IN_THRESHOLD  = 1.28  // fingers spread to 128%

/** Makes altitude changes feel like one continuous zoom (the iOS Photos
 * pattern): while two fingers move, the current view scales live under
 * them; releasing past a threshold commits to the next altitude, otherwise
 * it springs back. Trackpads join in via ctrl+wheel (browser pinch). */
export function ZoomConductor({ onZoomOut, onZoomInAt, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const scale = useMotionValue(1)
  const pinch = useRef<{ start: number; ratio: number; midX: number; midY: number } | null>(null)
  const wheelAcc = useRef(0)

  // Callbacks in a ref so the native listeners never go stale.
  const cb = useRef({ onZoomOut, onZoomInAt })
  useEffect(() => { cb.current = { onZoomOut, onZoomInAt } })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinch.current = {
        start: Math.hypot(dx, dy), ratio: 1,
        midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pinch.current || e.touches.length !== 2) return
      e.preventDefault() // own the gesture — no native scroll mid-pinch
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const ratio = Math.hypot(dx, dy) / pinch.current.start
      pinch.current.ratio = ratio
      pinch.current.midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      pinch.current.midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      scale.set(Math.max(0.62, Math.min(1.22, ratio)))
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!pinch.current || e.touches.length > 0) return
      const { ratio, midX, midY } = pinch.current
      pinch.current = null
      if (ratio < OUT_THRESHOLD) {
        cb.current.onZoomOut()
        scale.set(1) // next altitude enters at rest
      } else if (ratio > IN_THRESHOLD && cb.current.onZoomInAt) {
        cb.current.onZoomInAt(midX, midY)
        scale.set(1)
      } else {
        animate(scale, 1, { type: 'spring', stiffness: 320, damping: 28 })
      }
    }

    // Trackpad pinch arrives as ctrl+wheel — accumulate into the same moves.
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      wheelAcc.current += e.deltaY
      if (wheelAcc.current > 120) {
        wheelAcc.current = 0
        cb.current.onZoomOut()
      } else if (wheelAcc.current < -120) {
        wheelAcc.current = 0
        cb.current.onZoomInAt?.(e.clientX, e.clientY)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('wheel', onWheel)
    }
  }, [scale])

  return (
    <div ref={ref} style={{ height: '100%', overflow: 'hidden' }}>
      <motion.div style={{ height: '100%', scale, transformOrigin: '50% 40%' }}>
        {children}
      </motion.div>
    </div>
  )
}
