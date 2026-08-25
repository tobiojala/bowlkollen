'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'
import { matchKickoff } from '@bowlkollen/core'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { ProGate } from '@/components/ProGate'
import type { BitsMatchDetail } from '@/lib/types'

type Outcome = 'V' | 'F' | 'O'
type TeamForm = { results: Outcome[]; avgFor: number; avgAgainst: number; played: number }

function useUpcoming(homeId: number | null, awayId: number | null) {
  return useQuery<{ home: TeamForm; away: TeamForm }>({
    queryKey: ['match-upcoming', homeId, awayId],
    enabled: !!homeId && !!awayId,
    staleTime: STALE.MEDIUM,
    queryFn: async () => {
      const db = createClient()
      const form = async (teamId: number): Promise<TeamForm> => {
        const { data } = await db.from('bits_matches')
          .select('home_bits_team_id, away_bits_team_id, home_result, away_result, match_date')
          .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
          .eq('is_finished', true)
          .order('match_date', { ascending: false })
          .limit(8)
        const rows = ((data ?? []) as { home_bits_team_id: number; away_bits_team_id: number; home_result: number | null; away_result: number | null }[])
          .filter(r => r.home_result != null && r.away_result != null)
        const results: Outcome[] = []; let f = 0, a = 0
        for (const r of rows) {
          const isHome = r.home_bits_team_id === teamId
          const my = (isHome ? r.home_result : r.away_result) as number
          const opp = (isHome ? r.away_result : r.home_result) as number
          f += my; a += opp
          results.push(my > opp ? 'V' : my < opp ? 'F' : 'O')
        }
        const n = rows.length
        return { results: results.slice(0, 5), avgFor: n ? Math.round(f / n) : 0, avgAgainst: n ? Math.round(a / n) : 0, played: n }
      }
      const [home, away] = await Promise.all([form(homeId!), form(awayId!)])
      return { home, away }
    },
  })
}

const DOT: Record<Outcome, string> = { V: COLOR.green, F: COLOR.red, O: COLOR.ink2 }
function FormDots({ results }: { results: Outcome[] }) {
  if (!results.length) return <span style={{ fontSize: TYPE.caption, color: COLOR.ink4 }}>—</span>
  return (
    <span style={{ display: 'inline-flex', gap: 5 }}>
      {results.map((o, i) => (
        <span key={i} style={{ width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: DOT[o], background: `${DOT[o]}22` }}>{o}</span>
      ))}
    </span>
  )
}

// The upcoming-match state: real kickoff time + venue + oil + both teams' form
// (free), and a directional prognos from recent banpoäng form (Pro, non-official).
export function UpcomingPanel({ match }: { match: BitsMatchDetail }) {
  const { data } = useUpcoming(match.home_bits_team_id, match.away_bits_team_id)
  const time = matchKickoff(match.match_datetime)
  const dateStr = new Date(match.match_date + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })

  const netHome = data ? data.home.avgFor - data.home.avgAgainst : 0
  const netAway = data ? data.away.avgFor - data.away.avgAgainst : 0
  const favName = netHome === netAway ? null : (netHome > netAway ? match.home_team_name : match.away_team_name)
  const edge = Math.abs(netHome - netAway)

  return (
    <div style={{ marginTop: SPACE[8] }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACE[3], flexWrap: 'wrap' }}>
        {time && <span style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 32, fontWeight: 800, color: COLOR.gold }}>{time}</span>}
        <span style={{ fontSize: TYPE.body, color: COLOR.ink2, textTransform: 'capitalize' }}>
          {dateStr}{match.hall_name ? ` · ${match.hall_name}` : ''}{match.hall_city ? `, ${match.hall_city}` : ''}
        </span>
      </div>

      <div style={{ display: 'flex', gap: SPACE[3], flexWrap: 'wrap', marginTop: SPACE[4] }}>
        {match.oil_pattern && <Fact k="OLJA" v={match.oil_pattern} />}
        <Fact k={`${match.home_team_name} form`.toUpperCase()} v={<FormDots results={data?.home.results ?? []} />} />
        <Fact k={`${match.away_team_name} form`.toUpperCase()} v={<FormDots results={data?.away.results ?? []} />} />
      </div>

      <ProGate>
        {favName && data && (data.home.played + data.away.played > 0) && (
          <div style={{ marginTop: SPACE[4], background: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[4], maxWidth: 460 }}>
            <div style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3 }}>PROGNOS · UTIFRÅN FORM</div>
            <div style={{ fontSize: TYPE.body, color: COLOR.ink, marginTop: SPACE[2] }}>
              <b style={{ fontWeight: 800 }}>{favName}</b> favorit
              {edge > 0 && <span style={{ color: COLOR.ink3 }}> · +{edge} banpoäng/match i snittform</span>}
            </div>
            <div style={{ fontSize: TYPE.caption, color: COLOR.ink4, marginTop: SPACE[1] }}>Riktning utifrån senaste matcherna — inte officiell.</div>
          </div>
        )}
      </ProGate>
    </div>
  )
}

function Fact({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ background: COLOR.surface, borderRadius: RADIUS.md, padding: `${SPACE[3]}px ${SPACE[4]}px`, flex: '1 1 150px' }}>
      <div style={{ fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.06em', color: COLOR.ink4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k}</div>
      <div style={{ fontSize: TYPE.body, fontWeight: 700, marginTop: SPACE[2], color: COLOR.ink }}>{v}</div>
    </div>
  )
}
