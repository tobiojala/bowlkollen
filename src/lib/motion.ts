import type { Transition, Variants } from 'framer-motion'

// ── Spring presets ────────────────────────────────────────────────────────
// Use these instead of inventing transition configs per component.
export const spring = {
  // For content entering the viewport — gentle, no bounce
  soft:     { type: 'spring', stiffness: 260, damping: 28 } satisfies Transition,
  // Default interactive transitions — snappy but not jarring
  standard: { type: 'spring', stiffness: 380, damping: 30 } satisfies Transition,
  // Small UI elements: chips, badges, pills — fast feedback
  snappy:   { type: 'spring', stiffness: 500, damping: 32 } satisfies Transition,
  // Attention-grabbing: toasts, achievements — slight overshoot
  bounce:   { type: 'spring', stiffness: 400, damping: 18 } satisfies Transition,
}

// ── Page/section enter variants ───────────────────────────────────────────
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
}

export const slideUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: spring.soft },
}

export const slideInRight: Variants = {
  hidden:  { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: spring.standard },
}

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1,    transition: spring.bounce },
}

// Toast / overlay — enters from below, exits back down
export const toastVariants: Variants = {
  hidden:  { opacity: 0, y: 72, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: spring.bounce },
  exit:    { opacity: 0, y: 64, scale: 0.94, transition: { duration: 0.2, ease: 'easeIn' } },
}

// Sheet / bottom panel
export const sheetVariants: Variants = {
  hidden:  { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0, transition: spring.soft },
  exit:    { opacity: 0, y: '100%', transition: { duration: 0.22, ease: 'easeIn' } },
}

// ── List stagger ─────────────────────────────────────────────────────────
// Wrap a list container with this, children use any enter variant.
export const stagger = (delay = 0.06): Variants => ({
  hidden:  {},
  visible: { transition: { staggerChildren: delay } },
})

// ── Interactive tap presets ───────────────────────────────────────────────
// Spread onto <motion.button> or <motion.div>.
export const tap         = { whileTap: { scale: 0.96, transition: spring.snappy } }
export const tapStrong   = { whileTap: { scale: 0.90, transition: spring.snappy } }
export const tapBounce   = { whileTap: { scale: 0.93 }, whileHover: { scale: 1.03 }, transition: spring.bounce }

// ── Hover highlight ───────────────────────────────────────────────────────
export const hoverLift   = { whileHover: { y: -2, transition: spring.snappy } }
