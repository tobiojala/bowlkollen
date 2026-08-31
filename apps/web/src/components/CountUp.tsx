'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'

// Counts up 0 → `to` when scrolled into view. Correctness must never depend on
// the animation: if the observer never fires (mobile Safari, already-in-view on
// mount) or motion is reduced, we still show the real value — never a stuck 0.
export function CountUp({
  to,
  delay = 0,
  duration = 1.1,
}: {
  to: number
  delay?: number
  duration?: number
}) {
  const ref    = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduce = useReducedMotion()
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (reduce) { setVal(to); return }
    if (!inView) {
      // Safety net: if the observer hasn't fired shortly after mount, just show
      // the real number instead of leaving a false 0 on screen.
      const t = setTimeout(() => setVal(to), 600 + delay * 1000)
      return () => clearTimeout(t)
    }
    const controls = animate(0, to, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setVal(Math.round(v)),
      onComplete: () => setVal(to),
    })
    return controls.stop
  }, [inView, to, delay, duration, reduce])

  return <span ref={ref}>{val}</span>
}
