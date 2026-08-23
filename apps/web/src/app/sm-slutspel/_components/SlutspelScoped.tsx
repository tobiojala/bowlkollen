'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { computeStandings, type TeamStanding } from '@/lib/division-standings'
import { toMatchRow, type DbMatchRow } from '@/lib/bits-matches'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { SEASON, STALE } from '@/lib/constants'
import { buildBrackets, type SmBracket, type BracketMatch } from './bracket'

export const SLUTSPEL_SEASON_ID = 2025 // hardcoded bracket = 2025/26 (played May 2026)
const MIN_PLAYED = 3
type Gender = 'herrar' | 'damer'
const seasonLabel = (id: number) => `${String(id).slice(2)}/${String((id + 1) % 100).padStart(2, '0')}`

export function SlutspelScoped({ gender, season }: { gender: Gender; season: number }) {
  const router = useRouter()
  const currentYear = Number(SEASON.CURRENT.slice(0, 4))
  const label = gender === 'herrar' ? 'HERRAR' : 'DAMER'

  return (
    <main style={{ minHeight: '100dvh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body, paddingBottom: 80 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: `${SPACE[6]}px ${SPACE[4]}px` }}>
        <button onClick={() => (typeof window !== 'undefined' && window.history.length > 1 ? router.back() : router.push('/schema'))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: TYPE.caption, color: COLOR.ink2, marginBottom: SPACE[4] }}>
          <ChevronLeft size={15} /> Tillbaka
        </button>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3 }}>
          SM-SLUTSPEL · {label} · {seasonLabel(season || SLUTSPEL_SEASON_ID)}
        </div>

        {season === currentYear
          ? <PrognosFull gender={gender} season={season} />
          : <ChampionFull gender={gender} />}
      </div>
      <style>{`@keyframes bk-champion-shimmer { 0% { background-position: -100% center; } 100% { background-position: 200% center; } }`}</style>
    </main>
  )
}

// ── Past season — shimmering champion + story + the bracket as it played ───────
function ChampionFull({ gender }: { gender: Gender }) {
  const { herrar, damer } = buildBrackets()
  const b: SmBracket = gender === 'herrar' ? herrar : damer
  if (!b.champion) return <div style={{ color: COLOR.ink3, padding: `${SPACE[8]}px 0`, textAlign: 'center' }}>Ingen slutspelsdata.</div>

  const order: BracketMatch['round'][] = ['sf', 'final', 'third']
  const matches = [...b.matches].sort((a, c) => order.indexOf(a.round) - order.indexOf(c.round))

  return (
    <div>
      <div style={{ textAlign: 'center', padding: `${SPACE[8]}px 0 ${SPACE[6]}px` }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLOR.ink, letterSpacing: 4, marginBottom: 10 }}>SVENSKA MÄSTARE</div>
        <div style={{
          fontFamily: FONT.display, fontSize: 40, fontWeight: 900, letterSpacing: -1, lineHeight: 1.1,
          background: 'linear-gradient(105deg, #b8860b 0%, #f5c200 25%, #fff8e1 42%, #ffffff 50%, #fff8e1 58%, #f5c200 75%, #b8860b 100%)',
          backgroundSize: '250% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextFillColor: 'transparent', WebkitTextStroke: '0.5px rgba(0,0,0,0.5)',
          textShadow: '0 0 32px rgba(245,194,0,0.6), 0 0 80px rgba(245,194,0,0.2)',
          animation: 'bk-champion-shimmer 3.5s linear infinite',
        } as React.CSSProperties}>{b.champion}</div>
        {b.story && (
          <p style={{ fontSize: 15, lineHeight: 1.7, color: COLOR.ink, fontStyle: 'italic', marginTop: 14, maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
            {b.story}
          </p>
        )}
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 20 }}>{b.venue} · {b.dates}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
        {matches.map(m => <BracketCard key={m.id} m={m} />)}
      </div>
    </div>
  )
}

