'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const SPRING = { type: 'spring', stiffness: 260, damping: 22, mass: 0.9 } as const

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading]   = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('bk-splash')) return
    sessionStorage.setItem('bk-splash', '1')

    setVisible(true)
    // Start CSS fade at 1.6s, remove from DOM at 2.1s
    const t1 = setTimeout(() => setFading(true),  1600)
    const t2 = setTimeout(() => setVisible(false), 2100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0a0e17',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 28,
        // Pure CSS transition — reliable on every mobile browser
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.45s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Logo — spring bounce in (mount animation only, no exit needed) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.72, y: 16 }}
        animate={{ opacity: 1, scale: 1,   y: 0  }}
        transition={{ ...SPRING, delay: 0.08 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div style={{
          fontSize: 36, fontWeight: 900,
          letterSpacing: -1.5, lineHeight: 1,
          color: '#ffffff',
        }}>
          Bowl<span style={{ color: '#f5c200' }}>kollen</span>
        </div>
      </motion.div>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.2 }}
        style={{
          width: 52, height: 2, borderRadius: 2,
          background: 'rgba(255,255,255,0.10)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.3, delay: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg,rgba(245,194,0,0.7),#f5c200)',
            borderRadius: 2,
          }}
        />
      </motion.div>
    </div>
  )
}
