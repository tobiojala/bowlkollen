'use client'

import React, { useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Tavling = {
  id: string
  name: string
  subtitle: string
  date: string
  venue: string
  status: 'pagaende' | 'kommande' | 'avslutad'
  image?: string
  href: string
  buttonLabel: string
  extraButtons?: { label: string; href: string; color?: string }[]
}

const TAVLINGAR: Tavling[] = [
  {
    id: 'sm-slutspel-2026',
    name: 'SM-slutspel 2026',
    subtitle: 'Semifinaler och final i Elitserien Herrar och Damer',
    date: '15-17 maj 2026',
    venue: 'Lucky Bowl, Helsingborg',
    status: 'pagaende',
    href: '/schema',
    buttonLabel: 'Se matcher',
  },
  {
    id: 'sllm-2026',
    name: 'Storm Lucky Larsen Masters 2026',
    subtitle: 'Det enda internationella PBA Tour-evenemanget 2026',
    date: '22-30 aug 2026',
    venue: 'Lucky Bowl, Helsingborg',
    status: 'kommande',
    image: 'https://www.luckylarsen.se/wp-content/uploads/2026/02/SLLM26-WEB-HEADER-1440-x-600-px-4.png',
    href: '/sllm',
    buttonLabel: 'Mer info',
    extraButtons: [
      { label: 'Anmal dig', href: 'https://sbe.bowlres.se/sllm26' },
      { label: 'Livestream', href: 'https://www.youtube.com/@stormluckylarsenmasters', color: '#e05555' },
    ],
  },
]

const sections = [
  { key: 'pagaende', label: 'Pagaende', dot: '#e05555' },
  { key: 'kommande', label: 'Kommande', dot: '#f5c200' },
  { key: 'avslutad', label: 'Avslutade', dot: undefined },
]

export default function TavlingarPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const filtered = activeSection ? TAVLINGAR.filter(t => t.status === activeSection) : TAVLINGAR

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Tavlingar</h1>
          <div style={{ fontSize: 13, color: C.textMuted }}>Pagaende, kommande och avslutade tavlingar</div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          <button onClick={() => setActiveSection(null)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid ' + (activeSection === null ? C.accent : C.border), background: activeSection === null ? C.accent + '18' : 'transparent', color: activeSection === null ? C.accent : C.textMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Alla
          </button>
          {sections.map(s => {
            const count = TAVLINGAR.filter(t => t.status === s.key).length
            if (count === 0) return null
            const isActive = activeSection === s.key
            return (
              <button key={s.key} onClick={() => setActiveSection(isActive ? null : s.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 20, border: '1px solid ' + (isActive ? (s.dot || C.border) : C.border), background: isActive ? (s.dot ? s.dot + '18' : C.card) : 'transparent', color: isActive ? (s.dot || C.text) : C.textMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {s.dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />}
                {s.label}
              </button>
            )
          })}
        </div>

        {sections.map(section => {
          const items = filtered.filter(t => t.status === section.key)
          if (items.length === 0) return null
          return (
            <div key={section.key} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                {section.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: section.dot, display: 'inline-block' }} />}
                <div style={{ fontSize: 10, fontWeight: 800, color: section.dot || C.textMuted, letterSpacing: 2 }}>
                  {section.label.toUpperCase()}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map(t => (
                  <div key={t.id} style={{ background: C.card, borderRadius: 16, border: '1px solid ' + (t.status === 'pagaende' ? 'rgba(224,85,85,0.25)' : t.status === 'kommande' ? 'rgba(245,194,0,0.2)' : C.border), overflow: 'hidden' }}>
                    {t.image && (
                      <div style={{ position: 'relative', height: 130, overflow: 'hidden' }}>
                        <img src={t.image} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.75) 100%)' }} />
                      </div>
                    )}
                    <div style={{ padding: 16 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 3 }}>{t.name}</div>
                      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>{t.subtitle}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                        <span style={{ fontSize: 11, color: C.textMuted, background: C.surface, borderRadius: 6, padding: '3px 8px', border: '1px solid ' + C.border }}>{t.date}</span>
                        <span style={{ fontSize: 11, color: C.textMuted, background: C.surface, borderRadius: 6, padding: '3px 8px', border: '1px solid ' + C.border }}>{t.venue}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <a href={t.href} style={{ background: t.status === 'pagaende' ? '#e05555' : '#f5c200', color: t.status === 'pagaende' ? '#fff' : '#1a1400', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                          {t.buttonLabel}
                        </a>
                        {t.extraButtons?.map(b => (
                          <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer" style={{ background: C.surface, color: b.color || C.text, border: '1px solid ' + (b.color ? b.color + '44' : C.border), borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                            {b.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Inga tavlingar i den har kategorin
          </div>
        )}

      </div>
    </main>
  )
}
