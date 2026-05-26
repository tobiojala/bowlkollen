'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Trophy, Users, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'

const TABS = [
  { label: 'Hem',       icon: Home,     href: '/' },
  { label: 'Schema',    icon: Calendar, href: '/schema' },
  { label: 'Tävlingar', icon: Trophy,   href: '/tavlingar' },
  { label: 'Lag',       icon: Users,    href: '/teams' },
  { label: 'Puls',      icon: Activity, href: '/puls' },
]

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

const HIDE_PATHS = [
  '/intern', '/laguttagning', '/tillganglighet',
  '/matches/', '/players/', '/teams/', '/compare/', '/hallar/', '/klotshopar/',
]

export default function BottomNav() {
  const pathname  = usePathname()
  const router    = useRouter()
  const { theme } = useTheme()
  const isDark    = theme === 'dark'

  const [visible, setVisible] = useState(true)
  const lastScroll = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 10) { setVisible(true); lastScroll.current = y; return }
      if (y > lastScroll.current + 6) setVisible(false)
      else if (y < lastScroll.current - 6) setVisible(true)
      lastScroll.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (HIDE_PATHS.some(p => pathname.includes(p))) return null

  const activeIdx = TABS.findIndex(t =>
    t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)
  )
  const current = activeIdx === -1 ? 0 : activeIdx

  // Glass shell colors
  const glassBg = isDark
    ? 'rgba(10,18,35,0.62)'
    : 'rgba(255,255,255,0.52)'
  const glassBorder = isDark
    ? 'rgba(255,255,255,0.13)'
    : 'rgba(0,0,0,0.07)'
  const glassShadow = isDark
    ? '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.14)'
    : '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.70)'

  return (
    <motion.div
      animate={{ y: visible ? 0 : 110 }}
      transition={SPRING}
      style={{
        position: 'fixed',
        left: 14,
        right: 14,
        bottom: `calc(env(safe-area-inset-bottom) + 10px)`,
        zIndex: 50,
        borderRadius: 28,
        background: glassBg,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: `0.5px solid ${glassBorder}`,
        boxShadow: glassShadow,
        height: 62,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%', padding: '0 4px' }}>
        {TABS.map((tab, i) => {
          const isActive = i === current
          const Icon = tab.icon

          return (
            <motion.button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              whileTap={{ scale: 0.86 }}
              transition={SPRING}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                width: 62,
                height: 50,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
              }}
            >
              {/* ── Frosted active capsule ── */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  transition={SPRING}
                  style={{
                    position: 'absolute',
                    inset: '3px 4px',
                    borderRadius: 18,
                    background: isDark
                      ? 'rgba(245,194,0,0.12)'
                      : 'rgba(245,194,0,0.10)',
                    border: '0.5px solid rgba(245,194,0,0.28)',
                    boxShadow: isDark
                      ? '0 0 20px rgba(245,194,0,0.20), 0 0 40px rgba(245,194,0,0.08), inset 0 1px 0 rgba(255,255,255,0.18)'
                      : '0 0 14px rgba(245,194,0,0.16), inset 0 1px 0 rgba(255,255,255,0.60)',
                  }}
                />
              )}

              {/* ── Icon ── */}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                transition={SPRING}
                style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  color={isActive
                    ? '#f5c200'
                    : isDark
                      ? 'rgba(160,175,200,0.48)'
                      : 'rgba(0,0,0,0.32)'}
                />
              </motion.div>

              {/* ── Label ── */}
              <motion.span
                animate={{
                  color: isActive
                    ? '#f5c200'
                    : isDark ? 'rgba(160,175,200,0.42)' : 'rgba(0,0,0,0.36)',
                }}
                transition={{ duration: 0.13 }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  lineHeight: 1,
                }}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
