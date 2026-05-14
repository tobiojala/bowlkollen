'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'

const links = [
  { href: '/',        label: 'Hem'         },
  { href: '/live',    label: 'Live'        },
  { href: '/schema',  label: 'Schema'      },
  { href: '/league',  label: 'Serietabell' },
  { href: '/teams',   label: 'Lag'         },
  { href: '/players', label: 'Spelare'     },
  { href: '/sllm',    label: 'SLLM 2026'   },
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
          {links.map(l => {
            const isLive = l.href === '/live'
            const isSllm = l.href === '/sllm'
            const isActive = path === l.href
            return (
              <a key={l.href} href={l.href} style={{
                fontSize: 11,
                fontWeight: isLive || isSllm ? 800 : 600,
                color: isActive ? accent : isLive ? '#e05555' : isSllm ? (isDark ? '#ffd700' : '#c8860a') : textMuted,
                textDecoration: 'none',
                padding: '6px 8px',
                borderRadius: 8,
                background: isActive ? card : isLive && !isActive ? (isDark ? 'rgba(224,85,85,0.1)' : 'rgba(224,85,85,0.06)') : isSllm && !isActive ? (isDark ? 'rgba(245,194,0,0.1)' : 'rgba(200,134,10,0.08)') : 'transparent',
                border: '1px solid ' + (isActive ? border : isLive && !isActive ? 'rgba(224,85,85,0.25)' : isSllm && !isActive ? (isDark ? 'rgba(245,194,0,0.2)' : 'rgba(200,134,10,0.15)') : 'transparent'),
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {isLive && !isActive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05555', display: 'inline-block' }} />}
                {l.label}
              </a>
            )
          })}
          <button onClick={toggle} style={{ background: card, border: '1px solid ' + border, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, marginLeft: 4, color: textMuted }}>
            {isDark ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
    </header>
  )
}
