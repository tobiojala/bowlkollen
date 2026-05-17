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
  officialHref?: string
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
    subtitle: 'Internationell PBA Tour-tävling — Sveriges största öppna turnering',
    date: '22-30 aug 2026',
    venue: 'Lucky Bowl, Helsingborg',
    status: 'kommande',
    image: 'https://www.luckylarsen.se/wp-content/uploads/2026/02/SLLM26-WEB-HEADER-1440-x-600-px-4.png',
    href: '/sllm',
    officialHref: 'https://www.luckylarsen.se',
    buttonLabel: 'Mer info',
    extraButtons: [
      { label: 'Anmal dig', href: 'https://sbe.bowlres.se/sllm26' },
      { label: 'Livestream', href: 'https://www.youtube.com/@stormluckylarsenmasters', color: '#e05555' },
    ],
  },
  {
    id: 'aikt-2026',
    name: 'MOTIV AIK International Tournament 2026',
    subtitle: 'Internationell öppen tävling i Stockholm — no urethane rule',
    date: 'Jan 2026',
    venue: 'Bowlorama, Stockholm',
    status: 'avslutad',
    href: 'https://aikt.aikbowling.se',
    officialHref: 'https://aikt.aikbowling.se',
    buttonLabel: 'Officiell sida',
    extraButtons: [
      { label: 'Resultat', href: 'https://aikt.aikbowling.se/allresults.php' },
      { label: 'Livestream', href: 'https://www.youtube.com/@bowloramatv', color: '#e05555' },
    ],
  },
  {
    id: 'syt-2026',
    name: 'PBA jr. Swedish Youth Tour 2026',
    subtitle: 'Ungdomstour i tre deltävlingar — U16, U21 killar och tjejer',
    date: '2025/2026',
    venue: 'Olympia, Nassjo, Gullmarsplan',
    status: 'pagaende',
    href: 'https://syt.bowlres.se',
    officialHref: 'https://syt.bowlres.se',
    buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://syt.bowlres.se/allresults.php' },
      { label: 'Anmal dig', href: 'https://syt.bowlres.se/register.php' },
    ],
  },
  {
    id: 'battle-of-smaland-2026',
    name: 'The Battle of Småland 2026',
    subtitle: 'Sveriges största och billigaste sommartävling — prissumma 53 000 kr',
    date: 'Sommar 2026',
    venue: 'RC Bowl, Jönköping',
    status: 'kommande',
    href: 'https://rc-bowl.bowlres.se',
    officialHref: 'https://rc-bowl.bowlres.se',
    buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Anmal dig', href: 'https://rc-bowl.bowlres.se/register.php' },
      { label: 'Livestream', href: 'https://www.youtube.com/@RcBowllive', color: '#e05555' },
    ],
  },
  {
    id: 'gp-2026',
    name: 'Challenger Grand Prix 2025/2026',
    subtitle: 'Individuell ungdomstour i Stockholm — 6 deltävlingar och tourfinal',
    date: 'Final: 16-17 maj 2026',
    venue: 'Sollentuna',
    status: 'pagaende',
    href: 'https://gp.stbf.se',
    officialHref: 'https://gp.stbf.se',
    buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://gp.stbf.se/allresults.php' },
      { label: 'Barometer', href: 'https://gp.stbf.se/standings.php' },
    ],
  },
  {
    id: 'aikl-2026',
    name: 'MOTIV AIK Ladies 2026',
    subtitle: 'Öppen damtävling i Stockholm',
    date: '2026',
    venue: 'Bowlorama, Stockholm',
    status: 'kommande',
    href: 'https://aikl.aikbowling.se',
    officialHref: 'https://aikl.aikbowling.se',
    buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikj-2026',
    name: 'MOTIV AIK Junior 2026',
    subtitle: 'Öppen juniortävling i Stockholm',
    date: '2026',
    venue: 'Bowlorama, Stockholm',
    status: 'kommande',
    href: 'https://aikj.aikbowling.se',
    officialHref: 'https://aikj.aikbowling.se',
    buttonLabel: 'Officiell sida',
  },
  {
    id: 'qak-2026',
    name: 'Queens and Kings 2026',
    subtitle: 'Öppen tävling',
    date: '2026',
    venue: 'Sverige',
    status: 'kommande',
    href: 'https://qak.bowlres.se',
    officialHref: 'https://qak.bowlres.se',
    buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikmix-2026',
    name: 'AIK-mixen 2026',
    subtitle: 'Öppen mixedtävling i Stockholm',
    date: '2026',
    venue: 'Bowlorama, Stockholm',
    status: 'kommande',
    href: 'https://aikmix.aikbowling.se',
    officialHref: 'https://aikmix.aikbowling.se',
    buttonLabel: 'Officiell sida',
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
          <div style={{ fontSize: 13, color: C.textMuted }}>{TAVLINGAR.length} tavlingar registrerade</div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button onClick={() => setActiveSection(null)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid ' + (activeSection === null ? C.accent : C.border), background: activeSection === null ? C.accent + '18' : 'transparent', color: activeSection === null ? C.accent : C.textMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Alla ({TAVLINGAR.length})
          </button>
          {sections.map(s => {
            const count = TAVLINGAR.filter(t => t.status === s.key).length
            if (count === 0) return null
            const isActive = activeSection === s.key
            return (
              <button key={s.key} onClick={() => setActiveSection(isActive ? null : s.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 20, border: '1px solid ' + (isActive ? (s.dot || C.border) : C.border), background: isActive ? (s.dot ? s.dot + '18' : C.card) : 'transparent', color: isActive ? (s.dot || C.text) : C.textMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {s.dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />}
                {s.label} ({count})
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
                  {section.label.toUpperCase()} — {items.length} TAVLINGAR
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(t => (
                  <div key={t.id} style={{ background: C.card, borderRadius: 14, border: '1px solid ' + (t.status === 'pagaende' ? 'rgba(224,85,85,0.25)' : t.status === 'kommande' ? 'rgba(245,194,0,0.2)' : C.border), overflow: 'hidden' }}>

                    {t.image && (
                      <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
                        <img src={t.image} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.75) 100%)' }} />
                      </div>
                    )}

                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 3 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>{t.subtitle}</div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, color: C.textMuted, background: C.surface, borderRadius: 6, padding: '3px 8px', border: '1px solid ' + C.border }}>{t.date}</span>
                        <span style={{ fontSize: 11, color: C.textMuted, background: C.surface, borderRadius: 6, padding: '3px 8px', border: '1px solid ' + C.border }}>{t.venue}</span>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <a href={t.href} target={t.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ background: t.status === 'pagaende' ? '#e05555' : '#f5c200', color: t.status === 'pagaende' ? '#fff' : '#1a1400', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                          {t.buttonLabel}
                        </a>
                        {t.extraButtons?.map(b => (
                          <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer" style={{ background: C.surface, color: b.color || C.text, border: '1px solid ' + (b.color ? b.color + '44' : C.border), borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
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

        <div style={{ marginTop: 16, padding: '12px 16px', background: C.card, borderRadius: 10, border: '1px solid ' + C.border, fontSize: 12, color: C.textMuted, textAlign: 'center' }}>
          Saknar du en tavling? Kontakta oss pa bowlkollen.se
        </div>

      </div>
    </main>
  )
}
