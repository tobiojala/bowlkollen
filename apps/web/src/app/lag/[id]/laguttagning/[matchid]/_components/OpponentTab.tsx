'use client'

import Link from 'next/link'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { useTeamRoster } from '@/lib/queries'
import { useHeadToHead } from '@/lib/lineup-aids'
import { LineupDisplay } from './LineupDisplay'

const OUTCOME = {
  W: { label: 'Vinst', bg: COLOR.green, fg: '#0b0d10' },
  L: { label: 'Förlust', bg: COLOR.red, fg: '#0b0d10' },
  D: { label: 'Oavgjort', bg: COLOR.surface2, fg: COLOR.ink2 },
} as const

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: '2-digit' })
}

// Opponent scouting: their published lineup (if any), your recent meetings, and
// their players to watch. Public data — mirrors native OpponentTab.
export function OpponentTab({ teamId, opponentId, opponentName, matchId }: {
  teamId: number; opponentId: number | null; opponentName: string; matchId: number
}) {
  const { data: h2h = [] } = useHeadToHead(teamId, opponentId)
  const { data: roster = [] } = useTeamRoster(opponentId ?? 0)
  const watch = [...roster].sort((a, b) => (b.licenceAverage ?? 0) - (a.licenceAverage ?? 0)).slice(0, 5)

  if (!opponentId) return <p style={{ color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', padding: `${SPACE[12]}px 0` }}>Ingen motståndardata.</p>

  const label = { fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink3, marginBottom: SPACE[3] } as const

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: COLOR.ink, margin: `${SPACE[2]}px 0 0` }}>{opponentName}</h2>

      <LineupDisplay teamId={opponentId} matchId={matchId} subtitle="Motståndarens lag" />

      {h2h.length > 0 && (
        <section style={{ marginTop: SPACE[8] }}>
          <div style={label}>SENASTE MÖTEN</div>
          {h2h.map(m => {
            const o = m.outcome ? OUTCOME[m.outcome] : null
            return (
              <div key={m.matchId} style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[3]}px 0`, borderBottom: `1px solid ${COLOR.hairline}` }}>
                <span style={{ width: 72, color: COLOR.ink3, fontSize: TYPE.caption }}>{fmtDate(m.date)}</span>
                <span style={{ flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{m.ours ?? '–'}–{m.theirs ?? '–'}</span>
                {o && <span style={{ fontSize: TYPE.caption, fontWeight: 800, color: o.fg, background: o.bg, borderRadius: RADIUS.pill, padding: '3px 10px' }}>{o.label}</span>}
              </div>
            )
          })}
        </section>
      )}

      {watch.length > 0 && (
        <section style={{ marginTop: SPACE[8] }}>
          <div style={label}>ATT HÅLLA KOLL PÅ</div>
          {watch.map(p => (
            <Link key={p.publicId} href={`/players/${p.publicId}`} style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[3]}px 0`, borderBottom: `1px solid ${COLOR.hairline}`, textDecoration: 'none' }}>
              <span style={{ flex: 1, color: COLOR.ink, fontSize: TYPE.body, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              {p.licenceAverage != null && <span style={{ color: COLOR.ink, fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{p.licenceAverage}</span>}
            </Link>
          ))}
        </section>
      )}

      {h2h.length === 0 && watch.length === 0 && (
        <p style={{ color: COLOR.ink3, fontSize: TYPE.body, textAlign: 'center', padding: `${SPACE[12]}px 0` }}>Ingen scouting-data för motståndaren ännu.</p>
      )}
    </div>
  )
}
