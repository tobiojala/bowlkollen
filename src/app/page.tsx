'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { ChevronRight, Trophy, Calendar, ArrowRight, Bell, Heart } from 'lucide-react'

type Match = {
  id: string; date: string; status: string
  home_score: number | null; away_score: number | null
  division: string | null
  home: { id: string; name: string }
  away: { id: string; name: string }
}

type Standing = { team: { id: string; name: string }; points: number; played: number; diff: number }
type FavTeam = { id: string; name: string; nextMatch?: Match; lastResult?: Match }

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

function teamInitials(n: string) {
  return shortName(n).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
}

function teamColor(n: string, isDark: boolean) {
  const hue = n.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return {
    bg: isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`,
    border: `hsl(${hue},50%,45%)`,
    text: `hsl(${hue},50%,45%)`,
  }
}

function divLabel(d: string) {
  if (d.includes('Elitserien') && d.includes('Herrar')) return { short: 'ELITSERIEN H', color: '#4a90d9' }
  if (d.includes('Elitserien') && d.includes('Damer')) return { short: 'ELITSERIEN D', color: '#d94a90' }
  if (d.includes('SM-slutspel')) return { short: 'SM-SLUTSPEL', color: '#f5c200' }
  if (d.includes('Allsvenskan')) return { short: 'ALLSVENSKAN', color: '#5ba85a' }
  return { short: d.replace(' Herrar', ' H').replace(' Damer', ' D').toUpperCase().slice(0, 16), color: '#6b7a99' }
}

function calcStandings(teams: any[], matches: any[]): Standing[] {
  const table: Record<string, Standing> = {}
  teams.forEach(t => { table[t.id] = { team: t, played: 0, points: 0, diff: 0 } })
  matches.forEach((m: any) => {
    const h = table[m.home_team_id]; const a = table[m.away_team_id]
    if (!h || !a) return
    h.played++; a.played++
    h.diff += m.home_score - m.away_score; a.diff += m.away_score - m.home_score
    if (m.home_score > m.away_score) h.points += 2
    else if (m.away_score > m.home_score) a.points += 2
    else { h.points++; a.points++ }
  })
  return Object.values(table).filter(s => s.played > 0)
    .sort((a, b) => b.points - a.points || b.diff - a.diff).slice(0, 5)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'God natt'
  if (h < 10) return 'God morgon'
  if (h < 12) return 'God förmiddag'
  if (h < 17) return 'God eftermiddag'
  if (h < 21) return 'God kväll'
  return 'God natt'
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
  const [favTeams, setFavTeams] = useState<FavTeam[]>([])
  const [favPlayers, setFavPlayers] = useState<any[]>([])
  const [availabilityReminder, setAvailabilityReminder] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      // Core data
      const [{ data: results }, { data: upcomingData }, { data: teams }, { data: eliteMatches }] = await Promise.all([
        supabase.from('matches').select('id,date,status,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)').eq('status','completed').not('home_score','is',null).order('date',{ascending:false}).limit(12),
        supabase.from('matches').select('id,date,status,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)').eq('status','upcoming').order('date',{ascending:true}).limit(3),
        supabase.from('teams').select('id,name'),
        supabase.from('matches').select('home_team_id,away_team_id,home_score,away_score').eq('division','Elitserien Herrar').eq('status','completed').not('home_score','is',null),
      ])

      if (results) setMatches(results as unknown as Match[])
      if (upcomingData) setUpcoming(upcomingData as unknown as Match[])
      if (teams && eliteMatches) setStandings(calcStandings(teams, eliteMatches))

      if (session?.user) {
        // My captain team
        const { data: claim } = await supabase.from('club_claims').select('team_id,teams:team_id(id,name)').eq('user_id',session.user.id).single()
        if (claim) {
          setMyTeam(claim.teams as any)
          const { data: nextM } = await supabase.from('matches').select('id,date,status,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)').or(`home_team_id.eq.${(claim.teams as any).id},away_team_id.eq.${(claim.teams as any).id}`).eq('status','upcoming').order('date',{ascending:true}).limit(1).single()
          if (nextM) setMyNextMatch(nextM as unknown as Match)

          // Check availability reminder
          if (nextM) {
            const { data: poll } = await supabase.from('availability_polls').select('id,responses:availability_responses(user_id)').eq('team_id',(claim.teams as any).id).eq('match_id',(nextM as any).id).single()
            const hasResponded = poll?.responses?.some((r: any) => r.user_id === session.user.id)
            if (!hasResponded) setAvailabilityReminder({ match: nextM, teamId: (claim.teams as any).id })
          }
        }

        // Favorite teams
        const { data: favs } = await supabase.from('favorites').select('team_id,teams:team_id(id,name),player_id,players:player_id(id,name),type').eq('user_id',session.user.id)
        if (favs && favs.length > 0) {
          const favTeamData = await Promise.all((favs as any[]).filter(f => f.type === 'team' && f.teams).map(async f => {
            const team = f.teams as any
            const { data: nextM } = await supabase.from('matches').select('id,date,status,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)').or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`).eq('status','upcoming').order('date',{ascending:true}).limit(1).single()
            const { data: lastM } = await supabase.from('matches').select('id,date,status,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)').or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`).eq('status','completed').not('home_score','is',null).order('date',{ascending:false}).limit(1).single()
            return { ...team, nextMatch: nextM, lastResult: lastM }
          }))
          setFavTeams(favTeamData)

          // Followed players
          const playerFavs = (favs as any[]).filter(f => f.type === 'player' && f.players)
          setFavPlayers(playerFavs.map((f: any) => f.players))
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  const grouped = matches.reduce((acc, m) => {
    const div = m.division || 'Ovrigt'
    if (!acc[div]) acc[div] = []
    acc[div].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  const MatchRow = ({ m, compact = false }: { m: Match; compact?: boolean }) => {
    const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
    const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
    const hc = teamColor(m.home?.name || '', isDark)
    const ac = teamColor(m.away?.name || '', isDark)
    const isUpcoming = m.status === 'upcoming'
    return (
      <a href={'/matches/' + m.id}
        style={{ display: 'flex', alignItems: 'center', padding: compact ? '8px 12px' : '10px 16px', borderBottom: '0.5px solid ' + C.border, textDecoration: 'none', gap: 8 }}
        onMouseEnter={e => (e.currentTarget.style.background = C.card)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end', minWidth: 0 }}>
          <div style={{ fontSize: compact ? 12 : 13, fontWeight: homeWin ? 700 : 400, color: homeWin ? C.text : C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
            {shortName(m.home?.name || '')}
          </div>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: hc.bg, border: '1.5px solid ' + hc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: hc.text, flexShrink: 0 }}>
            {teamInitials(m.home?.name || '')}
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 48, flexShrink: 0 }}>
          {isUpcoming ? (
            <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>
              {new Date(m.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
            </div>
          ) : (
            <div style={{ fontSize: 15, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>
              <span style={{ color: homeWin ? '#f5c200' : C.textMuted }}>{m.home_score}</span>
              <span style={{ color: C.textMuted, fontSize: 11, margin: '0 1px' }}>–</span>
              <span style={{ color: awayWin ? '#f5c200' : C.textMuted }}>{m.away_score}</span>
            </div>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: ac.bg, border: '1.5px solid ' + ac.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: ac.text, flexShrink: 0 }}>
            {teamInitials(m.away?.name || '')}
          </div>
          <div style={{ fontSize: compact ? 12 : 13, fontWeight: awayWin ? 700 : 400, color: awayWin ? C.text : C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortName(m.away?.name || '')}
          </div>
        </div>
      </a>
    )
  }

  const Section = ({ label, color, icon: Icon, href, children }: any) => (
    <div style={{ margin: '16px 0 0' }}>
      <div style={{ padding: '4px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Icon && <Icon size={11} color={color || C.textMuted} />}
          <span style={{ fontSize: 10, fontWeight: 800, color: color || C.textMuted, letterSpacing: 1.5 }}>{label}</span>
        </div>
        {href && (
          <a href={href} style={{ fontSize: 10, color: C.textMuted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            Alla <ChevronRight size={11} />
          </a>
        )}
      </div>
      <div style={{ borderTop: '0.5px solid ' + C.border, borderBottom: '0.5px solid ' + C.border }}>
        {children}
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 24 }}>

        {/* Personalized greeting */}
        {user && (
          <div style={{ padding: '16px 16px 8px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
              {greeting()}{user.user_metadata?.full_name ? ', ' + user.user_metadata.full_name.split(' ')[0] : ''}
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
              Här är ditt bowlingflöde
            </div>
          </div>
        )}

        {/* Availability reminder */}
        {availabilityReminder && (
          <div style={{ margin: '8px 16px', background: 'rgba(245,194,0,0.08)', border: '1px solid rgba(245,194,0,0.2)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={18} color='#f5c200' />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                Har du svarat på tillgänglighet?
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                {shortName(availabilityReminder.match.away?.name || availabilityReminder.match.home?.name || '')} · {new Date(availabilityReminder.match.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
            <a href={'/team/' + availabilityReminder.teamId + '/tillganglighet/' + availabilityReminder.match.id}
              style={{ fontSize: 11, fontWeight: 700, color: '#f5c200', textDecoration: 'none', background: 'rgba(245,194,0,0.12)', borderRadius: 8, padding: '5px 10px', whiteSpace: 'nowrap' as const }}>
              Svara →
            </a>
          </div>
        )}

        {/* My captain team next match */}
        {myTeam && myNextMatch && (
          <div style={{ margin: user ? '8px 16px' : '12px 16px', background: isDark ? 'linear-gradient(135deg,#0d1a2e,#1a2840)' : 'linear-gradient(135deg,#e8f0f8,#d0e0f0)', borderRadius: 16, border: '0.5px solid ' + C.border, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#f5c200', letterSpacing: 1.5 }}>
                {shortName(myTeam.name).toUpperCase()} · NÄSTA MATCH
              </div>
              <a href={'/team/' + myTeam.id + '/intern'} style={{ fontSize: 10, color: C.textMuted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                Intern <ChevronRight size={11} />
              </a>
            </div>
            <MatchRow m={myNextMatch} />
          </div>
        )}

        {/* Favorite teams */}
        {favTeams.length > 0 && (
          <Section label="MINA FAVORITER" color='#e05555' icon={Heart} href="/teams">
            {favTeams.map(t => {
              const tc = teamColor(t.name, isDark)
              const m = t.nextMatch || t.lastResult
              return (
                <div key={t.id} style={{ borderBottom: '0.5px solid ' + C.border }}>
                  <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: tc.bg, border: '1.5px solid ' + tc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: tc.text }}>
                      {teamInitials(t.name)}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{shortName(t.name)}</span>
                    <a href={'/teams/' + t.id} style={{ marginLeft: 'auto', fontSize: 10, color: C.textMuted, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                      <ChevronRight size={14} />
                    </a>
                  </div>
                  {m && <MatchRow m={m as Match} compact />}
                </div>
              )
            })}
          </Section>
        )}

        {/* Followed players */}
        {favPlayers.length > 0 && (
          <Section label="SPELARE JAG FÖLJER" color='#afa9ec' icon={Heart} href="/players">
            {favPlayers.map((p: any) => {
              const hue = p.name.split('').reduce((a: number, ch: string) => a + ch.charCodeAt(0), 0) % 360
              const tc = `hsl(${hue},50%,45%)`
              const tclo = isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`
              return (
                <a key={p.id} href={'/players/' + p.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '0.5px solid ' + C.border, textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: tc, flexShrink: 0 }}>
                    {p.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: C.text }}>{p.name}</div>
                  <ChevronRight size={14} color={C.textMuted} />
                </a>
              )
            })}
          </Section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <Section label="KOMMANDE" icon={Calendar} href="/schema">
            {upcoming.map(m => <MatchRow key={m.id} m={m} />)}
          </Section>
        )}

        {/* Elitserien standings */}
        {standings.length > 0 && (
          <Section label="ELITSERIEN HERRAR" color='#4a90d9' icon={Trophy} href="/league">
            {standings.map((s, i) => {
              const tc = teamColor(s.team.name, isDark)
              return (
                <a key={s.team.id} href={'/teams/' + s.team.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: i < standings.length - 1 ? '0.5px solid ' + C.border : 'none', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 16, fontSize: 12, fontWeight: 800, color: i < 2 ? '#f5c200' : C.textMuted, textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: tc.bg, border: '1.5px solid ' + tc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800, color: tc.text, flexShrink: 0 }}>
                    {teamInitials(s.team.name)}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: i === 0 ? 700 : 400, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {shortName(s.team.name)}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{s.played}M</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? '#f5c200' : C.text, minWidth: 28, textAlign: 'right' }}>{s.points}p</div>
                </a>
              )
            })}
          </Section>
        )}

        {/* Recent results */}
        <div style={{ margin: '16px 0 0' }}>
          <div style={{ padding: '4px 16px 8px' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>SENASTE RESULTAT</span>
          </div>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>Laddar...</div>
          ) : (
            Object.entries(grouped).map(([div, divMatches]) => {
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
            })
          )}
        </div>

        {/* No favorites CTA */}
        {user && favTeams.length === 0 && !myTeam && (
          <div style={{ margin: '16px', padding: '16px', background: C.card, border: '1px solid ' + C.border, borderRadius: 14, textAlign: 'center' }}>
            <Heart size={24} color={C.textMuted} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Följ dina favoritlag</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Gå till ett lags sida och klicka Följ för att se dem här</div>
            <a href="/teams" style={{ fontSize: 12, fontWeight: 700, color: '#f5c200', textDecoration: 'none' }}>
              Hitta lag →
            </a>
          </div>
        )}

        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
          <a href="/schema" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMuted, textDecoration: 'none', fontWeight: 600 }}>
            Se alla matcher <ArrowRight size={14} />
          </a>
        </div>

      </div>
    </main>
  )
}
