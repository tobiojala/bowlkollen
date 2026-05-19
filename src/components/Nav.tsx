'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { createClient } from '@/lib/supabase'

const links = [
  { href: '/',          label: 'Hem'         },
  { href: '/schema',    label: 'Schema'      },
  { href: '/league',    label: 'Serietabell' },
  { href: '/teams',     label: 'Lag'         },
  { href: '/players',    label: 'Spelare'     },
  { href: '/tavlingar', label: 'Tavlingar'   },
  { href: '/sllm',      label: 'SLLM 2026'   },

]

export default function Nav() {
  const path = usePathname()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isDark = theme === 'dark'
  const surface   = isDark ? '#172030' : '#ffffff'
  const border    = isDark ? '#2a3858' : '#e0e4ed'
  const accent    = '#f5c200'
  const textMuted = isDark ? '#6b7a99' : '#6b7a8d'
  const card      = isDark ? '#1c2840' : '#f0f2f5'
  const text      = isDark ? '#ffffff' : '#0f1923'
  const overlay   = isDark ? 'rgba(10,16,30,0.92)' : 'rgba(240,242,245,0.97)'

  return (
    <>
      <header style={{ background: surface, borderBottom: '1px solid ' + border, position: 'sticky', top: 0, zIndex: 50, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>

          {/* Logo */}
          <a href="/" style={{ fontSize: 20, fontWeight: 800, color: text, textDecoration: 'none', flexShrink: 0 }} onClick={() => setOpen(false)}>
            Bowl<span style={{ color: accent }}>kollen</span>
          </a>

          {/* Desktop nav */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {links.map(l => {
              const isActive = path === l.href
              const isSllm = l.href === '/sllm'
              return (
                <a key={l.href} href={l.href} style={{
                  fontSize: 11, fontWeight: isSllm ? 800 : 600,
                  color: isActive ? accent : isSllm ? (isDark ? '#ffd700' : '#c8860a') : textMuted,
                  textDecoration: 'none', padding: '6px 8px', borderRadius: 8,
                  background: isActive ? card : isSllm && !isActive ? (isDark ? 'rgba(245,194,0,0.1)' : 'rgba(200,134,10,0.08)') : 'transparent',
                  border: '1px solid ' + (isActive ? border : isSllm && !isActive ? (isDark ? 'rgba(245,194,0,0.2)' : 'rgba(200,134,10,0.15)') : 'transparent'),
                  whiteSpace: 'nowrap',
                }}>
                  {l.label}
                </a>
              )
            })}
            <button onClick={toggle} style={{ background: card, border: '1px solid ' + border, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, marginLeft: 4, color: textMuted }}>
              {isDark ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Mobile right side */}
          <div className="mobile-nav" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
            <button onClick={toggle} style={{ background: card, border: '1px solid ' + border, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, color: textMuted }}>
              {isDark ? '☀' : '☾'}
            </button>
            <button onClick={() => setOpen(!open)} style={{ background: open ? card : 'transparent', border: '1px solid ' + (open ? border : 'transparent'), borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: text, fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}>
              {open ? '✕' : '☰'}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile menu drawer */}
      {open && (
        <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: overlay, zIndex: 49, backdropFilter: 'blur(8px)' }} onClick={() => setOpen(false)}>
          <div style={{ background: surface, borderBottom: '1px solid ' + border, padding: '8px 16px 16px' }} onClick={e => e.stopPropagation()}>
            {links.map(l => {
              const isActive = path === l.href
              const isSllm = l.href === '/sllm'
              return (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
                  display: 'flex', alignItems: 'center', padding: '13px 12px',
                  borderRadius: 10, textDecoration: 'none', marginBottom: 4,
                  background: isActive ? card : 'transparent',
                  border: '1px solid ' + (isActive ? border : 'transparent'),
                }}>
                  <span style={{
                    fontSize: 15, fontWeight: isSllm ? 800 : 600,
                    color: isActive ? accent : isSllm ? (isDark ? '#ffd700' : '#c8860a') : text,
                  }}>
                    {l.label}
                  </span>
                  {isActive && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: accent }} />}
                </a>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </>
  )
}
