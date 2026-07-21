'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Search, Users, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { COLOR, MOTION, RADIUS } from '@/lib/brand'

const TABS = [
  { icon: Home,     href: '/'          },
  { icon: Calendar, href: '/schema'    },
  { icon: Search,   href: '/discover'  },
  { icon: Users,    href: '/following' },
  { icon: User,     href: '/profile'   },
] as const

const SPRING    = { type: 'spring', stiffness: 380, damping: 36, mass: 0.85 } as const
const MINI_SIZE = 56

const HIDE_PATHS = [
  '/intern', '/laguttagning', '/tillganglighet',
  '/matches/', '/players/', '/teams/', '/compare/', '/hallar/',
]

export default function BottomNav() {
  const pathname     = usePathname()
  const router       = useRouter()
  const [expanded, setExpanded] = useState(true)
  const lastScroll   = useRef(0)
  const virtualY     = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [fullWidth, setFullWidth] = useState(335)

  // Reset to expanded on every route change (handles pages with internal scroll containers)
  useEffect(() => {
    setExpanded(true)
    lastScroll.current = 0
    virtualY.current = 0
  }, [pathname])

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setFullWidth(containerRef.current.offsetWidth)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 10) { setExpanded(true); lastScroll.current = y; return }
      if (y > lastScroll.current + 6)  setExpanded(false)
      else if (y < lastScroll.current - 6) setExpanded(true)
      lastScroll.current = y
    }
    const onVirtualScroll = (e: Event) => {
      const y = (e as CustomEvent<{ y: number }>).detail.y
      if (y < 10) { setExpanded(true); virtualY.current = y; return }
      if (y > virtualY.current + 6)  setExpanded(false)
      else if (y < virtualY.current - 6) setExpanded(true)
      virtualY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('bk-scroll', onVirtualScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('bk-scroll', onVirtualScroll)
    }
  }, [])

  if (HIDE_PATHS.some(p => pathname.includes(p))) return null

  const activeIdx = TABS.findIndex(t =>
    t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)
  )
  const current    = activeIdx === -1 ? 0 : activeIdx
  const collapsedX = fullWidth - MINI_SIZE
  const ActiveIcon = TABS[current].icon

  return (
    <>
      {/* Invisible measurement container — drives fullWidth */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          left:   'calc(max(0px, calc(50vw - 300px)) + 16px)',
          right:  'calc(max(0px, calc(50vw - 300px)) + 16px)',
          bottom: `calc(env(safe-area-inset-bottom) + 12px)`,
          height: 0, pointerEvents: 'none', zIndex: -1,
        }}
      />

      {/* Morphing pill */}
      <motion.div
        animate={{
          width:        expanded ? fullWidth : MINI_SIZE,
          height:       expanded ? 60        : MINI_SIZE,
          borderRadius: expanded ? RADIUS.pill : MINI_SIZE / 2,
          x:            expanded ? 0          : collapsedX,
        }}
        transition={SPRING}
        style={{
          position: 'fixed',
          left:   'calc(max(0px, calc(50vw - 300px)) + 16px)',
          bottom: `calc(env(safe-area-inset-bottom) + 12px)`,
          zIndex: 100,
          overflow: 'hidden',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          background: 'rgba(14,17,22,0.85)',
        }}
      >
        {/* Specular rim */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
          border: '0.5px solid rgba(255,255,255,0.14)',
          boxShadow: [
            'inset 0 1px 0 rgba(255,255,255,0.18)',
            'inset 0 -0.5px 0 rgba(255,255,255,0.04)',
            '0 16px 48px rgba(0,0,0,0.55)',
            '0 4px 14px rgba(0,0,0,0.35)',
          ].join(', '),
        }} />

        <AnimatePresence mode="wait" initial={false}>
          {expanded ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                padding: '0 8px',
              }}
            >
              {TABS.map((tab, i) => {
                const isActive = i === current
                const Icon     = tab.icon
                return (
                  <motion.button
                    key={tab.href}
                    onClick={() => router.push(tab.href)}
                    whileTap={{ scale: 0.88 }}
                    transition={SPRING}
                    style={{
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flex: '1 1 0', height: 48,
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {/* Sliding gold pill indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        transition={SPRING}
                        style={{
                          position: 'absolute', inset: '6px 4px',
                          borderRadius: RADIUS.lg,
                          background: 'linear-gradient(150deg, rgba(255,215,40,0.20) 0%, rgba(245,160,0,0.13) 100%)',
                          border: '1px solid rgba(245,194,0,0.40)',
                          boxShadow: [
                            'inset 0 1px 0 rgba(255,240,80,0.55)',
                            '0 0 20px rgba(245,194,0,0.28)',
                          ].join(', '),
                        }}
                      />
                    )}
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.3 : 1.7}
                      color={isActive ? COLOR.gold : COLOR.ink3}
                      style={{ position: 'relative', zIndex: 1, transition: `color ${MOTION.fast}s ease` } as React.CSSProperties}
                    />
                  </motion.button>
                )
              })}
            </motion.div>
          ) : (
            /* Mini — shows active tab icon, tap to expand */
            <motion.button
              key="mini"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ ...SPRING, duration: 0.18 }}
              onClick={() => setExpanded(true)}
              whileTap={{ scale: 0.86 }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none',
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ActiveIcon size={22} strokeWidth={2.3} color={COLOR.gold} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
