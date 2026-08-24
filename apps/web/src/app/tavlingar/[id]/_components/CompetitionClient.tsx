'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'

export type CompRow = {
  bits_competition_id: number
  name: string
  hall: string | null
  hall_city: string | null
  club: string | null
  start_date: string | null
  end_date: string | null
  status: number | null
}
export type CompResult = {
  result_row_nbr: number
  lic_nbr: string | null
  player_name: string | null
  club_name: string | null
  place: number | null
  rank_points: number | null
  total_pins: number
  total_games: number
}

const MON = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
function dateRange(from: string | null, to: string | null): string {
  const f = (s: string) => { const d = new Date(s + 'T12:00:00'); return `${d.getDate()} ${MON[d.getMonth()]}` }
  if (from && to && from !== to) return `${f(from)}–${f(to)} ${new Date(to + 'T12:00:00').getFullYear()}`
  const one = to ?? from
  return one ? `${f(one)} ${new Date(one + 'T12:00:00').getFullYear()}` : ''
}

export function CompetitionClient({ comp, results, playerLinks }: {
  comp: CompRow; results: CompResult[]; playerLinks: Record<string, string>
}) {
  const router = useRouter()
  const classes = [...new Set(results.map(r => r.result_row_nbr))].sort((a, b) => a - b)
  const meta = [comp.hall, comp.hall_city].filter(Boolean).join(', ')

  return (
    <main style={{ minHeight: '100dvh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body, paddingBottom: 80 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: `${SPACE[6]}px ${SPACE[4]}px` }}>
        <button onClick={() => (typeof window !== 'undefined' && window.history.length > 1 ? router.back() : router.push('/tavlingar'))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: TYPE.caption, color: COLOR.ink2, marginBottom: SPACE[4] }}>
          <ChevronLeft size={15} /> Tävlingar
        </button>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: SPACE[1] }}>TÄVLING</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: COLOR.ink, margin: 0 }}>{comp.name}</h1>
        <div style={{ fontSize: 14, color: COLOR.ink2, marginTop: SPACE[2] }}>
          {[dateRange(comp.start_date, comp.end_date), meta].filter(Boolean).join('  ·  ')}
        </div>

        {results.length === 0 ? (
          <div style={{ color: COLOR.ink3, padding: `${SPACE[8]}px 0`, textAlign: 'center' }}>Resultat inte inlästa ännu.</div>
        ) : classes.map(cls => (
          <section key={cls} style={{ marginTop: SPACE[6] }}>
            {classes.length > 1 && (
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', color: COLOR.ink2, marginBottom: SPACE[2] }}>KLASS {cls}</div>
            )}
            <div>
              {results.filter(r => r.result_row_nbr === cls).map((r, i) => (
                <ResultLine key={`${cls}-${r.place}-${i}`} r={r} href={r.lic_nbr ? playerLinks[r.lic_nbr] : undefined} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

function ResultLine({ r, href }: { r: CompResult; href?: string }) {
  const snitt = r.total_games > 0 ? Math.round(r.total_pins / r.total_games) : null
  const gold = r.place === 1
  const name = r.player_name ?? '–'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: SPACE[3],
      padding: `${SPACE[3]}px ${SPACE[1]}px`, borderTop: `1px solid ${COLOR.hairline}`,
    }}>
      <span style={{ width: 26, textAlign: 'center', flexShrink: 0, fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 800, color: gold ? COLOR.gold : COLOR.ink3 }}>
        {r.place ?? '–'}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        {href ? (
          <Link href={`/players/${href}`} style={{ fontSize: 16, fontWeight: 700, color: COLOR.ink, textDecoration: 'none' }}>{name}</Link>
        ) : (
          <span style={{ fontSize: 16, fontWeight: 700, color: COLOR.ink }}>{name}</span>
        )}
        {r.club_name && <span style={{ display: 'block', fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.club_name}</span>}
      </span>
      {snitt != null && (
        <span style={{ flexShrink: 0, textAlign: 'right' }}>
          <span style={{ display: 'block', fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 800, color: COLOR.ink }}>{snitt}</span>
          <span style={{ display: 'block', fontSize: TYPE.label, color: COLOR.ink3 }}>snitt · {r.total_games} sr</span>
        </span>
      )}
    </div>
  )
}
