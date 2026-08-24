'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'

export type CompListRow = {
  bits_competition_id: number
  name: string
  hall_city: string | null
  start_date: string | null
  results_synced: boolean
}

const MON = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const dateTag = (s: string | null) => { if (!s) return ''; const d = new Date(s + 'T12:00:00'); return `${d.getDate()} ${MON[d.getMonth()]}` }
const seasonLabel = (y: number) => `${String(y).slice(2)}/${String((y + 1) % 100).padStart(2, '0')}`

export function ResultatClient({ competitions, seasons, season }: {
  competitions: CompListRow[]; seasons: number[]; season: number
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? competitions.filter(c => c.name.toLowerCase().includes(t) || (c.hall_city ?? '').toLowerCase().includes(t)) : competitions
  }, [q, competitions])

  return (
    <main style={{ minHeight: '100dvh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body, paddingBottom: 80 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: `${SPACE[6]}px ${SPACE[4]}px` }}>
        <button onClick={() => (typeof window !== 'undefined' && window.history.length > 1 ? router.back() : router.push('/tavlingar'))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: TYPE.caption, color: COLOR.ink2, marginBottom: SPACE[4] }}>
          <ChevronLeft size={15} /> Tävlingar
        </button>

        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: COLOR.ink, margin: 0 }}>Tävlingsresultat</h1>
        <div style={{ fontSize: 14, color: COLOR.ink3, marginTop: SPACE[1] }}>Officiella resultat från BITS · {competitions.length} tävlingar</div>

        {/* Season pills */}
        {seasons.length > 1 && (
          <div style={{ display: 'flex', gap: SPACE[2], marginTop: SPACE[4], flexWrap: 'wrap' }}>
            {seasons.map(y => (
              <Link key={y} href={`/tavlingar/resultat?season=${y}`} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 14, fontWeight: 700, textDecoration: 'none',
                background: y === season ? COLOR.gold : COLOR.surface, color: y === season ? '#1a1400' : COLOR.ink2,
              }}>{seasonLabel(y)}</Link>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], marginTop: SPACE[4], background: COLOR.surface, borderRadius: 14, padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
          <Search size={18} color={COLOR.ink3} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Sök tävling eller ort"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: COLOR.ink, fontSize: 16, fontFamily: FONT.body }} />
        </div>

        <div style={{ marginTop: SPACE[4] }}>
          {filtered.map(c => (
            <Link key={c.bits_competition_id} href={`/tavlingar/${c.bits_competition_id}`} style={{
              display: 'flex', alignItems: 'center', gap: SPACE[3], textDecoration: 'none',
              padding: `${SPACE[3]}px ${SPACE[1]}px`, borderTop: `1px solid ${COLOR.hairline}`,
            }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                <span style={{ display: 'block', fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 1 }}>
                  {[dateTag(c.start_date), c.hall_city].filter(Boolean).join('  ·  ')}{!c.results_synced ? '  ·  resultat kommer' : ''}
                </span>
              </span>
              <ChevronRight size={16} color={COLOR.ink4} style={{ flexShrink: 0 }} />
            </Link>
          ))}
          {filtered.length === 0 && <div style={{ color: COLOR.ink3, padding: `${SPACE[8]}px 0`, textAlign: 'center' }}>Inga tävlingar.</div>}
        </div>
      </div>
    </main>
  )
}
