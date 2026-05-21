'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { ChevronRight, Trophy, Calendar, ArrowRight } from 'lucide-react'

type Match = {
  id: string
  date: string
  status: string
  home_score: number | null
  away_score: number | null
  division: string | null
  home: { id: string; name: string }
  away: { id: string; name: string }
}

type Standing = {
  team: { id: string; name: string }
  points: number
  played: number
  diff: number
}

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

function teamInitials(n: string) {
  return shortName(n).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
}

function teamColor(n: string, dark: boolean) {
  const hue = n.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return {
    bg: dark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`,
    border: `hsl(${hue},50%,45%)`,
    text: `hsl(${hue},50%,45%)`,
  }
}

function divLabel(d: string) {
  if (d.includes('Elitserien') && d.includes('Herrar')) return { short: 'ELITSERIEN H', color: '#4a90d9' }
  if (d.includes('Elitserien') && d.includes('Damer')) return { short: 'ELITSERIEN D', color: '#d94a90' }
  if (d.includes('SM-slutspel')) return { short: 'SM-SLUTSPEL', color: '#f5c200' }
  if (d.includes('Mellanallsvenskan')) return { short: 'MELLANALLSV', color: '#5ba85a' }
  if (d.includes('Allsvenskan')) return { short: 'ALLSVENSKAN', color: '#5ba85a' }
  return { short: d.replace(' Herrar', ' H').replace(' Damer', ' D').toUpperCase(), color: '#6b7a99' }
}

function calcStandings(teams: any[], matches: any[], division: string): Standing[] {
  const divMatches = matches.filter(m => m.division === division && m.home_score !== null)
  const table: Record<string, Standing> = {}
  teams.forEach(t => { table[t.id] = { team: t, played: 0, points: 0, diff: 0 } as any })
  divMatches.forEach((m: any) => {
    const h = table[m.home_team_id]
    const a = table[m.away_team_id]
    if (!h || !a) return
    h.played++; a.played++
    h.diff += m.home_score - m.away_score
    a.diff += m.away_score - m.home_score
    if (m.home_score > m.away_score) { h.points += 2 }
    else if (m.away_score > m.home_score) { a.points += 2 }
    else { h.points++; a.points++ }
  })
  return Object.values(table)
    .filter(s => s.played > 0)
    .sort((a, b) => b.points - a.points || b.diff - a.diff)
    .slice(0, 5)
}

export default function Home() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'
  const [matches, setMatches] = useState<Match[]>([])
  const [upcoming, setUpcoming] = useState<Match[]>([])
  const [standings, setStandings] = useState<Standing[]>([])
  const [myTeam, setMyTeam] = useState<any>(null)
  const [myNextMatch, setMyNextMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      // Load recent results
      const { data: results } = await supabase
        .from('matches')
        .select('id, date, status, home_score, away_score, division, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
        .eq('status', 'completed')
        .not('home_score', 'is', null)
        .order('date', { ascending: false })
        .limit(12)

      // Load upcoming
      const { data: upcomingData } = await supabase
        .from('matches')
        .select('id, date, status, home_score, away_score, division, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
        .eq('status', 'upcoming')
        .order('date', { ascending: true })
        .limit(3)

      if (results) setMatches(results as unknown as Match[])
      if (upcomingData) setUpcoming(upcomingData as unknown as Match[])

      // Load elitserien standings
      const { data: teams } = await supabase.from('teams').select('id, name')
      const { data: allMatches } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_score, away_score, division')
        .eq('division', 'Elitserien Herrar')
        .eq('status', 'completed')
        .not('home_score', 'is', null)

      if (teams && allMatches) {
        setStandings(calcStandings(teams, allMatches, 'Elitserien Herrar'))
      }

      // Load my team if logged in
      if (session?.user) {
        const { data: claim } = await supabase
          .from('club_claims')
          .select('team_id, teams:team_id(id, name)')
          .eq('user_id', session.user.id)
          .single()

        if (claim) {
          setMyTeam((claim.teams as any))
          // Find next match for my team
          const { data: nextMatch } = await supabase
            .from('matches')
            .select('id, date, status, home_score, away_score, division, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
            .or(`home_team_id.eq.${(claim.teams as any).id},away_team_id.eq.${(claim.teams as any).id}`)
            .eq('status', 'upcoming')
            .order('date', { ascending: true })
            .limit(1)
            .single()
          if (nextMatch) setMyNextMatch(nextMatch as unknown as Match)
        }
      }

      setLoading(false)
    }

    load()
  }, [])

  // Group results by division
  const grouped = matches.reduce((acc, m) => {
    const div = m.division || 'Ovrigt'
    if (!acc[div]) acc[div] = []
    acc[div].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  const MatchRow = ({ m }: { m: Match }) => {
    const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
    const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
    const hc = teamColor(m.home?.name || '', isDark)
    const ac = teamColor(m.away?.name || '', isDark)
    const isUpcoming = m.status === 'upcoming'

    return (
      <a href={'/matches/' + m.id}
        style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '0.5px solid ' + C.border, textDecoration: 'none', gap: 10 }}
        onMouseEnter={e => (e.currentTarget.style.background = C.card)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Home team */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: homeWin ? 700 : 400, color: homeWin ? C.text : C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
            {shortName(m.home?.name || '')}
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: hc.bg, border: '1.5px solid ' + hc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: hc.text, flexShrink: 0 }}>
            {teamInitials(m.home?.name || '')}
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center', minWidth: 52, flexShrink: 0 }}>
          {isUpcoming ? (
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>
              {new Date(m.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
            </div>
          ) : (
            <div style={{ fontSize: 16, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>
              <span style={{ color: homeWin ? '#f5c200' : C.textMuted }}>{m.home_score}</span>
              <span style={{ color: C.textMuted, fontSize: 12, margin: '0 2px' }}>–</span>
              <span style={{ color: awayWin ? '#f5c200' : C.textMuted }}>{m.away_score}</span>
            </div>
          )}
        </div>

        {/* Away team */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: ac.bg, border: '1.5px solid ' + ac.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: ac.text, flexShrink: 0 }}>
            {teamInitials(m.away?.name || '')}
          </div>
          <div style={{ fontSize: 13, fontWeight: awayWin ? 700 : 400, color: awayWin ? C.text : C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortName(m.away?.name || '')}
          </div>
        </div>
      </a>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 24 }}>

        {/* My team next match — personalized hero */}
        {myTeam && myNextMatch && (
          <div style={{ margin: '12px 16px', background: isDark ? 'linear-gradient(135deg,#0d1a2e,#1a2840)' : 'linear-gradient(135deg,#e8f0f8,#d0e0f0)', borderRadius: 16, border: '0.5px solid ' + C.border, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#f5c200', letterSpacing: 1.5 }}>MITT LAG · NÄSTA MATCH</div>
              <a href={'/team/' + myTeam.id + '/intern'} style={{ fontSize: 10, color: C.textMuted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                Lagets sida <ChevronRight size={12} />
              </a>
            </div>
            <MatchRow m={myNextMatch} />
          </div>
        )}

        {/* Upcoming matches */}
        {upcoming.length > 0 && (
          <div style={{ margin: '12px 0 0' }}>
            <div style={{ padding: '4px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} color={C.textMuted} />
                <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>KOMMANDE</span>
              </div>
              <a href="/schema" style={{ fontSize: 10, color: C.textMuted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                Alla <ChevronRight size={12} />
              </a>
            </div>
            <div style={{ borderTop: '0.5px solid ' + C.border, borderBottom: '0.5px solid ' + C.border }}>
              {upcoming.map(m => <MatchRow key={m.id} m={m} />)}
            </div>
          </div>
        )}

        {/* Elitserien standings snapshot */}
        {standings.length > 0 && (
          <div style={{ margin: '16px 0 0' }}>
            <div style={{ padding: '4px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trophy size={12} color='#4a90d9' />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#4a90d9', letterSpacing: 1.5 }}>ELITSERIEN HERRAR</span>
              </div>
              <a href="/league" style={{ fontSize: 10, color: C.textMuted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                Full tabell <ChevronRight size={12} />
              </a>
            </div>
            <div style={{ borderTop: '0.5px solid ' + C.border, borderBottom: '0.5px solid ' + C.border }}>
              {standings.map((s, i) => {
                const tc = teamColor(s.team.name, isDark)
                return (
                  <a key={s.team.id} href={'/teams/' + s.team.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: i < standings.length - 1 ? '0.5px solid ' + C.border : 'none', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 18, fontSize: 12, fontWeight: 800, color: i < 2 ? '#f5c200' : C.textMuted, textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: tc.bg, border: '1.5px solid ' + tc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: tc.text, flexShrink: 0 }}>
                      {teamInitials(s.team.name)}
                    </div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: i === 0 ? 700 : 400, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortName(s.team.name)}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{s.played}M</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? '#f5c200' : C.text, minWidth: 28, textAlign: 'right' }}>{s.points}p</div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent results by division */}
        <div style={{ margin: '16px 0 0' }}>
          <div style={{ padding: '4px 16px 8px' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>SENASTE RESULTAT</span>
          </div>

          {loading && (
            <div style={{ padding: '32px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>Laddar...</div>
          )}

          {!loading && Object.entries(grouped).map(([div, divMatches]) => {
            const dl = divLabel(div)
            return (
              <div key={div} style={{ marginBottom: 4 }}>
                <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 2, background: dl.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: dl.color }}>{dl.short}</span>
                </div>
                <div style={{ borderTop: '0.5px solid ' + C.border }}>
                  {divMatches.slice(0, 4).map(m => <MatchRow key={m.id} m={m} />)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer link */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
          <a href="/schema" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMuted, textDecoration: 'none', fontWeight: 600 }}>
            Se alla matcher <ArrowRight size={14} />
          </a>
        </div>

      </div>
    </main>
  )
}
