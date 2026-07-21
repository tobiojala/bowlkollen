'use client'

import React from 'react'
import { TrendingUp } from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'
import { COLOR, SPACE, RADIUS, TYPE, FONT } from '@/lib/brand'
import { teamColor, teamInitials, shortName } from '@/lib/utils'
import type { Match, Player, PlayerMomentum } from '@/lib/types'

type Props = {
  teamId:         string
  completed:      Match[]
  upcoming:       Match[]
  players:        Player[]
  playerMomentum: Record<string, PlayerMomentum>
}

const W = 172

export default function TeamStoryCards({ teamId, completed, upcoming, players, playerMomentum }: Props) {
  const { isDark } = useColors()
  const isHome = (m: Match) => m.home_team_id === teamId

  const lastMatch = completed[0] ?? null
  const nextMatch = upcoming[0]  ?? null

  const hotPlayer = [...players]
    .filter(p => playerMomentum[p.id]?.level === 'rising')
    .sort((a, b) => (playerMomentum[b.id]?.delta ?? 0) - (playerMomentum[a.id]?.delta ?? 0))[0] ?? null

  const last5    = completed.slice(0, 5)
  const formWins = last5.filter(m => isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!).length

  const CardShell = ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: W, minHeight: 148, flexShrink: 0, borderRadius: RADIUS.lg, padding: SPACE[4], display: 'flex', flexDirection: 'column', background: COLOR.surface, border: `1px solid ${COLOR.hairline}` }}>
      {children}
    </div>
  )

  const CardLabel = ({ text }: { text: string }) => (
    <div style={{ fontSize: TYPE.caption, fontWeight: 700, color: COLOR.ink3, marginBottom: SPACE[3] }}>
      {text}
    </div>
  )

  const OppBadge = ({ name }: { name: string }) => {
    const tc = teamColor(name, isDark)
    return (
      <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, background: tc.bg, border: `1.5px solid ${tc.border}`, color: tc.text }}>
        {teamInitials(name)}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: SPACE[3], overflowX: 'auto', padding: `${SPACE[1]}px ${SPACE[4]}px ${SPACE[4]}px`, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

      {/* Last result */}
      {lastMatch && (
        <CardShell>
          <CardLabel text="Senaste match" />
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], marginBottom: SPACE[3] }}>
            <OppBadge name={isHome(lastMatch) ? lastMatch.away.name : lastMatch.home.name} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700, color: COLOR.ink }}>
              {shortName(isHome(lastMatch) ? lastMatch.away.name : lastMatch.home.name)}
            </span>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            {(() => {
              const my   = isHome(lastMatch) ? lastMatch.home_score : lastMatch.away_score
              const opp  = isHome(lastMatch) ? lastMatch.away_score : lastMatch.home_score
              const won  = my !== null && opp !== null && my > opp
              const lost = my !== null && opp !== null && my < opp
              const rc   = won ? COLOR.green : lost ? COLOR.red : COLOR.gold
              return (
                <>
                  <span style={{ fontFamily: FONT.display, fontSize: 28, fontWeight: 900, lineHeight: 1, color: COLOR.ink }}>
                    {my}<span style={{ fontSize: 20, margin: '0 4px', color: COLOR.ink3 }}>–</span>{opp}
                  </span>
                  <span style={{ borderRadius: RADIUS.sm, padding: `${SPACE[1]}px ${SPACE[2]}px`, fontSize: 11, fontWeight: 800, background: rc + '22', color: rc }}>
                    {won ? 'V' : lost ? 'F' : 'O'}
                  </span>
                </>
              )
            })()}
          </div>
        </CardShell>
      )}

      {/* Next match */}
      {nextMatch && (
        <CardShell>
          <CardLabel text="Nästa match" />
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], marginBottom: SPACE[3] }}>
            <OppBadge name={isHome(nextMatch) ? nextMatch.away.name : nextMatch.home.name} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700, color: COLOR.ink }}>
              {shortName(isHome(nextMatch) ? nextMatch.away.name : nextMatch.home.name)}
            </span>
          </div>
          <div style={{ marginTop: 'auto' }}>
            {(() => {
              const d         = new Date(nextMatch.date)
              const days      = ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag']
              const time      = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
              const msLeft    = d.getTime() - Date.now()
              const hoursLeft = Math.floor(msLeft / 3_600_000)
              const showTimer = msLeft > 0 && hoursLeft < 48
              return (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink }}>{days[d.getDay()]}</div>
                  <div style={{ fontSize: 12, color: COLOR.ink3 }}>{time}</div>
                  {showTimer && <div style={{ marginTop: SPACE[1], fontSize: 11, fontWeight: 700, color: COLOR.gold }}>om {hoursLeft}h</div>}
                </>
              )
            })()}
          </div>
        </CardShell>
      )}

      {/* Hot player OR form */}
      {hotPlayer ? (
        <CardShell>
          <CardLabel text="I form" />
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], marginBottom: SPACE[3] }}>
            {(() => {
              const tc = teamColor(hotPlayer.name, isDark)
              return (
                <>
                  <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, background: tc.bg, border: `1.5px solid ${tc.border}`, color: tc.text }}>
                    {teamInitials(hotPlayer.name).slice(0, 2)}
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700, color: COLOR.ink }}>
                    {hotPlayer.name.split(' ')[0]}
                  </span>
                </>
              )
            })()}
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACE[1] }}>
              <TrendingUp size={12} color={COLOR.green} />
              <span style={{ fontFamily: FONT.display, fontSize: 22, fontWeight: 900, lineHeight: 1, color: COLOR.green }}>
                +{playerMomentum[hotPlayer.id].delta}
              </span>
            </div>
            <div style={{ marginTop: 2, fontSize: TYPE.caption, color: COLOR.ink3 }}>
              pins senaste 3 · snitt {playerMomentum[hotPlayer.id].seasonAvg}
            </div>
          </div>
        </CardShell>
      ) : last5.length > 0 ? (
        <CardShell>
          <CardLabel text="Form senaste 5" />
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: SPACE[2] }}>
              {last5.map((m, i) => {
                const won  = isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!
                const lost = isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!
                const c    = won ? COLOR.green : lost ? COLOR.red : COLOR.gold
                return (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: RADIUS.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: c + '22', color: c }}>
                    {won ? 'V' : lost ? 'F' : 'O'}
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink }}>
              {formWins}V av {last5.length}
            </div>
          </div>
        </CardShell>
      ) : null}

    </div>
  )
}
