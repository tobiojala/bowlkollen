'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { spring } from '@/lib/motion'

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'

interface RevealProps {
  children: React.ReactNode
  /** Entry direction. Default: 'up' */
  direction?: RevealDirection
  /** Travel distance in px. Default: 20 */
  distance?: number
  /** Animation start delay in seconds. Default: 0 */
  delay?: number
  /** Only animate once. Default: true */
  once?: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * Reveal — scroll-triggered entrance animation.
 *
 * Usage:
 *   <Reveal delay={0.08}><SomeSection /></Reveal>
 */
export default function Reveal({
  children,
  direction = 'up',
  distance = 20,
  delay = 0,
  once = true,
  className,
  style,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once })

  // Build start/end values inline so TypeScript can verify each property.
  const xHidden = direction === 'left' ? distance : direction === 'right' ? -distance : 0
  const yHidden = direction === 'up'   ? distance : direction === 'down'  ? -distance : 0
  const sHidden = direction === 'scale' ? 0.88 : 1

  const hidden  = { opacity: 0, x: xHidden, y: yHidden, scale: sHidden }
  const visible = { opacity: 1, x: 0, y: 0, scale: 1 }

  const transition = direction === 'scale'
    ? { ...spring.bounce, delay }
    : direction === 'fade'
    ? { duration: 0.36, ease: 'easeOut' as const, delay }
    : { ...spring.soft, delay }

  return (
    <motion.div
      ref={ref}
      initial={hidden}
      animate={inView ? visible : hidden}
      transition={transition}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}
