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
    <>
      {/* SVG lens distortion filter — edge-only displacement, center stays sharp */}
      <svg style={{ position: 'fixed', width: 0, height: 0, top: 0, left: 0 }} aria-hidden="true">
        <defs>
          <filter id="bk-lens" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
            {/* Erode source alpha to get pure interior — we'll subtract this to get edge-only zone */}
            <feMorphology operator="erode" radius="10" in="SourceAlpha" result="interior" />
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.044" numOctaves="3" seed="9" result="noise" />
            <feComposite in="noise" in2="interior" operator="out" result="edgeNoise" />
            <feDisplacementMap in="SourceGraphic" in2="edgeNoise" scale="22" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <motion.div
        animate={{ y: visible ? 0 : 110 }}
        transition={SPRING}
        style={{
          position: 'fixed',
          left: 14, right: 14,
          bottom: `calc(env(safe-area-inset-bottom) + 10px)`,
          zIndex: 50,
          height: 72,
          borderRadius: 28,
        }}
      >
        {/* ── Glass background layer: gets lens filter + backdrop-filter ── */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 28, overflow: 'hidden',
          filter: 'url(#bk-lens)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backdropFilter: 'blur(48px) saturate(220%) brightness(1.18)',
            WebkitBackdropFilter: 'blur(48px) saturate(220%) brightness(1.18)',
            background: isDark
              ? 'rgba(6,12,36,0.52)'
              : 'rgba(235,242,255,0.70)',
          }} />
        </div>

        {/* ── Glass edge / specular rim (no filter — stays crisp) ── */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 28, pointerEvents: 'none',
          border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.92)'}`,
          boxShadow: isDark
            ? [
                'inset 0 1.5px 0 rgba(255,255,255,0.45)',        // top specular rim
                'inset 0 -0.5px 0 rgba(0,0,0,0.35)',             // bottom inner shadow
                'inset 2.5px 0 5px rgba(140,190,255,0.08)',      // left chromatic (blue)
                'inset -2.5px 0 5px rgba(255,140,90,0.06)',      // right chromatic (amber)
                '0 22px 60px rgba(0,0,0,0.60)',                   // main drop shadow
                '0 4px 16px rgba(0,0,0,0.38)',                    // close shadow
              ].join(', ')
            : [
                'inset 0 1.5px 0 rgba(255,255,255,1.0)',
                'inset 0 -0.5px 0 rgba(0,0,0,0.07)',
                '0 22px 60px rgba(0,0,0,0.15)',
                '0 4px 12px rgba(0,0,0,0.09)',
              ].join(', '),
        }} />

        {/* ── Tabs content layer: z-index above glass, no distortion ── */}
        <div style={{
          position: 'relative', zIndex: 1,
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
                  gap: 5, width: 62, height: 60,
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  flexShrink: 0,
                }}
              >
                {/* ── Gold active capsule — honor roll style ── */}
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
                            'inset 0 1.5px 0 rgba(255,235,80,0.65)',   // gold specular rim
                            'inset 0 -0.5px 0 rgba(160,100,0,0.30)',   // bottom inner shadow
                            '0 0 28px rgba(245,194,0,0.40)',            // outer gold glow
                            '0 0 8px rgba(245,194,0,0.25)',             // tight glow
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

                {/* ── Icon ── */}
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                  transition={SPRING}
                  style={{
                    position: 'relative', zIndex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.2 : 1.6}
                    color={isActive
                      ? '#f5c200'
                      : isDark ? 'rgba(255,255,255,0.82)' : 'rgba(20,30,55,0.62)'}
                  />
                </motion.div>

                {/* ── Label ── */}
                <motion.span
                  animate={{
                    color: isActive
                      ? '#f5c200'
                      : isDark ? 'rgba(255,255,255,0.75)' : 'rgba(20,30,55,0.58)',
                  }}
                  transition={{ duration: 0.13 }}
                  style={{
                    position: 'relative', zIndex: 1,
                    fontSize: 9, fontWeight: 700,
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
    </>
  )
}
