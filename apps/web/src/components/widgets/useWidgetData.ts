import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export type WidgetData = {
  user: any
  myTeam: any
  myNextMatch: any
  myLastMatch: any
  favTeams: any[]
  standings: any[]
  upcoming: any[]
  recentResults: any[]
  myPlayer: any
  myStats: { avg: number; best: number; over200: number; matches: number } | null
  availabilityStatus: 'yes' | 'no' | 'maybe' | null
  availabilityMatch: any
  availabilityCounts: { yes: number; maybe: number; no: number } | null
  teamPosts: any[]
  loading: boolean
}

function calcStandings(teams: any[], matches: any[]) {
  const table: Record<string, any> = {}
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
  return Object.values(table).filter((s: any) => s.played > 0)
    .sort((a: any, b: any) => b.points - a.points || b.diff - a.diff).slice(0, 6)
}

export function useWidgetData(): WidgetData {
  const [data, setData] = useState<WidgetData>({
    user: null, myTeam: null, myNextMatch: null, myLastMatch: null,
    favTeams: [], standings: [], upcoming: [], recentResults: [],
    myPlayer: null, myStats: null, availabilityStatus: null,
    availabilityMatch: null, availabilityCounts: null, teamPosts: [], loading: true
  })

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      // Always load public data
      const [{ data: upcoming }, { data: recent }, { data: teams }, { data: eliteM }] = await Promise.all([
        supabase.from('matches').select('id,date,status,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)').eq('status','upcoming').order('date',{ascending:true}).limit(5),
        supabase.from('matches').select('id,date,status,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)').eq('status','completed').not('home_score','is',null).order('date',{ascending:false}).limit(8),
        supabase.from('teams').select('id,name'),
        supabase.from('matches').select('home_team_id,away_team_id,home_score,away_score').eq('division','Elitserien Herrar').eq('status','completed').not('home_score','is',null),
      ])

      const standings = teams && eliteM ? calcStandings(teams, eliteM) : []

      if (!session) {
        setData(d => ({ ...d, upcoming: upcoming || [], recentResults: recent || [], standings, loading: false }))
        return
      }

      const user = session.user

      // Parallel load of all user-specific data
      const [
        { data: claim },
        { data: playerClaim },
        { data: favs },
      ] = await Promise.all([
        supabase.from('club_claims').select('team_id,teams:team_id(id,name)').eq('user_id', user.id).single(),
        supabase.from('player_claims').select('player_id,players:player_id(id,name,hand,style,ball_brand,avatar_url)').eq('user_id', user.id).single(),
        supabase.from('favorites').select('team_id,teams:team_id(id,name),type').eq('user_id', user.id).eq('type','team'),
      ])

      let myTeam = null, myNextMatch = null, myLastMatch = null
      let availabilityStatus = null, availabilityMatch = null, availabilityCounts = null, teamPosts: any[] = []

      if (claim?.teams) {
        myTeam = claim.teams as any
        const [{ data: nextM }, { data: lastM }, { data: posts }] = await Promise.all([
          supabase.from('matches').select('id,date,status,home_team_id,away_team_id,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)').or(`home_team_id.eq.${myTeam.id},away_team_id.eq.${myTeam.id}`).eq('status','upcoming').order('date',{ascending:true}).limit(1).single(),
          supabase.from('matches').select('id,date,status,home_team_id,away_team_id,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)').or(`home_team_id.eq.${myTeam.id},away_team_id.eq.${myTeam.id}`).eq('status','completed').not('home_score','is',null).order('date',{ascending:false}).limit(1).single(),
          supabase.from('team_posts').select('*').eq('team_id', myTeam.id).order('created_at',{ascending:false}).limit(3),
        ])
        myNextMatch = nextM || null
        myLastMatch = lastM || null
        teamPosts = posts || []

        if (nextM) {
          const { data: poll } = await supabase.from('availability_polls').select('id,responses:availability_responses(user_id,response)').eq('team_id', myTeam.id).eq('match_id', (nextM as any).id).single()
          if (poll) {
            const responses = (poll.responses as any[]) || []
            const mine = responses.find(r => r.user_id === user.id)
            availabilityStatus = mine?.response || null
            availabilityCounts = {
              yes: responses.filter(r => r.response === 'yes').length,
              maybe: responses.filter(r => r.response === 'maybe').length,
              no: responses.filter(r => r.response === 'no').length,
            }
          }
          availabilityMatch = nextM
        }
      }

      // Player stats
      let myStats = null
      if (playerClaim?.players) {
        const { data: results } = await supabase.from('match_results').select('games').eq('player_id', (playerClaim.players as any).id)
        if (results) {
          const allGames = results.flatMap((r: any) => (r.games || []).filter((g: number) => g > 0))
          const avg = allGames.length > 0 ? Math.round(allGames.reduce((a, b) => a + b, 0) / allGames.length) : 0
          const seriesGroups = Array.from({ length: Math.floor(allGames.length / 4) }, (_, i) => allGames.slice(i*4,i*4+4).reduce((a,b)=>a+b,0))
          const best = seriesGroups.length > 0 ? Math.max(...seriesGroups) : 0
          myStats = { avg, best, over200: allGames.filter(g => g >= 200).length, matches: results.length }
        }
      }

      // Fav teams with latest results
      const favTeams = favs ? await Promise.all((favs as any[]).filter(f => f.teams).map(async f => {
        const team = f.teams as any
        const { data: lastM } = await supabase.from('matches').select('id,date,status,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)').or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`).eq('status','completed').not('home_score','is',null).order('date',{ascending:false}).limit(1).single()
        return { ...team, lastResult: lastM }
      })) : []

      setData({
        user, myTeam, myNextMatch, myLastMatch, favTeams,
        standings, upcoming: upcoming || [], recentResults: recent || [],
        myPlayer: playerClaim?.players || null, myStats,
        availabilityStatus, availabilityMatch, availabilityCounts, teamPosts, loading: false
      })
    }
    load()
  }, [])

  return data
}
