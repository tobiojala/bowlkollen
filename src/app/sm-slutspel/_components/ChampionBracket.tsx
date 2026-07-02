'use client'

import { Trophy } from 'lucide-react'
import { COLOR, FONT } from '@/lib/brand'
import { useColors } from '@/components/ThemeProvider'
import type { SmBracket, BracketMatch, BracketEntry } from './bracket'

type Props = { bracket: SmBracket }

const GOLD = COLOR.gold

function TeamRow({ entry, isFirst }: { entry: BracketEntry; isFirst: boolean }) {
  const { C } = useColors()
  const pending = entry.team === null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
      borderTop: isFirst ? 'none' : `1px solid ${C.border}`,
    }}>
      {entry.seed !== null && (
        <span style={{ fontSize: 11, fontWeight: 600, width: 16,
          textAlign: 'center', flexShrink: 0, color: C.textMuted }}>
          {entry.seed}
        </span>
      )}
      <span style={{
        flex: 1, fontSize: 15,
        fontWeight: entry.isWinner ? 700 : 400,
        color: pending ? C.textMuted : C.text,
        fontStyle: pending ? 'italic' : 'normal',
      }}>
        {pending ? 'Avgörs av semifinal' : entry.team}
      </span>
      {entry.isWinner && (
        <span style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>●</span>
      )}
    </div>
  )
}

function SeriesScores({ match }: { match: BracketMatch }) {
  const { C } = useColors()
  if (!match.games?.length) return null

  return (
    <div style={{ paddingTop: 8, paddingBottom: 4, display: 'flex', gap: 14,
      alignItems: 'center', flexWrap: 'wrap' as const }}>
      {match.seriesResult && (
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
          {match.seriesResult}
        </span>
      )}
      {match.games.map((g, i) => {
        const homeWon = g.home !== null && g.away !== null && g.home > g.away
        const awayWon = g.home !== null && g.away !== null && g.away > g.home
        return (
          <span key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.textMuted }}>M{i + 1}</span>
            <span style={{ fontSize: 12, fontFamily: FONT.display,
              fontWeight: homeWon ? 700 : 400, color: homeWon ? C.text : C.textMuted }}>
              {g.home ?? '–'}
            </span>
            <span style={{ fontSize: 11, color: C.textMuted }}>–</span>
            <span style={{ fontSize: 12, fontFamily: FONT.display,
              fontWeight: awayWon ? 700 : 400, color: awayWon ? C.text : C.textMuted }}>
              {g.away ?? '–'}
            </span>
            {g.home === g.away && g.home !== null && (
              <span style={{ fontSize: 11, color: C.textMuted }}>OA</span>
            )}
          </span>
        )
      })}
    </div>
  )
}

function MatchBlock({ match }: { match: BracketMatch }) {
  const { C } = useColors()
  const isFinal = match.round === 'final'

  return (
    <div style={{
      paddingLeft: isFinal ? 14 : 0,
      borderLeft: isFinal ? `2px solid ${GOLD}` : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
          textTransform: 'uppercase' as const, color: C.text }}>
          {match.label}
        </span>
        {match.date && (
          <span style={{ fontSize: 11, color: C.textMuted }}>{match.date}</span>
        )}
      </div>

      <TeamRow entry={match.home} isFirst />
      <TeamRow entry={match.away} isFirst={false} />

      {match.games && <SeriesScores match={match} />}
    </div>
  )
}

function Connector() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
      <div style={{ width: 1, height: 28, background: `${COLOR.ink4}60` }} />
    </div>
  )
}

function ChampionSlot({ name, division }: { name: string | null; division: string }) {
  const { C } = useColors()

  if (!name) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0' }}>
      <Trophy size={16} color={C.textMuted} strokeWidth={1.5} />
      <span style={{ fontSize: 13, color: C.textMuted, fontStyle: 'italic' }}>
        Mästare avgörs i finalen
      </span>
    </div>
  )

  return (
    <div style={{ padding: '20px 0 8px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted,
        letterSpacing: 1.5, marginBottom: 6 }}>
        SVENSKA MÄSTARE {division.toUpperCase()}
      </div>
      <div style={{ fontFamily: FONT.display, fontSize: 26, fontWeight: 900,
        color: GOLD, letterSpacing: -0.5, lineHeight: 1.1 }}>
        {name}
      </div>
    </div>
  )
}

export function ChampionBracket({ bracket }: Props) {
  const semifinals = bracket.matches.filter(m => m.round === 'sf')
  const final      = bracket.matches.find(m => m.round === 'final')

  return (
    <div style={{ padding: '24px 20px 4px' }}>

      <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3,
        letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 18 }}>
        Semifinal
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {semifinals.map(m => <MatchBlock key={m.id} match={m} />)}
      </div>

      <Connector />

      <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3,
        letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 18 }}>
        Final
      </div>
      {final && <MatchBlock match={final} />}

      <Connector />

      <ChampionSlot name={bracket.champion} division={bracket.division} />
    </div>
  )
}
