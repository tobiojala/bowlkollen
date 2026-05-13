'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'

const links = [
  { href: '/',        label: 'Hem'         },
  { href: '/sllm',    label: 'SLLM 2026'   },
  { href: '/league',  label: 'Serietabell' },
  { href: '/teams',   label: 'Lag'         },
  { href: '/players', label: 'Spelare'     },
  { href: '/admin',   label: 'Admin'       },
]

export default function Nav() {
  const path = usePathname()
  const { theme, toggle } = useTheme()

  const isDark = theme === 'dark'
  const surface   = isDark ? '#172030' : '#ffffff'
  const border    = isDark ? '#2a3858' : '#e0e4ed'
  const accent    = '#f5c200'
  const textMuted = isDark ? '#6b7a99' : '#6b7a8d'
  const card      = isDark ? '#1c2840' : '#f0f2f5'
  const text      = isDark ? '#ffffff' : '#0f1923'

  return (
    <header style={{ background: surface, borderBottom: '1px solid ' + border, position: 'sticky', top: 0, zIndex: 50, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <a href="/" style={{ fontSize: 20, fontWeight: 800, color: text, textDecoration: 'none', flexShrink: 0 }}>
          Bowl<span style={{ color: accent }}>kollen</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto' }}>
          {links.map(l => (
            <a key={l.href} href={l.href} style={{
              fontSize: 12,
              fontWeight: l.href === '/sllm' ? 800 : 600,
              color: path === l.href ? accent : l.href === '/sllm' ? (isDark ? '#ffd700' : '#c8860a') : textMuted,
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: 8,
              background: path === l.href ? card : l.href === '/sllm' && path !== '/sllm' ? (isDark ? 'rgba(245,194,0,0.1)' : 'rgba(200,134,10,0.08)') : 'transparent',
              border: '1px solid ' + (path === l.href ? border : l.href === '/sllm' && path !== '/sllm' ? (isDark ? 'rgba(245,194,0,0.2)' : 'rgba(200,134,10,0.15)') : 'transparent'),
              whiteSpace: 'nowrap',
            }}>
              {l.label}
            </a>
          ))}
          <button onClick={toggle} style={{ background: card, border: '1px solid ' + border, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, marginLeft: 4, color: textMuted }}>
            {isDark ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
    </header>
  )
}
