'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { motion, AnimatePresence } from 'framer-motion'

type Tavling = {
  id: string; name: string; subtitle: string
  date: string; venue: string
  status: 'pagaende' | 'kommande' | 'avslutad'
  href: string; buttonLabel: string
  officialHref?: string
  extraButtons?: { label: string; href: string }[]
  banner?: string
}

const GREEN = '#c49040'

const TAVLINGAR: Tavling[] = [
  {
    id: 'sm-slutspel-2026', name: 'SM-slutspel 2026',
    subtitle: 'Semifinaler och final i Elitserien Herrar och Damer',
    date: '15–17 maj 2026', venue: 'Lucky Bowl, Helsingborg',
    status: 'pagaende', href: '/schema', buttonLabel: 'Se matcher',
  },
  {
    id: 'gp-final-2026', name: 'Challenger Grand Prix — Final',
    subtitle: 'Tourfinal i Stockholm — 6 deltävlingar bakom sig',
    date: '16–17 maj 2026', venue: 'Sollentuna',
    status: 'pagaende', href: 'https://gp.stbf.se',
    officialHref: 'https://gp.stbf.se',
    buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://gp.stbf.se/allresults.php' },
      { label: 'Barometer', href: 'https://gp.stbf.se/standings.php' },
    ],
  },
  {
    id: 'syt-2026', name: 'PBA jr. Swedish Youth Tour 2026',
    subtitle: 'Ungdomstour — U16, U21 killar och tjejer',
    date: '2025/2026', venue: 'Olympia, Nässjö, Gullmarsplan',
    status: 'pagaende', href: 'https://syt.bowlres.se',
    officialHref: 'https://syt.bowlres.se',
    buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://syt.bowlres.se/allresults.php' },
      { label: 'Anmäl dig', href: 'https://syt.bowlres.se/register.php' },
    ],
  },
  {
    id: 'sllm-2026', name: 'Storm Lucky Larsen Masters 2026',
    subtitle: 'Internationell PBA Tour-tävling — Sveriges största öppna turnering',
    date: '22–30 aug 2026', venue: 'Lucky Bowl, Helsingborg',
    status: 'kommande', href: '/sllm',
    officialHref: 'https://www.luckylarsen.se',
    buttonLabel: 'Mer info',
    banner: 'https://www.luckylarsen.se/wp-content/uploads/2026/02/SLLM26-WEB-HEADER-1440-x-600-px-4.png',
    extraButtons: [
      { label: 'Anmäl dig', href: 'https://sbe.bowlres.se/sllm26' },
      { label: 'Livestream', href: 'https://www.youtube.com/@stormluckylarsenmasters' },
    ],
  },
  {
    id: 'battle-of-smaland-2026', name: 'The Battle of Småland 2026',
    subtitle: 'Sveriges största sommartävling — prissumma 53 000 kr',
    date: 'Sommar 2026', venue: 'RC Bowl, Jönköping',
    status: 'kommande', href: 'https://rc-bowl.bowlres.se',
    officialHref: 'https://rc-bowl.bowlres.se',
    buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Anmäl dig', href: 'https://rc-bowl.bowlres.se/register.php' },
      { label: 'Livestream', href: 'https://www.youtube.com/@RcBowllive' },
    ],
  },
  {
    id: 'aikl-2026', name: 'MOTIV AIK Ladies 2026',
    subtitle: 'Öppen damtävling i Stockholm',
    date: '2026', venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikl.aikbowling.se',
    officialHref: 'https://aikl.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikj-2026', name: 'MOTIV AIK Junior 2026',
    subtitle: 'Öppen juniortävling i Stockholm',
    date: '2026', venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikj.aikbowling.se',
    officialHref: 'https://aikj.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'qak-2026', name: 'Queens and Kings 2026',
    subtitle: 'Öppen tävling',
    date: '2026', venue: 'Sverige',
    status: 'kommande', href: 'https://qak.bowlres.se',
    officialHref: 'https://qak.bowlres.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikmix-2026', name: 'AIK-mixen 2026',
    subtitle: 'Öppen mixedtävling i Stockholm',
    date: '2026', venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikmix.aikbowling.se',
    officialHref: 'https://aikmix.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikt-2026', name: 'MOTIV AIK International Tournament 2026',
    subtitle: 'Internationell öppen tävling i Stockholm — no urethane rule',
    date: 'Jan 2026', venue: 'Bowlorama, Stockholm',
    status: 'avslutad', href: 'https://aikt.aikbowling.se',
    officialHref: 'https://aikt.aikbowling.se',
    buttonLabel: 'Officiell sida',
    extraButtons: [
      { label: 'Resultat', href: 'https://aikt.aikbowling.se/allresults.php' },
      { label: 'Livestream', href: 'https://www.youtube.com/@bowloramatv' },
    ],
  },
]