function BracketCard({ m }: { m: BracketMatch }) {
  const games = (m.games ?? []).filter(g => g.home != null || g.away != null)
  return (
    <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[4] }}>
      <div style={{ fontSize: TYPE.label, fontWeight: 700, letterSpacing: '0.06em', color: COLOR.ink3, marginBottom: SPACE[2] }}>
        {m.label.toUpperCase()}{m.seriesResult ? ` · ${m.seriesResult}` : ''}
      </div>
      <Entry name={m.home.team} seed={m.home.seed} won={m.home.isWinner} />
      <Entry name={m.away.team} seed={m.away.seed} won={m.away.isWinner} />
      {games.length > 0 && (
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: SPACE[2], fontVariantNumeric: 'tabular-nums' }}>
          {games.map(g => `${g.home ?? '–'}–${g.away ?? '–'}`).join('  ·  ')}
        </div>
      )}
    </div>
  )
}

function Entry({ name, seed, won }: { name: string | null; seed: number | null; won: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], padding: '3px 0' }}>
      {seed != null && <span style={{ width: 18, fontSize: TYPE.caption, color: COLOR.ink3, fontVariantNumeric: 'tabular-nums' }}>{seed}</span>}
      <span style={{ flex: 1, fontSize: 16, fontWeight: won ? 700 : 600, color: won ? COLOR.ink : COLOR.ink2 }}>{name ?? '–'}</span>
      {won && <span style={{ fontSize: TYPE.label, fontWeight: 700, color: COLOR.gold }}>VIDARE</span>}
    </div>
  )
}

// ── Current season — full prognosis (top 4 from the real Elitserien table) ────
function PrognosFull({ gender, season }: { gender: Gender; season: number }) {
  const { data: top4 = [], isLoading } = useQuery<TeamStanding[]>({
    queryKey: ['slutspel-prognos-full', gender, season],
    staleTime: STALE.MEDIUM,
    queryFn: async () => {
      const db = createClient()
      const { data: divs } = await db.from('bits_divisions').select('bits_division_id, name').ilike('name', 'Elitserien%').eq('season_id', season)
      const div = ((divs ?? []) as { bits_division_id: number; name: string }[])
        .find(d => (gender === 'damer') === d.name.toLowerCase().includes('dam'))
      if (!div) return []
      const { data } = await db.from('bits_matches').select('*').eq('bits_division_id', div.bits_division_id).eq('season_id', season)
      return computeStandings(((data ?? []) as unknown as DbMatchRow[]).map(toMatchRow)).slice(0, 4)
    },
  })

  const meaningful = top4.length === 4 && top4.every(t => t.played >= MIN_PLAYED)
  const rows = meaningful
    ? top4.map((t, i) => ({ seed: i + 1, name: t.teamName, sub: `${t.points} p · ${t.played} matcher` }))
    : [1, 2, 3, 4].map(n => ({ seed: n, name: 'Avgörs av grundserien', sub: null as string | null }))

  return (
    <div style={{ paddingTop: SPACE[6] }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: COLOR.ink, marginBottom: SPACE[4] }}>På väg till slutspel</div>
      {isLoading ? (
        <div style={{ color: COLOR.ink3 }}>Laddar…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
          {rows.map(r => (
            <div key={r.seed} style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], background: COLOR.surface, borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px` }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, background: r.seed === 1 ? COLOR.gold : COLOR.surface2, color: r.seed === 1 ? '#1a1400' : COLOR.ink }}>{r.seed}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700, color: meaningful ? COLOR.ink : COLOR.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              {r.sub && <span style={{ fontSize: TYPE.caption, color: COLOR.ink3, flexShrink: 0 }}>{r.sub}</span>}
              {meaningful && r.seed === 1 && <span style={{ fontSize: TYPE.label, fontWeight: 700, color: COLOR.gold, flexShrink: 0 }}>väljer motståndare</span>}
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: TYPE.caption, color: COLOR.ink3, lineHeight: 1.6, marginTop: SPACE[4] }}>
        Topp 4 går till SM-slutspel. 1:an väljer motståndare (3:an eller 4:an), 2:an möter den kvarvarande.
        Sedan semifinaler, final (bäst av 3) och bronsmatch. Prognos utifrån tabellen — inte officiell.
      </p>
    </div>
  )
}
