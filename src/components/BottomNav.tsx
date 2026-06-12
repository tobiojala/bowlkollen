'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Trophy, Users, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'

const TABS = [
  { label: 'Hem',       icon: Home,     href: '/' },
  { label: 'Schema',    icon: Calendar, href: '/schema' },
  { label: 'Tävlingar', icon: Trophy,   href: '/tavlingar' },
  { label: 'Klubbar',   icon: Users,    href: '/teams' },
  { label: 'Puls',      icon: Activity, href: '/puls' },
]

const SPRING = { type: 'spring', stiffness: 380, damping: 36, mass: 0.85 } as const

const HIDE_PATHS = [
  '/intern', '/laguttagning', '/tillganglighet',
  '/matches/', '/players/', '/teams/', '/compare/', '/hallar/', '/klotshopar/',
]

const MINI_SIZE = 56

export default function BottomNav() {
  const pathname  = usePathname()
  const router    = useRouter()
  const { theme } = useTheme()
  const isDark    = theme === 'dark'

  const [expanded, setExpanded] = useState(true)
  const lastScroll  = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [fullWidth,  setFullWidth]  = useState(335)

  // Measure container so we can animate to exact pixel width
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
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (HIDE_PATHS.some(p => pathname.includes(p))) return null

  const activeIdx = TABS.findIndex(t =>
    t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)
  )
  const current = activeIdx === -1 ? 0 : activeIdx

  // When collapsed: x offset so the pill sits at the right side of the container
  const collapsedX = fullWidth - MINI_SIZE

  const glassBase: React.CSSProperties = {
    backdropFilter: 'blur(20px) saturate(180%) brightness(1.06)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%) brightness(1.06)',
    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
  }

  return (
    <>
      {/* SVG lens warp filter */}
      <svg style={{ position: 'fixed', width: 0, height: 0, top: 0, left: 0 }} aria-hidden="true">
        <defs>
          <filter id="bk-pill-lens" x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix"
              values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 0" result="alphaMask" />
            <feGaussianBlur in="alphaMask" stdDeviation="18" result="grad" />
            <feComponentTransfer in="grad" result="steep">
              <feFuncR type="gamma" exponent="0.35" amplitude="1" offset="0"/>
              <feFuncG type="gamma" exponent="0.35" amplitude="1" offset="0"/>
            </feComponentTransfer>
            <feOffset in="steep" dx="-24" result="sL" />
            <feOffset in="steep" dx="24"  result="sR" />
            <feComposite in="sR" in2="sL" operator="arithmetic" k1="0" k2="0.5" k3="-0.5" k4="0.5" result="xG" />
            <feOffset in="steep" dy="-24" result="sU" />
            <feOffset in="steep" dy="24"  result="sD" />
            <feComposite in="sD" in2="sU" operator="arithmetic" k1="0" k2="0.5" k3="-0.5" k4="0.5" result="yG" />
            <feColorMatrix in="xG" type="matrix"
              values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 1" result="xOnly" />
            <feColorMatrix in="yG" type="matrix"
              values="0 0 0 0 0.5  1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 1" result="yOnly" />
            <feComposite in="xOnly" in2="yOnly" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" result="disp" />
            <feDisplacementMap in="SourceGraphic" in2="disp" scale="-130"
              xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feComposite in="displaced" in2="alphaMask" operator="in" />
          </filter>
        </defs>
      </svg>

      {/* Measurement container — full width, invisible, just for sizing */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          left: 20, right: 20,
          bottom: `calc(env(safe-area-inset-bottom) + 12px)`,
          height: 0, pointerEvents: 'none', zIndex: -1,
        }}
      />

      {/* The pill — morphs between full bar and mini circle */}
      <motion.div
        animate={{
          width:        expanded ? fullWidth : MINI_SIZE,
          height:       expanded ? 68 : MINI_SIZE,
          borderRadius: expanded ? 34 : MINI_SIZE / 2,
          x:            expanded ? 0  : collapsedX,
        }}
        transition={SPRING}
        style={{
          position: 'fixed',
          left: 20,
          bottom: `calc(env(safe-area-inset-bottom) + 12px)`,
          zIndex: 50,
          overflow: 'hidden',
          ...glassBase,
        }}
      >
        {/* Specular rim + shadow — always visible */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
          border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)'}`,
          boxShadow: isDark
            ? [
                'inset 0 1px 0 rgba(255,255,255,0.50)',
                'inset 0 -0.5px 0 rgba(255,255,255,0.06)',
                '0 12px 40px rgba(0,0,0,0.50)',
                '0 4px 12px rgba(0,0,0,0.32)',
              ].join(', ')
            : [
                'inset 0 1px 0 rgba(255,255,255,0.95)',
                '0 12px 40px rgba(0,0,0,0.14)',
                '0 4px 12px rgba(0,0,0,0.08)',
              ].join(', '),
        }} />

        {/* Content — swaps between full tabs and mini home */}
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
                const Icon = tab.icon

                return (
                  <motion.button
                    key={tab.href}
                    onClick={() => router.push(tab.href)}
                    whileTap={{ scale: 0.88 }}
                    transition={SPRING}
                    style={{
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      height: 48,
                      padding: isActive ? '0 14px' : '0',
                      flex: isActive ? '0 0 auto' : '1 1 0',
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        transition={SPRING}
                        style={{
                          position: 'absolute', inset: '4px 0',
                          borderRadius: 20,
                          background: isDark
                            ? 'linear-gradient(150deg, rgba(255,215,40,0.22) 0%, rgba(245,160,0,0.15) 100%)'
                            : 'linear-gradient(150deg, rgba(255,235,80,0.55) 0%, rgba(245,180,0,0.30) 100%)',
                          border: `1px solid rgba(245,194,0,${isDark ? '0.45' : '0.50'})`,
                          boxShadow: isDark
                            ? 'inset 0 1.5px 0 rgba(255,240,80,0.60), 0 0 24px rgba(245,194,0,0.35)'
                            : 'inset 0 1.5px 0 rgba(255,248,120,0.90), 0 0 20px rgba(245,194,0,0.28)',
                        }}
                      />
                    )}

                    <motion.div
                      style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                    >
                      <Icon
                        size={isActive ? 20 : 22}
                        strokeWidth={isActive ? 2.3 : 1.7}
                        color={isActive ? '#f5c200' : isDark ? 'rgba(255,255,255,0.75)' : 'rgba(20,30,55,0.55)'}
                      />
                    </motion.div>

                    <AnimatePresence mode="popLayout">
                      {isActive && (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                          animate={{ opacity: 1, width: 'auto', marginLeft: 6 }}
                          exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                          transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                          style={{
                            position: 'relative', zIndex: 1,
                            fontSize: 12, fontWeight: 700,
                            color: '#f5c200', letterSpacing: '0.01em',
                            whiteSpace: 'nowrap', overflow: 'hidden',
                          }}
                        >
                          {tab.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
            </motion.div>
          ) : (
            <motion.button
              key="mini"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ ...SPRING, duration: 0.18 }}
              onClick={() => {
                if (pathname === '/') {
                  // Already home — expand the nav
                  setExpanded(true)
                } else {
                  router.push('/')
                }
              }}
              whileTap={{ scale: 0.86 }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none',
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Home
                size={22}
                strokeWidth={2.2}
                color="#f5c200"
              />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
