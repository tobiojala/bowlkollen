'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Trophy, Users, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

const TABS = [
  { label: 'Hem',       icon: Home,     href: '/' },
  { label: 'Schema',    icon: Calendar, href: '/schema' },
  { label: 'Tävlingar', icon: Trophy,   href: '/tavlingar' },
  { label: 'Klubbar',   icon: Users,    href: '/teams' },
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
    t.href === '/' ? pathname === '/' : pathname.startsWith(t.href),
  )
  const current = activeIdx === -1 ? 0 : activeIdx

  return (
    <motion.div
      animate={{ y: visible ? 0 : 110 }}
      transition={SPRING}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-8 right-8 z-50 h-16 rounded-[32px]"
    >
      <div className="bk-bottom-glass" aria-hidden />
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[32px] border-[0.5px]',
          'border-white/80 shadow-lg dark:border-white/30',
        )}
        aria-hidden
      />

      <div className="relative z-[1] flex h-full w-full items-center justify-around px-1">
        {TABS.map((tab, i) => {
          const isActive = i === current
          const Icon = tab.icon

          return (
            <motion.button
              key={tab.href}
              type="button"
              onClick={() => router.push(tab.href)}
              whileTap={{ scale: 0.86 }}
              transition={SPRING}
              className="relative flex h-[54px] w-14 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border-0 bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isActive && (
                <motion.div layoutId="activeTabPill" transition={SPRING} className="bk-tab-active-pill" />
              )}

              <motion.div
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                transition={SPRING}
                className="relative z-[1] flex items-center justify-center"
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  className={cn(isActive ? 'text-gold' : 'bk-text-muted')}
                />
              </motion.div>

              <motion.span
                animate={{ opacity: 1 }}
                transition={{ duration: 0.13 }}
                className={cn(
                  'relative z-[1] text-[10px] leading-none font-extrabold tracking-wide',
                  isActive ? 'text-gold' : 'bk-text-muted',
                )}
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
