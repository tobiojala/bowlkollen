'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const TABS = [
  { label: 'Hem', icon: '🏠', href: '/' },
  { label: 'Schema', icon: '📅', href: '/schema' },
  { label: 'Tabell', icon: '🏆', href: '/league' },
  { label: 'Lag', icon: '👥', href: '/teams' },
  { label: 'Profil', icon: '👤', href: '/profile' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLDivElement>(null)
  const [blobStyle, setBlobStyle] = useState({ left: 0, width: 0 })
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])

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
      background: 'rgba(8,14,24,0.97)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '0.5px solid rgba(255,255,255,0.08)',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
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
              <span style={{
                fontSize: 21, lineHeight: 1,
                transform: isActive ? 'scale(1.18)' : 'scale(1)',
                transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                display: 'block',
              }}>
                {tab.icon}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
                color: isActive ? '#f5c200' : 'rgba(255,255,255,0.28)',
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