type Filter = 'alla' | 'pagaende' | 'kommande' | 'avslutad'
const SPRING = { type: 'spring', stiffness: 320, damping: 30 } as const

export default function TavlingarPage() {
  const { theme } = useTheme()
  const C      = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [filter, setFilter]       = useState<Filter>('alla')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tav_favorites')
      if (saved) setFavorites(new Set(JSON.parse(saved)))
    } catch {}
  }, [])

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem('tav_favorites', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const pagaendeCount = TAVLINGAR.filter(t => t.status === 'pagaende').length
  const kommande      = TAVLINGAR.filter(t => t.status === 'kommande').length

  const filtered = TAVLINGAR.filter(t =>
    filter === 'alla' ? t.status !== 'avslutad'
    : t.status === filter
  )
  const favList = TAVLINGAR.filter(t => favorites.has(t.id))

  const TavCard = ({ t }: { t: Tavling }) => {
    const isPagaende = t.status === 'pagaende'
    const isDone     = t.status === 'avslutad'
    const isFav      = favorites.has(t.id)
    const hasBanner  = !!t.banner

    const dc          = isPagaende ? GREEN : isDone ? C.textMuted : C.accent
    const accentBar   = isPagaende
      ? `linear-gradient(90deg,${GREEN},rgba(196,144,64,0.15))`
      : isDone
      ? `linear-gradient(90deg,${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'},transparent)`
      : 'linear-gradient(90deg,#f5c200,rgba(245,194,0,0.15))'
    const cardBg      = isPagaende
      ? (isDark ? 'rgba(196,144,64,0.07)' : 'rgba(196,144,64,0.04)')
      : isDone ? 'transparent'
      : (isDark ? 'rgba(245,194,0,0.05)' : 'rgba(245,194,0,0.03)')
    const cardBorder  = isPagaende
      ? 'rgba(196,144,64,0.25)'
      : isDone
      ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)')
      : (isDark ? 'rgba(245,194,0,0.15)' : 'rgba(245,194,0,0.2)')

    const statusLabel = isPagaende ? 'PÅGÅENDE' : isDone ? 'AVSLUTAD' : 'KOMMANDE'

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isDone ? 0.6 : 1, y: 0 }}
        transition={SPRING}
        style={{ margin: '6px 12px', borderRadius: 16, overflow: 'hidden',
          background: hasBanner ? 'transparent' : cardBg,
          border: `1px solid ${cardBorder}` }}>

        {/* ── Banner image header (special tävlingar only) ── */}
        {hasBanner ? (
          <div style={{ position: 'relative', height: 136, overflow: 'hidden' }}>
            <img src={t.banner} alt={t.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                objectPosition: 'center 30%', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.75) 100%)' }} />
            {/* Status pill */}
            <div style={{ position: 'absolute', top: 10, left: 12,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(245,194,0,0.2)', border: '1px solid rgba(245,194,0,0.4)',
              borderRadius: 20, padding: '3px 10px' }}>
              <span style={{ fontSize: 9, color: '#f5c200' }}>◆</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#f5c200', letterSpacing: 1.2 }}>
                {statusLabel}
              </span>
            </div>
            {/* Star on image */}
            <button onClick={() => toggleFavorite(t.id)}
              style={{ position: 'absolute', top: 6, right: 10,
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                WebkitTapHighlightColor: 'transparent' } as any}>
              <Star size={18} strokeWidth={1.8}
                fill={isFav ? '#f5c200' : 'none'}
                color={isFav ? '#f5c200' : 'rgba(255,255,255,0.7)'} />
            </button>
            {/* Name + date overlay */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>{t.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>{t.date} · {t.venue}</div>
            </div>
          </div>
        ) : (
          <div style={{ height: 2, background: accentBar }} />
        )}

        <div style={{ padding: '12px 14px', background: hasBanner ? cardBg : 'transparent' }}>
          {/* Header (non-banner cards only) */}
          {!hasBanner && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {isPagaende && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN,
                      boxShadow: `0 0 5px ${GREEN}`, flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 9, fontWeight: 800, color: dc, letterSpacing: 1 }}>
                    {statusLabel}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.25, marginBottom: 4 }}>
                  {t.name}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4, marginBottom: 6 }}>
                  {t.subtitle}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{t.date} · {t.venue}</div>
              </div>
              <button onClick={() => toggleFavorite(t.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                  flexShrink: 0, WebkitTapHighlightColor: 'transparent' } as any}>
                <Star size={18} strokeWidth={1.8}
                  fill={isFav ? '#f5c200' : 'none'}
                  color={isFav ? '#f5c200' : C.textMuted} />
              </button>
            </div>
          )}

          {/* Subtitle for banner cards */}
          {hasBanner && (
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4, marginBottom: 10 }}>
              {t.subtitle}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            <a href={t.href}
              style={{ fontSize: 11, fontWeight: 700,
                color: isDone ? C.textMuted : '#1a1400',
                background: isDone ? 'transparent' : C.accent,
                border: isDone ? '1px solid ' + C.border : 'none',
                borderRadius: 8, padding: '6px 14px', textDecoration: 'none' }}>
              {t.buttonLabel}
            </a>
            {t.officialHref && t.officialHref !== t.href && (
              <a href={t.officialHref} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, fontWeight: 700, color: C.textMuted,
                  border: '1px solid ' + C.border, borderRadius: 8,
                  padding: '6px 14px', textDecoration: 'none' }}>
                Officiell sida ↗
              </a>
            )}
            {t.extraButtons?.map(b => (
              <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, fontWeight: 700, color: C.textMuted,
                  border: '1px solid ' + C.border, borderRadius: 8,
                  padding: '6px 14px', textDecoration: 'none' }}>
                {b.label} ↗
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* Stats row */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', gap: 16 }}>
        <span style={{ fontSize: 11, color: C.textMuted }}>
          <span style={{ fontWeight: 800, color: GREEN }}>{pagaendeCount}</span> pågående
        </span>
        <span style={{ fontSize: 11, color: C.textMuted }}>
          <span style={{ fontWeight: 800, color: C.accent }}>{kommande}</span> kommande
        </span>
      </div>

      {/* Sticky filter row */}
      <div style={{ position: 'sticky', top: 56, background: C.bg, zIndex: 30,
        borderBottom: '1px solid ' + C.border }}>
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex',
          gap: 6, padding: '7px 12px' } as any}>
          {([
            { key: 'alla',     label: 'Alla' },
            { key: 'pagaende', label: 'Pågående' },
            { key: 'kommande', label: 'Kommande' },
            { key: 'avslutad', label: 'Avslutade' },
          ] as const).map(f => {
            const isActive = filter === f.key
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ background: isActive ? C.accent : 'transparent',
                  border: '1px solid ' + (isActive ? C.accent : C.border),
                  borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700,
                  color: isActive ? '#1a1400' : C.textMuted, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent' } as any}>
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>

        {/* Favorites section */}
        <AnimatePresence>
          {favList.length > 0 && filter === 'alla' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPRING}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                padding: '16px 16px 4px', borderBottom: '1px solid ' + C.border }}>
                <Star size={12} fill="#f5c200" color="#f5c200" />
                <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>
                  MINA FAVORITER
                </span>
              </div>
              {favList.map(t => <TavCard key={t.id} t={t} />)}
              <div style={{ height: 1, background: C.border, margin: '8px 0' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 16px 4px' }}>
          <div style={{ width: 5, height: 5, borderRadius: 1, transform: 'rotate(45deg)',
            background: '#f5c200', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>
            {filter === 'alla' ? 'ALLA TÄVLINGAR' : filter === 'pagaende' ? 'PÅGÅENDE' : filter === 'kommande' ? 'KOMMANDE' : 'AVSLUTADE'}
          </span>
        </div>

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div key={filter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING}>
            {filtered.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                Inga tävlingar i den här kategorin
              </div>
            ) : (
              filtered.map(t => <TavCard key={t.id} t={t} />)
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}
