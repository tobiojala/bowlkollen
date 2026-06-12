'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { useColors } from './ThemeProvider'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

/**
 * Revolut/Phantom-style bottom sheet.
 * Drag the handle pill down to dismiss, or tap the backdrop.
 * Only the handle triggers the drag — content area scrolls freely.
 */
export default function BottomSheet({ open, onClose, title, children }: Props) {
  const { C, isDark } = useColors()
  const drag = useDragControls()

  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — dark overlay only, no blur (blur is expensive on mobile GPU) */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.6)',
            }}
          />

          {/* Sheet panel */}
          <motion.div
            key="sheet-panel"
            drag="y"
            dragControls={drag}
            dragListener={false}      // only the handle starts the drag
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={(_, info) => { if (info.offset.y > 72) onClose() }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
              maxHeight: '90vh',
              borderRadius: '24px 24px 0 0',
              background: isDark ? '#0c1525' : '#f5f2ec',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.45)',
              // No overflow:hidden on the panel itself — iOS Safari renders fixed+overflow:hidden badly.
              // Overflow is controlled on the inner content div instead.
              willChange: 'transform',                // pre-promotes to GPU layer before animation
              WebkitTransform: 'translateZ(0)',        // iOS compositing hint
            } as React.CSSProperties}
          >
            {/* Drag handle — sole drag trigger, touch-action:none required for iOS pointer events */}
            <div
              onPointerDown={(e) => drag.start(e)}
              onTouchStart={(e) => e.stopPropagation()} // prevent scroll stealing on iOS
              style={{
                padding: '14px 0 8px',
                display: 'flex', justifyContent: 'center',
                cursor: 'grab',
                touchAction: 'none',   // prevents iOS from cancelling the pointer event
                userSelect: 'none',
              }}
            >
              <div style={{
                width: 36, height: 4, borderRadius: 2,
                background: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)',
              }} />
            </div>

            {/* Optional title row */}
            {title && (
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px 14px',
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</span>
                <button
                  onClick={onClose}
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                    border: 'none', borderRadius: 20,
                    width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: C.muted, fontSize: 18, lineHeight: 1,
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  } as React.CSSProperties}
                >
                  ×
                </button>
              </div>
            )}

            {/* Scrollable content */}
            <div style={{
              overflowY: 'auto',
              maxHeight: `calc(90vh - ${title ? 90 : 50}px)`,
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 32,
            } as React.CSSProperties}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
