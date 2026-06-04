'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import TeamTableWidget from '@/components/TeamTableWidget'
import NextMatchPreview from '@/components/NextMatchPreview'
import TopPerformers from '@/components/TopPerformers'
import { TeamPageSkeleton } from '@/components/teams/TeamPageSkeleton'
import { TeamHero } from '@/components/teams/TeamHero'
import { TeamStatsBar } from '@/components/teams/TeamStatsBar'
import { TeamTabBar, type TeamTab } from '@/components/teams/TeamTabBar'
import { TeamMatchRow } from '@/components/teams/TeamMatchRow'
import { TeamH2HTab } from '@/components/teams/TeamH2HTab'
import { TeamSquadTab } from '@/components/teams/TeamSquadTab'
import { TeamCommunityTab } from '@/components/teams/TeamCommunityTab'
import { Button } from '@/components/ui'
import { teamDivisionColor } from '@/lib/team-ui'

type Props = { params: Promise<{ id: string }> }
type Team = { id: string; name: string; club: string; city: string | null; slug: string | null; club_slug: string | null; description: string | null; contact_email: string | null; contact_phone: string | null; home_hall: string | null; website: string | null; instagram: string | null; facebook: string | null; logo_url: string | null }
type Match = {
  id: string; date: string; status: string
  home_score: number | null; away_score: number | null
  round: number; venue: string; division: string
  home_team_id: string; away_team_id: string
  home: { id: string; name: string }
  away: { id: string; name: string }
}
type Player = { id: string; name: string }

