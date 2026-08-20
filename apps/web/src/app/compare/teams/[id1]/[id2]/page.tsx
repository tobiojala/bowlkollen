'use client'

import { use } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useTeamStats, useBitsTeamName } from '@/lib/team-stats-data'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { TeamStats } from '@bowlkollen/core'

type Props = { params: Promise<{ id1: string; id2: string }> }

// Two teams side by side on the shared team-stats engine (rebuilt off the
// deprecated legacy /compare page). id1/id2 are bits_team_id. Higher-is-better
// per row → the leading side lights green; equal → neither.

function hueOf(name: string) { return name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360 }

function Crest({ name, side }: { name: string; side: 'a' | 'b' }) {
  const hue = hueOf(name)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: side === 'a' ? 'flex-start' : 'flex-end', gap: SPACE[2], flex: 1, minWidth: 0 }}>
      <div style={{
        width: 52, height: 52, borderRadius: RADIUS.lg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `hsla(${hue},50%,45%,0.15)`, border: `2px solid hsla(${hue},50%,45%,0.5)`,
        color: `hsl(${hue},50%,72%)`, fontSize: 16, fontWeight: 900,
      }}>{initials}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: COLOR.ink, textAlign: side === 'a' ? 'left' : 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{name}</div>
    </div>
  )
}

function num(n: number | null | undefined) { return n != null ? n.toLocaleString('sv-SE') : '–' }

function Row({ label, a, b, neutral = false }: { label: string; a: number | null; b: number | null; neutral?: boolean }) {
  const aWins = !neutral && a != null && b != null && a > b
  const bWins = !neutral && a != null && b != null && b > a
  const cell = (v: number | null, win: boolean, align: 'left' | 'right') => (
    <div style={{ flex: 1, textAlign: align, fontSize: 20, fontWeight: 800, fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', color: win ? COLOR.green : COLOR.ink }}>
      {num(v)}
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[3]}px ${SPACE[2]}px`, borderBottom: `1px solid ${COLOR.hairline}` }}>
      {cell(a, aWins, 'left')}
      <div style={{ flex: 1.2, textAlign: 'center', fontSize: TYPE.label, fontWeight: 700, letterSpacing: '0.04em', color: COLOR.ink3, textTransform: 'uppercase' }}>{label}</div>
      {cell(b, bWins, 'right')}
    </div>
  )
}

function FormRow({ a, b }: { a: TeamStats['form']; b: TeamStats['form'] }) {
  const dots = (form: TeamStats['form'], align: 'flex-start' | 'flex-end') => (
    <div style={{ flex: 1, display: 'flex', gap: 4, justifyContent: align }}>
      {[...form].reverse().map((o, i) => {
        const c = o === 'W' ? COLOR.green : o === 'L' ? COLOR.red : COLOR.ink3
        const letter = o === 'W' ? 'V' : o === 'L' ? 'F' : 'O'
        return <span key={i} style={{ width: 18, height: 18, borderRadius: 5, background: `${c}22`, color: c, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{letter}</span>
      })}
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[3]}px ${SPACE[2]}px`, borderBottom: `1px solid ${COLOR.hairline}` }}>
      {dots(a, 'flex-start')}
      <div style={{ flex: 1.2, textAlign: 'center', fontSize: TYPE.label, fontWeight: 700, letterSpacing: '0.04em', color: COLOR.ink3, textTransform: 'uppercase' }}>Form</div>
      {dots(b, 'flex-end')}
    </div>
  )
}

export default function TeamComparePage({ params }: Props) {
  const { id1, id2 } = use(params)
  const idA = Number(id1), idB = Number(id2)
  const { data: nameA } = useBitsTeamName(idA)
  const { data: nameB } = useBitsTeamName(idB)
  const { data: dataA, isLoading: la } = useTeamStats(idA)
  const { data: dataB, isLoading: lb } = useTeamStats(idB)

  const a = dataA?.stats, b = dataB?.stats
  const loading = la || lb

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: `${SPACE[6]}px ${SPACE[4]}px 96px` }}>
        <Link href={`/lag/${idA}/statistik`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: TYPE.caption, color: COLOR.ink2, textDecoration: 'none', marginBottom: SPACE[4] }}>
          <ChevronLeft size={15} /> Statistik
        </Link>

        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: SPACE[3] }}>JÄMFÖR LAG</div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE[3], marginBottom: SPACE[6] }}>
          <Crest name={nameA ?? 'Lag A'} side="a" />
          <div style={{ alignSelf: 'center', fontSize: TYPE.label, fontWeight: 900, color: COLOR.ink3 }}>VS</div>
          <Crest name={nameB ?? 'Lag B'} side="b" />
        </div>

        {loading ? (
          <div style={{ color: COLOR.ink3, textAlign: 'center', padding: `${SPACE[8]}px 0` }}>Laddar…</div>
        ) : !a || !b ? (
          <div style={{ color: COLOR.ink3, textAlign: 'center', padding: `${SPACE[8]}px 0` }}>
            {!a && !b ? 'Ingen statistik för något av lagen än.' : `Ingen statistik för ${!a ? (nameA ?? 'Lag A') : (nameB ?? 'Lag B')} än.`}
          </div>
        ) : (
          <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.xl, padding: `${SPACE[2]}px ${SPACE[4]}px` }}>
            <Row label="Pinfall / match" a={a.pinfallPerMatch} b={b.pinfallPerMatch} />
            <Row label="Total pinfall" a={a.totalPinfall} b={b.totalPinfall} />
            <Row label="Vinst %" a={a.winPct} b={b.winPct} />
            <Row label="Snitt / serie" a={a.teamAverage} b={b.teamAverage} />
            <Row label="Bästa serie" a={a.highGame?.pins ?? null} b={b.highGame?.pins ?? null} />
            <Row label="Bästa lagresultat" a={a.highMatch?.total ?? null} b={b.highMatch?.total ?? null} />
            <Row label="Matcher" a={a.played} b={b.played} neutral />
            <FormRow a={a.form} b={b.form} />
          </div>
        )}
      </div>
    </main>
  )
}
