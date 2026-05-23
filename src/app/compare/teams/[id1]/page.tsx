'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { shortName } from '@/lib/utils'

type Props = { params: Promise<{ id1: string }> }
type Team = { id: string; name: string; city: string | null }

const SPRING = { type: 'spring', stiffness: 280, damping: 28 } as const

function teamPalette(name: string, isDark: boolean) {
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return {
    border: `hsl(${hue},50%,45%)`,
    bg:     isDark ? `hsl(${hue},40%,12%)` : `hsl(${hue},40%,92%)`,
  }
}

export default function TeamPickerPage({ params }: Props) {
  const { theme } = useTheme()
  const C      = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [id1,     setId1]     = useState<string | null>(null)
  const [team1,   setTeam1]   = useState<Team | null>(null)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { params.then(p => setId1(p.id1)) }, [params])

  useEffect(() => {
    if (!id1) return
    createClient().from('teams').select('id,name,city').eq('id', id1).single()
      .then(({ data }) => { if (data) setTeam1(data as Team); setLoading(false) })
  }, [id1])

  // Debounced team search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(() => {
      createClient()
        .from('teams')
        .select('id,name,city')
        .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
        .neq('id', id1 ?? '')
        .order('name')
        .limit(8)
        .then(({ data }) => setResults((data || []) as Team[]))
    }, 200)
    return () => clearTimeout(t)
  }, [query, id1])

  if (loading || !team1 || !id1) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
        style={{ fontSize: 13, color: C.textMuted }}>Laddar...</motion.div>
    </main>
  )

  const col1 = teamPalette(team1.name, isDark)
  const ini1 = shortName(team1.name).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* Back */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
        <a href={`/teams/${id1}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
          background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '5px 12px' }}>
          ← Tillbaka
        </a>
      </div>

      {/* Split-screen hero */}
      <div style={{ position: 'relative', height: 220, display: 'flex', overflow: 'hidden' }}>

        {/* Team 1 — filled */}
        <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...SPRING, delay: 0.05 }}
          style={{
            flex: 1,
            background: isDark
              ? `linear-gradient(135deg, ${col1.bg} 0%, rgba(11,21,40,0.95) 100%)`
              : `linear-gradient(135deg, ${col1.bg} 0%, rgba(235,240,250,0.98) 100%)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '40px 40px 20px 20px',
          }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: col1.bg, border: `2.5px solid ${col1.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: col1.border }}>
            {ini1}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{shortName(team1.name)}</div>
            {team1.city && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{team1.city}</div>}
          </div>
        </motion.div>

        {/* Team 2 — empty slot */}
        <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...SPRING, delay: 0.05 }}
          style={{
            flex: 1,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '40px 20px 20px 40px',
          }}>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 64, height: 64, borderRadius: 16,
              border: `2px dashed ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }}>
            ?
          </motion.div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textAlign: 'center' }}>
            Välj ett lag
          </div>
        </motion.div>

        {/* VS */}
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...SPRING, delay: 0.18 }}
          style={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)',
            textAlign: 'center', fontSize: 20, fontWeight: 900, color: '#f5c200', letterSpacing: 3,
            textShadow: '0 0 12px rgba(245,194,0,0.9), 0 0 32px rgba(245,194,0,0.45)', zIndex: 10,
            pointerEvents: 'none', userSelect: 'none' as const }}>
          VS
        </motion.div>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 1, height: '100%', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
      </div>

      {/* Search box */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10,
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '11px 14px' }}>
            <Search size={16} color={C.textMuted} />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Sök ett lag att jämföra med..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: C.text, fontSize: 15 }}
            />
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ margin: '0 16px', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            {results.map((t, i) => {
              const col = teamPalette(t.name, isDark)
              const ini = shortName(t.name).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
              return (
                <a key={t.id} href={`/compare/teams/${id1}/${t.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
                    textDecoration: 'none', background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: col.bg, border: `1.5px solid ${col.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: col.border, flexShrink: 0 }}>
                    {ini}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortName(t.name)}
                    </div>
                    {t.city && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{t.city}</div>}
                  </div>
                  <span style={{ fontSize: 13, color: C.textMuted }}>›</span>
                </a>
              )
            })}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Inga lag hittades
          </div>
        )}

        {!query.trim() && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Sök på lagnamn eller stad
          </div>
        )}
      </div>
    </main>
  )
}