export default function TeamPage({ params }: Props) {
  const { theme } = useTheme()
  const [id, setId] = useState<string | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [clubTeams, setClubTeams] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState('')
  const [postingType, setPostingType] = useState<'news' | 'lineup'>('news')
  const [submittingPost, setSubmittingPost] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<TeamTab>('results')
  const [expandedOpp, setExpandedOpp] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingTeam, setEditingTeam] = useState(false)
  const [savingTeam, setSavingTeam] = useState(false)
  const [teamEdit, setTeamEdit] = useState<any>({})
  const [playerStats, setPlayerStats] = useState<Record<string, { avg: number; matches: number; high: number }>>({})
  const [clubLogoUrl, setClubLogoUrl] = useState<string | null>(null)
  const [logoFailed, setLogoFailed] = useState(false)
  const submitPost = async () => {
    if (!newPost.trim() || !id) return
    setSubmittingPost(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('team_posts')
      .insert({ team_id: id, user_id: (await supabase.auth.getSession()).data.session?.user.id, content: newPost, post_type: postingType })
      .select('*')
      .single()
    if (!error && data) {
      setPosts(prev => [data, ...prev])
      setNewPost('')
    }
    setSubmittingPost(false)
  }

  const deletePost = async (postId: string) => {
    const supabase = createClient()
    await supabase.from('team_posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const saveTeam = async () => {
    if (!id) return
    setSavingTeam(true)
    const supabase = createClient()
    const { error } = await supabase.from('teams').update({
      description: teamEdit.description,
      contact_email: teamEdit.contact_email,
      contact_phone: teamEdit.contact_phone,
      home_hall: teamEdit.home_hall,
      website: teamEdit.website,
      instagram: teamEdit.instagram,
      facebook: teamEdit.facebook,
      city: teamEdit.city,
    }).eq('id', id)
    if (!error) {
      setTeam((prev: any) => prev ? { ...prev, ...teamEdit } : null)
      setEditingTeam(false)
    }
    setSavingTeam(false)
  }

  const copyLink = () => {
    const url = team?.slug
      ? window.location.origin + '/' + team.slug
      : window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    Promise.all([
      supabase.from('teams').select('*, slug').eq('id', id).single(),
      supabase.from('matches')
        .select('id, date, status, home_score, away_score, round, venue, division, home_team_id, away_team_id, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
        .or('home_team_id.eq.' + id + ',away_team_id.eq.' + id)
        .order('date', { ascending: false }),
      supabase.from('players').select('id, name').eq('team_id', id).order('name'),
    ]).then(async ([{ data: t }, { data: m }, { data: p }]) => {
      if (t) {
        setTeam(t as Team)
        setTeamEdit(t)
        // Fetch the club's BITS logo by matching club name
        if ((t as any).club) {
          supabase.from('bits_clubs').select('logo_url').eq('name', (t as any).club).limit(1)
            .then(({ data }) => { if (data?.[0]?.logo_url) setClubLogoUrl(data[0].logo_url) })
        }
        if ((t as any).club_slug) {
          supabase.from('teams').select('id, name, club_slug, team_path')
            .eq('club_slug', (t as any).club_slug)
            .neq('id', id)
            .order('name')
            .then(({ data: ct }) => { if (ct) setClubTeams(ct as any[]) })
        }
      }
      if (m) setMatches(m as unknown as Match[])

      // Check if logged in user is admin of this team
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: claim } = await supabase
          .from('club_claims')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('team_id', id)
          .single()
        setIsAdmin(!!claim)
      }
      if (p) {
        setPlayers(p as Player[])
        const playerIds = (p as Player[]).map(pl => pl.id)
        if (playerIds.length > 0) {
          const { data: pStats } = await supabase
            .from('match_results')
            .select('player_id, games')
            .in('player_id', playerIds)
          const grouped: Record<string, number[]> = {}
          const mCount: Record<string, number> = {}
          pStats?.forEach((r: any) => {
            if (!grouped[r.player_id]) { grouped[r.player_id] = []; mCount[r.player_id] = 0 }
            grouped[r.player_id].push(...(r.games || []).filter((g: number) => g > 0))
            mCount[r.player_id] = (mCount[r.player_id] || 0) + 1
          })
          const statsMap: Record<string, { avg: number; matches: number; high: number }> = {}
          Object.entries(grouped).forEach(([pid, games]) => {
            statsMap[pid] = {
              avg: games.length > 0 ? Math.round(games.reduce((a, b) => a + b, 0) / games.length) : 0,
              matches: mCount[pid] || 0,
              high: games.length > 0 ? Math.max(...games) : 0,
            }
          })
          setPlayerStats(statsMap)
        }
      }

      // Load community posts
      const { data: postsData } = await supabase
        .from('team_posts')
        .select('*')
        .eq('team_id', id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (postsData) setPosts(postsData)

      setLoading(false)
    }).catch(() => { setError(true); setLoading(false) })
  }, [id])

  if (loading) return <TeamPageSkeleton />

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-light-bg font-sans dark:bg-dark-bg">
        <p className="text-sm font-semibold bk-text-primary">Kunde inte ladda laget</p>
        <Button variant="ghost" onClick={() => { setError(false); setLoading(true) }}>
          Försök igen
        </Button>
      </main>
    )
  }

  if (!team) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
        <p className="text-sm text-dark-muted">Lag hittades inte</p>
      </main>
    )
  }

  const completed = matches.filter(m => m.status === 'completed' && m.home_score !== null)
  const upcoming = matches.filter(m => m.status === 'upcoming' || m.status === 'live')
  const isHome = (m: Match) => m.home_team_id === id

  // Stats
  const wins = completed.filter(m => isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!).length
  const losses = completed.filter(m => isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!).length
  const draws = completed.filter(m => m.home_score === m.away_score).length
  const points = wins * 2 + draws
  const ptsFor = completed.reduce((s, m) => s + (isHome(m) ? m.home_score! : m.away_score!), 0)
  const ptsAgainst = completed.reduce((s, m) => s + (isHome(m) ? m.away_score! : m.home_score!), 0)
  const diff = ptsFor - ptsAgainst

  // Form last 5
  const last5 = [...completed].slice(0, 5).map(m => {
    const hw = isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!
    const lw = isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!
    return hw ? 'V' : lw ? 'F' : 'O'
  })
  const division = completed[0]?.division || upcoming[0]?.division || null
  const divColor = teamDivisionColor(division)

  const homeRecord = completed
    .filter(m => m.home_team_id === id)
    .map(m =>
      m.home_score! > m.away_score! ? 'V' : m.home_score! < m.away_score! ? 'F' : 'O',
    )
    .reduce(
      (acc, r) => {
        acc[r] = (acc[r] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  const awayRecord = completed
    .filter(m => m.away_team_id === id)
    .map(m =>
      m.away_score! > m.home_score! ? 'V' : m.away_score! < m.home_score! ? 'F' : 'O',
    )
    .reduce(
      (acc, r) => {
        acc[r] = (acc[r] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

  // H2H breakdown by opponent
  const h2hMap: Record<string, { team: any; oppId: string; matches: Match[]; w: number; d: number; l: number }> = {}
  completed.forEach(m => {
    const oppId = isHome(m) ? m.away_team_id : m.home_team_id
    const opp   = isHome(m) ? m.away : m.home
    if (!h2hMap[oppId]) h2hMap[oppId] = { team: opp, oppId, matches: [], w: 0, d: 0, l: 0 }
    const won  = isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!
    const lost = isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!
    h2hMap[oppId].matches.push(m)
    if (won) h2hMap[oppId].w++
    else if (lost) h2hMap[oppId].l++
    else h2hMap[oppId].d++
  })
  const h2hList = Object.values(h2hMap).sort((a, b) => b.matches.length - a.matches.length)

  const displayMatches = tab === 'results' ? completed : upcoming

  return (
    <main className="min-h-screen bg-light-bg font-sans bk-text-primary dark:bg-dark-bg">
      <div className="mx-auto max-w-app pb-12">

        {id && (
          <TeamHero
            team={{ ...team, id }}
            teamId={id}
            division={division}
            divisionColor={divColor}
            clubLogoUrl={clubLogoUrl}
            logoFailed={logoFailed}
            onLogoError={() => setLogoFailed(true)}
            copied={copied}
            onCopyLink={copyLink}
            isAdmin={isAdmin}
            editingTeam={editingTeam}
            onToggleEdit={() => setEditingTeam(!editingTeam)}
            teamEdit={teamEdit}
            onTeamEditChange={(key, value) => setTeamEdit((prev: Record<string, string>) => ({ ...prev, [key]: value }))}
            onSaveTeam={saveTeam}
            savingTeam={savingTeam}
            onCancelEdit={() => { setEditingTeam(false); setTeamEdit(team) }}
            clubTeams={clubTeams}
          />
        )}

        {id && (
          <TeamStatsBar
            completedCount={completed.length}
            wins={wins}
            draws={draws}
            losses={losses}
            points={points}
            last5={last5}
            ptsFor={ptsFor}
            ptsAgainst={ptsAgainst}
            diff={diff}
            homeRecord={homeRecord}
            awayRecord={awayRecord}
            statsOpen={statsOpen}
            onToggleStats={() => setStatsOpen(!statsOpen)}
            teamId={id}
          />
        )}

        {/* Next match preview */}
        {upcoming.length > 0 && id && (
          <NextMatchPreview teamId={id} nextMatch={upcoming[0] as any} />
        )}

        {/* Table position widget */}
        {division && completed.length > 0 && (
          <TeamTableWidget teamId={id!} division={division} />
        )}

        {/* Top performers */}
        {id && (
          <TopPerformers teamId={id} />
        )}

        <TeamTabBar
          tab={tab}
          onTabChange={setTab}
          tabs={[
            { key: 'results', label: 'Resultat', count: completed.length },
            { key: 'upcoming', label: 'Kommande', count: upcoming.length },
            { key: 'h2h', label: 'H2H', count: h2hList.length },
            { key: 'squad', label: 'Trupp', count: players.length },
            { key: 'community', label: 'Community', count: posts.length },
          ]}
        />

        {tab !== 'squad' && tab !== 'community' && tab !== 'h2h' && (
          <div>
            {displayMatches.length === 0 && (
              <p className="px-6 py-12 text-center text-[13px] text-dark-muted">Inga matcher att visa</p>
            )}
            {displayMatches.map(m => (
              <TeamMatchRow
                key={m.id}
                match={m}
                isHome={isHome(m)}
                dark={theme === 'dark'}
              />
            ))}
          </div>
        )}

        {tab === 'h2h' && id && (
          <TeamH2HTab
            teamId={id}
            opponents={h2hList}
            expandedOppId={expandedOpp}
            onToggleExpand={setExpandedOpp}
            dark={theme === 'dark'}
          />
        )}

        {tab === 'squad' && (
          <TeamSquadTab
            players={players}
            playerStats={playerStats}
            dark={theme === 'dark'}
          />
        )}

        {tab === 'community' && (
          <TeamCommunityTab
            posts={posts}
            isAdmin={isAdmin}
            newPost={newPost}
            onNewPostChange={setNewPost}
            postingType={postingType}
            onPostingTypeChange={setPostingType}
            submittingPost={submittingPost}
            onSubmit={submitPost}
            onDelete={deletePost}
          />
        )}

      </div>
    </main>
  )
}
