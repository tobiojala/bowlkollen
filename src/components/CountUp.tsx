'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

export function CountUp({
  to,
  delay = 0,
  duration = 1.1,
}: {
  to: number
  delay?: number
  duration?: number
}) {
  const ref  = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setVal(Math.round(v)),
    })
    return controls.stop
  }, [inView, to, delay, duration])

  return <span ref={ref}>{val}</span>
}
