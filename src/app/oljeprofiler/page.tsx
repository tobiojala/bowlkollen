'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { FileText, ExternalLink } from 'lucide-react'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

type Profile = {
  id: number
  name: string
  length_ft: number | null
  ratio: number | null
  category: string
  season: string | null
  description: string | null
  pdf_url: string | null
  kosi_url: string | null
}

const CATEGORIES: { key: string; label: string; color: string; bg: string }[] = [
  { key: 'elite',        label: 'Elitserien',   color: '#f5c200', bg: 'rgba(245,194,0,0.10)' },
  { key: 'elite_damer',  label: 'Elit Damer',   color: '#d94a90', bg: 'rgba(217,74,144,0.10)' },
  { key: 'bredare',      label: 'Bredare',       color: '#c49040', bg: 'rgba(196,144,64,0.10)' },
  { key: 'sammandrag',   label: 'Sammandrag',    color: '#4a90d9', bg: 'rgba(74,144,217,0.10)' },
  { key: 'kval',         label: 'Kval',          color: '#e09030', bg: 'rgba(224,144,48,0.10)' },
  { key: 'sm',           label: 'SM',            color: '#c07fff', bg: 'rgba(192,127,255,0.10)' },
]

export default function OljeprofilerarPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    createClient()
      .from('oil_profiles')
      .select('*')
      .order('category')
      .order('length_ft')
      .then(({ data }) => {
        setProfiles((data as Profile[]) ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = activeCategory
    ? profiles.filter(p => p.category === activeCategory)
    : profiles

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    profiles: filtered.filter(p => p.category === cat.key),
  })).filter(g => g.profiles.length > 0)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingBottom: 96 }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          {loading ? 'Laddar...' : `${profiles.length} profiler · säsong 2025/2026`}
        </p>
      </div>

      {/* Category filter chips */}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 16px 12px',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
      }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: activeCategory === null ? '1px solid rgba(245,194,0,0.50)' : `1px solid ${C.border}`,
            background: activeCategory === null ? 'rgba(245,194,0,0.12)' : C.card,
            color: activeCategory === null ? '#f5c200' : C.textMuted,
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
        >
          Alla
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: activeCategory === cat.key ? `1px solid ${cat.color}88` : `1px solid ${C.border}`,
              background: activeCategory === cat.key ? cat.bg : C.card,
              color: activeCategory === cat.key ? cat.color : C.textMuted,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Profile groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 16px' }}>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 120, borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, opacity: 0.5 }} />
          ))
        ) : grouped.map((group, gi) => (
          <div key={group.key}>
            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 2, background: group.color, flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: group.color, letterSpacing: 1 }}>
                {group.label.toUpperCase()}
              </span>
            </div>

            {/* Profile cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.profiles.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING, delay: (gi * 0.05) + (i * 0.04) }}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  {/* Length pill */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: group.bg,
                    border: `1px solid ${group.color}44`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: group.color, lineHeight: 1 }}>
                      {p.length_ft}
                    </span>
                    <span style={{ fontSize: 9, color: group.color, opacity: 0.7, fontWeight: 600 }}>fot</span>
                  </div>

                  {/* Name + info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{p.name}</div>
                    {p.ratio != null && (
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
                        Ratio {String(p.ratio).replace('.', ',')}
                      </div>
                    )}
                    {p.description && (
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{p.description}</div>
                    )}
                  </div>

                  {/* PDF link */}
                  {p.pdf_url && (
                    <a
                      href={p.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        flexShrink: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        textDecoration: 'none',
                        padding: '6px 8px', borderRadius: 10,
                        background: 'rgba(245,194,0,0.08)',
                        border: '1px solid rgba(245,194,0,0.20)',
                      }}
                    >
                      <FileText size={14} color="#f5c200" />
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#f5c200' }}>PDF</span>
                    </a>
                  )}
                  {p.kosi_url && (
                    <a
                      href={p.kosi_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        flexShrink: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        textDecoration: 'none',
                        padding: '6px 8px', borderRadius: 10,
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <ExternalLink size={14} color={C.textMuted} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: C.textMuted }}>KOSI</span>
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: C.textMuted, padding: '48px 0', fontSize: 14 }}>
            Inga profiler hittades
          </div>
        )}
      </div>
    </div>
  )
}
