'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'

const surface = '#172030'
const border = '#2a3858'
const accent = '#f5c200'
const textMuted = '#6b7a99'
const card = '#1c2840'

const links = [
  { href: '/',        label: 'Hem'     },
  { href: '/teams',   label: 'Lag'     },
  { href: '/players', label: 'Spelare' },
  { href: '/admin',   label: 'Admin'   },
]

export default function Nav() {
  const path = usePathname()

  return (
    <header style={{ background: surface, borderBottom: '1px solid ' + border, position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <a href="/" style={{ fontSize: 20, fontWeight: 800, color: 'white', textDecoration: 'none' }}>
          Bowl<span style={{ color: accent }}>kollen</span>
        </a>
        <nav style={{ display: 'flex', gap: 4 }}>
          {links.map(l => (
            <a key={l.href} href={l.href} style={{ fontSize: 13, fontWeight: 600, color: path === l.href ? accent : textMuted, textDecoration: 'none', padding: '6px 12px', borderRadius: 8, background: path === l.href ? card : 'transparent', border: '1px solid ' + (path === l.href ? border : 'transparent') }}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
