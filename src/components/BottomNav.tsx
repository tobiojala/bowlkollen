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

  return (
    <motion.div
      animate={{ y: visible ? 0 : 110 }}
      transition={SPRING}
      style={{
        position: 'fixed',
        left: 32, right: 32,
        bottom: `calc(env(safe-area-inset-bottom) + 12px)`,
        zIndex: 50,
        height: 64,
        borderRadius: 32,
        // iOS-style liquid glass: low blur, nearly clear, specular rim does the work
        backdropFilter: 'blur(6px) saturate(180%) brightness(1.12)',
        WebkitBackdropFilter: 'blur(6px) saturate(180%) brightness(1.12)',
        background: isDark
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(255,255,255,0.28)',
        border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.80)'}`,
        boxShadow: isDark
          ? [
              'inset 0 1px 0 rgba(255,255,255,0.55)',
              'inset 0 -0.5px 0 rgba(255,255,255,0.08)',
              'inset 1px 0 0 rgba(255,255,255,0.10)',
              'inset -1px 0 0 rgba(255,255,255,0.10)',
              '0 8px 32px rgba(0,0,0,0.45)',
              '0 2px 8px rgba(0,0,0,0.28)',
            ].join(', ')
          : [
              'inset 0 1px 0 rgba(255,255,255,0.90)',
              'inset 0 -0.5px 0 rgba(0,0,0,0.06)',
              '0 8px 32px rgba(0,0,0,0.12)',
              '0 2px 8px rgba(0,0,0,0.07)',
            ].join(', '),
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        width: '100%', height: '100%', padding: '0 4px',
      }}>
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
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, width: 56, height: 54,
                background: 'transparent', border: 'none',
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
              }}
            >
              {/* Gold active capsule */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  transition={SPRING}
                  style={{
                    position: 'absolute', inset: '4px 3px', borderRadius: 18,
                    background: isDark
                      ? 'linear-gradient(160deg, rgba(255,210,40,0.22) 0%, rgba(245,164,0,0.14) 100%)'
                      : 'linear-gradient(160deg, rgba(255,230,80,0.40) 0%, rgba(245,180,0,0.22) 100%)',
                    border: '1px solid rgba(245,194,0,0.50)',
                    boxShadow: isDark
                      ? [
                          'inset 0 1.5px 0 rgba(255,235,80,0.65)',
                          'inset 0 -0.5px 0 rgba(160,100,0,0.30)',
                          '0 0 28px rgba(245,194,0,0.40)',
                          '0 0 8px rgba(245,194,0,0.25)',
                        ].join(', ')
                      : [
                          'inset 0 1.5px 0 rgba(255,245,120,0.90)',
                          'inset 0 -0.5px 0 rgba(160,100,0,0.14)',
                          '0 0 24px rgba(245,194,0,0.35)',
                          '0 0 8px rgba(245,194,0,0.20)',
                        ].join(', '),
                  }}
                />
              )}

              <motion.div
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                transition={SPRING}
                style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  color={isActive
                    ? '#f5c200'
                    : isDark ? 'rgba(255,255,255,0.82)' : 'rgba(20,30,55,0.62)'}
                />
              </motion.div>

              <motion.span
                animate={{
                  color: isActive
                    ? '#f5c200'
                    : isDark ? 'rgba(255,255,255,0.75)' : 'rgba(20,30,55,0.58)',
                }}
                transition={{ duration: 0.13 }}
                style={{
                  position: 'relative', zIndex: 1,
                  fontSize: 10, fontWeight: 800,
                  letterSpacing: '0.3px', lineHeight: 1,
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
