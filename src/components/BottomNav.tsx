'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, BarChart2, Users, User } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

const TABS = [
  { label: 'Hem', icon: Home, href: '/' },
  { label: 'Schema', icon: Calendar, href: '/schema' },
  { label: 'Tabell', icon: BarChart2, href: '/league' },
  { label: 'Lag', icon: Users, href: '/teams' },
  { label: 'Profil', icon: User, href: '/profile' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navRef = useRef<HTMLDivElement>(null)
  const [blobStyle, setBlobStyle] = useState({ left: 0, width: 0 })
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [visible, setVisible] = useState(true)
  const lastScroll = useRef(0)

  // Hide on inner pages
  const hideOnPaths = ['/intern', '/laguttagning', '/tillganglighet', '/matches/', '/players/', '/teams/']
  const isInnerPage = hideOnPaths.some(p => pathname.includes(p))

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      if (current < 10) { setVisible(true); lastScroll.current = current; return }
      if (current > lastScroll.current + 6) setVisible(false)
      else if (current < lastScroll.current - 6) setVisible(true)
      lastScroll.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (isInnerPage) return null

  const activeIdx = TABS.findIndex(t =>
    t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)
  )
  const current = activeIdx === -1 ? 0 : activeIdx

  useEffect(() => {
    const btn = btnRefs.current[current]
    const nav = navRef.current
    if (!btn || !nav) return
    const navRect = nav.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    setBlobStyle({
      left: btnRect.left - navRect.left + 8,
      width: btnRect.width - 16,
    })
  }, [current, pathname])

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 68,
      background: isDark ? 'rgba(8,14,24,0.97)' : 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: isDark ? '0.5px solid rgba(255,255,255,0.08)' : '0.5px solid rgba(0,0,0,0.1)',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
      transform: visible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Sliding yellow line at top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'visible' }}>
        <div style={{
          position: 'absolute', top: -1, height: 3,
          background: '#f5c200',
          borderRadius: '0 0 3px 3px',
          boxShadow: '0 0 10px rgba(245,194,0,0.9), 0 0 24px rgba(245,194,0,0.4)',
          left: blobStyle.left,
          width: blobStyle.width,
          transition: 'left 0.4s cubic-bezier(0.34,1.4,0.64,1), width 0.4s cubic-bezier(0.34,1.4,0.64,1)',
        }} />
      </div>

      {/* Nav items */}
      <div ref={navRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%', padding: '0 4px 6px' }}>
        {TABS.map((tab, i) => {
          const isActive = i === current
          return (
            <button
              key={tab.href}
              ref={el => { btnRefs.current[i] = el }}
              onClick={() => router.push(tab.href)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 4, width: 64, height: 52, border: 'none', background: 'transparent',
                cursor: 'pointer', position: 'relative',
                transform: isActive ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Glow behind active */}
              {isActive && (
                <div style={{
                  position: 'absolute', width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(245,194,0,0.08)',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -58%)',
                  pointerEvents: 'none',
                }} />
              )}
              <tab.icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                color={isActive ? '#f5c200' : isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                style={{
                  transform: isActive ? 'scale(1.12)' : 'scale(1)',
                  transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  display: 'block',
                }}
              />
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
                color: isActive ? '#f5c200' : isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.35)',
                transition: 'color 0.2s',
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
