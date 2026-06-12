'use client'

import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'

export type CardElevation = 'flat' | 'raised' | 'floating'

interface GlassCardProps {
  children: React.ReactNode
  /** Visual depth level. Default: 'raised' */
  elevation?: CardElevation
  /**
   * Hex or rgba accent color.
   * Drives ambient glow on 'floating', border tint on 'raised',
   * and top accent stripe when `accent` is true.
   */
  accentColor?: string
  /** Render a 2px gradient accent stripe at the top of the card. */
  accent?: boolean
  /**
   * Add a shimmer sweep animation across the card surface.
   * Use for earned achievements, special unlocks.
   * Requires overflow:hidden — automatically applied.
   */
  shimmer?: boolean
  /** Whether the card is interactive (adds tap feedback). */
  onClick?: React.MouseEventHandler<HTMLDivElement>
  className?: string
  style?: React.CSSProperties
  as?: 'div' | 'a' | 'button'
  href?: string
}

// ── Style builders ────────────────────────────────────────────────────────

function resolveGlow(color: string, strength: 'soft' | 'strong') {
  const s = strength === 'strong' ? '0.30' : '0.15'
  const s2 = strength === 'strong' ? '0.14' : '0.06'
  return `0 0 32px ${color.replace(')', `, ${s})`).replace('rgb(', 'rgba(').replace('#', 'rgba(').replace(/rgba\((.{6})/, (_m, h) => {
    // hex → rgb fallback handled below
    return `rgba(${h}`
  })}, 0 0 10px ${color}${s2 === '0.06' ? '0f' : '24'}`
}

function hexToRgb(hex: string): string {
  // Handles #rrggbb and #rgb
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    return `${parseInt(clean[0]+clean[0],16)},${parseInt(clean[1]+clean[1],16)},${parseInt(clean[2]+clean[2],16)}`
  }
  return `${parseInt(clean.slice(0,2),16)},${parseInt(clean.slice(2,4),16)},${parseInt(clean.slice(4,6),16)}`
}

function buildBoxShadow(elevation: CardElevation, accentColor?: string): string {
  const base: Record<CardElevation, string> = {
    flat:     'none',
    raised:   '0 4px 20px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.10)',
    floating: '0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.30), inset 0 1.5px 0 rgba(255,255,255,0.20)',
  }
  if (!accentColor || elevation === 'flat') return base[elevation]

  const rgb = accentColor.startsWith('#') ? hexToRgb(accentColor) : null
  const glow = rgb
    ? `0 0 36px rgba(${rgb},0.28), 0 0 12px rgba(${rgb},0.12)`
    : `0 0 36px ${accentColor}46, 0 0 12px ${accentColor}1f`

  return elevation === 'floating'
    ? `${base[elevation]}, ${glow}`
    : `${base[elevation]}, 0 0 20px ${accentColor}${rgb ? '26' : '1a'}`
}

function buildBorder(elevation: CardElevation, accentColor?: string): string {
  if (elevation === 'flat')     return '1px solid rgba(255,255,255,0.07)'
  if (elevation === 'raised')   return `1px solid ${accentColor ? accentColor + '28' : 'rgba(255,255,255,0.10)'}`
  // floating
  return `1px solid ${accentColor ? accentColor + '35' : 'rgba(255,255,255,0.14)'}`
}

function buildBackground(elevation: CardElevation): string {
  if (elevation === 'flat')     return 'rgba(255,255,255,0.03)'
  if (elevation === 'raised')   return 'rgba(24,36,56,0.88)'
  // floating
  return 'linear-gradient(160deg, rgba(26,38,60,0.97) 0%, rgba(14,20,32,0.98) 100%)'
}

const RADIUS: Record<CardElevation, string> = {
  flat:     '14px',
  raised:   '16px',
  floating: '20px',
}

// ── Component ─────────────────────────────────────────────────────────────

export default function GlassCard({
  children,
  elevation = 'raised',
  accentColor,
  accent = false,
  shimmer = false,
  onClick,
  className,
  style,
}: GlassCardProps) {
  const isInteractive = !!onClick
  const radius = RADIUS[elevation]

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    borderRadius: radius,
    border: buildBorder(elevation, accentColor),
    background: buildBackground(elevation),
    boxShadow: buildBoxShadow(elevation, accentColor),
    overflow: shimmer ? 'hidden' : 'visible',
    ...(elevation !== 'flat' && {
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
    }),
    cursor: isInteractive ? 'pointer' : undefined,
    WebkitTapHighlightColor: 'transparent',
    ...style,
  }

  const inner = (
    <>
      {/* Specular rim — always on raised/floating */}
      {elevation !== 'flat' && (
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 'inherit',
          border: '0.5px solid rgba(255,255,255,0.18)',
          boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.22)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      )}

      {/* Top accent stripe */}
      {accent && accentColor && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}60 60%, transparent 100%)`,
          borderRadius: `${radius} ${radius} 0 0`,
          pointerEvents: 'none',
          zIndex: 2,
        }} />
      )}

      {/* Shimmer sweep */}
      {shimmer && (
        <div className="shimmer-sweep" style={{
          position: 'absolute', inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          zIndex: 3,
        }} />
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 4 }}>
        {children}
      </div>
    </>
  )

  if (isInteractive) {
    return (
      <motion.div
        className={className}
        style={baseStyle}
        onClick={onClick}
        whileTap={{ scale: 0.975, transition: spring.snappy }}
        whileHover={{ y: -1, transition: spring.snappy }}
      >
        {inner}
      </motion.div>
    )
  }

  return (
    <div className={className} style={baseStyle}>
      {inner}
    </div>
  )
}
