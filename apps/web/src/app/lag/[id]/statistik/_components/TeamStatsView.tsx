'use client'

import ProfileTrend from '@/components/ProfileTrend'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { TeamStats } from '@bowlkollen/core'

// The team's deep stats — its answer to the player profile. Season snitt hero +
// the ProfileTrend glow graph, home/away split, records, and a per-player snitt
// leaderboard. Ink-first, gold for the focal snitt, green/red only for outcomes.

function FormDots({ form }: { form: TeamStats['form'] }) {
  if (form.length === 0) return null
  // Newest last reads more naturally left→right; form is newest-first.
  const ordered = [...form].reverse()
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {ordered.map((o, i) => {
        const c = o === 'W' ? COLOR.green : o === 'L' ? COLOR.red : COLOR.ink3
        const letter = o === 'W' ? 'V' : o === 'L' ? 'F' : 'O'
        return (
          <span key={i} title={letter} style={{
            width: 22, height: 22, borderRadius: 6, background: `${c}22`, color: c,
            fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{letter}</span>
        )
      })}
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.lg, padding: SPACE[4], flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.06em', color: COLOR.ink3, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent ?? COLOR.ink, fontFamily: FONT.score, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function TeamStatsView({ stats, season }: { stats: TeamStats; season: 'current' | 'last' }) {
  const { record } = stats
  const trendPoints = stats.trend.map(t => ({ avg: t.average, date: t.date, label: t.opponent }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
      {season === 'last' && (
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>
          Ingen färdigspelad match den här säsongen än — visar förra säsongen.
        </div>
      )}

      {/* Hero — season snitt + form + record */}
      <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.xl, padding: SPACE[6] }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACE[4] }}>
          <div>
            <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, textTransform: 'uppercase' }}>Säsongssnitt</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: COLOR.gold, fontFamily: FONT.score, lineHeight: 1, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {stats.teamAverage ?? '–'}
            </div>
            <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 6 }}>
              {stats.played} {stats.played === 1 ? 'match' : 'matcher'} · {record.wins}–{record.losses}{record.draws ? `–${record.draws}` : ''} · {stats.winPct}% vinst
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: SPACE[2] }}>
            <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.06em', color: COLOR.ink3 }}>FORM</div>
            <FormDots form={stats.form} />
          </div>
        </div>
      </div>

      {/* Trend — the glow graph, same language as the player profile */}
      {trendPoints.length >= 2 && (
        <ProfileTrend
          points={trendPoints}
          label="Lagsnitt per match"
          restValue={stats.teamAverage ?? undefined}
          baseline={stats.teamAverage}
          caption={`${trendPoints.length} matcher`}
          accent={COLOR.gold}
        />
      )}

      {/* Home / away */}
      <div style={{ display: 'flex', gap: SPACE[3] }}>
        <Stat label="Hemma" value={stats.home.average != null ? String(stats.home.average) : '–'}
          sub={`${stats.home.wins}–${stats.home.losses}${stats.home.draws ? `–${stats.home.draws}` : ''} · ${stats.home.played} m`} />
        <Stat label="Borta" value={stats.away.average != null ? String(stats.away.average) : '–'}
          sub={`${stats.away.wins}–${stats.away.losses}${stats.away.draws ? `–${stats.away.draws}` : ''} · ${stats.away.played} m`} />
      </div>

      {/* Highs */}
      <div style={{ display: 'flex', gap: SPACE[3] }}>
        {stats.highGame && (
          <Stat label="Högsta serie" value={String(stats.highGame.pins)} sub={stats.highGame.name} accent={COLOR.gold} />
        )}
        {stats.highMatch && (
          <Stat label="Bästa lagresultat" value={String(stats.highMatch.total)} sub={`mot ${stats.highMatch.opponent}`} />
        )}
      </div>

      {/* Per-player snitt leaderboard */}
      {stats.players.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', color: COLOR.ink2, textTransform: 'uppercase', padding: `${SPACE[2]}px ${SPACE[1]}px` }}>
            Spelare · snitt
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats.players.map((p, i) => (
              <div key={p.lic || p.name} style={{
                display: 'flex', alignItems: 'center', gap: SPACE[3],
                background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.lg,
                padding: `${SPACE[3]}px ${SPACE[4]}px`,
              }}>
                <div style={{ width: 22, textAlign: 'center', fontSize: TYPE.caption, fontWeight: 800, color: i === 0 ? COLOR.gold : COLOR.ink3, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 1 }}>{p.matches} m · {p.games} serier · högsta {p.high}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLOR.ink, fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums' }}>{p.average}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
