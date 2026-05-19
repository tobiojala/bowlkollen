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

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 56, background: C.bg, zIndex: 30, borderBottom: '1px solid ' + C.border }}>
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 6, padding: '10px 16px' } as any}>
          {(['alla', 'pagaende', 'kommande', 'avslutad'] as const).map(f => (
            <button key={f} onClick={() => setActiveSection(f === 'alla' ? null : f)}
              style={{ background: activeSection === f || (f === 'alla' && !activeSection) ? C.accent : 'transparent', border: '1px solid ' + (activeSection === f || (f === 'alla' && !activeSection) ? C.accent : C.border), borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: activeSection === f || (f === 'alla' && !activeSection) ? '#1a1400' : C.textMuted, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}
            >
              {f === 'alla' ? 'Alla' : f === 'pagaende' ? 'Pagaende' : f === 'kommande' ? 'Kommande' : 'Avslutade'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {filtered.map(t => (
          <div key={t.id} style={{ borderBottom: '1px solid ' + C.border, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t.name}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px',
                    background: t.status === 'pagaende' ? '#e05555' + '22' : t.status === 'kommande' ? C.accent + '22' : C.border,
                    color: t.status === 'pagaende' ? '#e05555' : t.status === 'kommande' ? C.accent : C.textMuted
                  }}>
                    {t.status === 'pagaende' ? '● PAGAENDE' : t.status === 'kommande' ? 'KOMMANDE' : 'AVSLUTAD'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>{t.subtitle}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>📅 {t.date} · 📍 {t.venue}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' as const }}>
              <a href={t.href} style={{ fontSize: 12, fontWeight: 700, color: '#1a1400', background: C.accent, borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>
                {t.buttonLabel}
              </a>
              {t.officialHref && (
                <a href={t.officialHref} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, background: 'transparent', border: '1px solid ' + C.border, borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>
                  Officiell sida ↗
                </a>
              )}
              {t.extraButtons?.map(b => (
                <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, background: 'transparent', border: '1px solid ' + C.border, borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>
                  {b.label} ↗
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}