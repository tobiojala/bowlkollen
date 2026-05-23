'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, BarChart2, Users, LayoutGrid } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'

const TABS = [
  { label: 'Hem',    icon: Home,     href: '/' },
  { label: 'Schema', icon: Calendar,  href: '/schema' },
  { label: 'Tabell', icon: BarChart2, href: '/league' },
  { label: 'Lag',    icon: Users,     href: '/teams' },
  { label: 'Mer',    icon: LayoutGrid, href: '/mer' },
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
    <motion.nav
      animate={{ y: visible ? 0 : 80 }}
      transition={SPRING}
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        height: 68,
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: isDark ? '#0B1528' : 'rgba(255,255,255,0.97)',
        borderTop: isDark
          ? '0.5px solid rgba(255,255,255,0.07)'
          : '0.5px solid rgba(0,0,0,0.09)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <div className="flex items-center justify-around w-full px-1 pb-1.5">
        {TABS.map((tab, i) => {
          const isActive = i === current
          const Icon = tab.icon

          return (
            <motion.button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              whileTap={{ scale: 0.88 }}
              transition={SPRING}
              className="relative flex flex-col items-center justify-center gap-[5px] cursor-pointer border-0 bg-transparent select-none"
              style={{
                width: 64,
                height: 52,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* ─── Liquid capsule — morphs & slides between tabs ─── */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBackground"
                  transition={SPRING}
                  className="absolute rounded-[16px]"
                  style={{
                    inset: '3px 4px',
                    background: isDark
                      ? 'rgba(245,194,0,0.11)'
                      : 'rgba(245,194,0,0.09)',
                    border: '1px solid rgba(245,194,0,0.22)',
                    // Gold aura glow
                    boxShadow: isDark
                      ? '0 0 18px rgba(245,194,0,0.22), 0 0 36px rgba(245,194,0,0.08), inset 0 1px 0 rgba(245,194,0,0.18)'
                      : '0 0 14px rgba(245,194,0,0.18)',
                  }}
                />
              )}

              {/* ─── Icon — spring scale pop ─── */}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={SPRING}
                className="relative z-10 flex items-center justify-center"
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  color={isActive
                    ? '#f5c200'
                    : isDark
                      ? 'rgba(160,175,200,0.5)'
                      : 'rgba(0,0,0,0.35)'}
                />
              </motion.div>

              {/* ─── Label ─── */}
              <motion.span
                animate={{
                  color: isActive
                    ? '#f5c200'
                    : isDark
                      ? 'rgba(160,175,200,0.45)'
                      : 'rgba(0,0,0,0.38)',
                }}
                transition={{ duration: 0.14 }}
                className="relative z-10 font-bold leading-none"
                style={{ fontSize: 9, letterSpacing: '0.3px' }}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}
