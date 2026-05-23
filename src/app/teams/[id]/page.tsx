'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { MapPin, Globe, Mail, User, Link } from 'lucide-react'
import { motion } from 'framer-motion'
import FollowButton from '@/components/FollowButton'
import TeamTableWidget from '@/components/TeamTableWidget'
import NextMatchPreview from '@/components/NextMatchPreview'
import SeasonTimeline from '@/components/SeasonTimeline'
import TopPerformers from '@/components/TopPerformers'

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

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

function divisionColor(d: string | null) {
  if (!d) return '#6b7a99'
  if (d.includes('Elitserien') && d.includes('Herrar')) return '#4a90d9'
  if (d.includes('Elitserien') && d.includes('Damer')) return '#d94a90'
  if (d.includes('SM')) return '#f5c200'
  if (d.includes('Allsvenskan')) return '#5ba85a'
  return '#8a7a5a'
}

export default function TeamPage({ params }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
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
  const [tab, setTab] = useState<'results' | 'upcoming' | 'squad' | 'community' | 'h2h'>('results')
  const [expandedOpp, setExpandedOpp] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingTeam, setEditingTeam] = useState(false)
  const [savingTeam, setSavingTeam] = useState(false)
  const [teamEdit, setTeamEdit] = useState<any>({})
  const [playerStats, setPlayerStats] = useState<Record<string, { avg: number; matches: number }>>({})
  const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

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
          const statsMap: Record<string, { avg: number; matches: number }> = {}
          Object.entries(grouped).forEach(([pid, games]) => {
            statsMap[pid] = {
              avg: games.length > 0 ? Math.round(games.reduce((a, b) => a + b, 0) / games.length) : 0,
              matches: mCount[pid] || 0,
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
    })
  }, [id])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )

  if (!team) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: C.textMuted }}>Lag hittades inte</div>
    </main>
  )

  const hue = team.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const tc = 'hsl(' + hue + ',50%,45%)'
  const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
  const ini = shortName(team.name).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()

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
  const formColor = (f: string) => f === 'V' ? C.green : f === 'F' ? '#e05555' : C.textMuted

  // Division from most recent match
  const division = completed[0]?.division || upcoming[0]?.division || null
  const divColor = divisionColor(division)

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
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 48px' }}>

        {/* Hero banner */}
        <div style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #0d1a2e 0%, #1a2840 100%)' : 'linear-gradient(135deg, #e8f0f8 0%, #d0e0f0 100%)', padding: '24px 20px 20px', marginBottom: 0 }}>
          <a href="/teams" style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
            ← Alla lag
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 68, height: 68, borderRadius: 16, background: tclo, border: '2.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: tc, flexShrink: 0 }}>
              {ini}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }}>{shortName(team.name)}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {team.city && <span style={{ fontSize: 12, color: C.textMuted }}>{team.city}</span>}
                {division && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: divColor, background: divColor + '22', borderRadius: 6, padding: '2px 8px' }}>
                    {division}
                  </span>
                )}
              </div>
              {team.home_hall && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, background: theme === 'dark' ? 'rgba(245,194,0,0.10)' : 'rgba(245,194,0,0.12)', border: '1px solid rgba(245,194,0,0.30)', borderRadius: 8, padding: '4px 10px' }}>
                  <MapPin size={11} color="#f5c200" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f5c200', letterSpacing: 0.3 }}>{team.home_hall}</span>
                </div>
              )}
              {team.slug && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>bowlkollen.vercel.app/{team.slug}</span>
                  <button onClick={copyLink} style={{ background: copied ? C.green + '22' : C.card, border: '1px solid ' + (copied ? C.green : C.border), borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: copied ? C.green : C.textMuted, cursor: 'pointer' }}>
                    {copied ? '✓ Kopierad' : 'Kopiera'}
                  </button>
                  {isAdmin && (
                    <button onClick={() => setEditingTeam(!editingTeam)}
                      style={{ background: editingTeam ? C.accent + '22' : C.card, border: '1px solid ' + (editingTeam ? C.accent : C.border), borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: editingTeam ? C.accent : C.textMuted, cursor: 'pointer' }}>
                      {editingTeam ? '✕ Stang' : '✏️ Redigera'}
                    </button>
                  )}
                </div>
              )}

              {/* Follow + Intern link */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' as const }}>
                <a href={'/team/' + id + '/intern'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.accent, color: '#1a1400', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  Till lagets sida →
                </a>
                <a href={id ? `/compare/teams/${id}` : '#'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', color: C.accent, border: '1px solid ' + C.accent + '55', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  Jämför →
                </a>
              </div>

              <FollowButton teamId={id || ''} type='team' isDark={theme === 'dark'} />

              {/* Club team switcher */}
              {clubTeams.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 10, color: C.textMuted, alignSelf: 'center', marginRight: 2 }}>Fler lag:</div>
                  {clubTeams.map(ct => {
                    const label = ct.team_path === 'herrar' ? 'Herrar' : ct.team_path === 'damer' ? 'Damer' : ct.team_path === 'allsvenskan' ? 'Allsvenskan' : ct.name
                    const url = ct.club_slug && ct.team_path ? '/' + ct.club_slug + '/' + ct.team_path : '/teams/' + ct.id
                    return (
                      <a key={ct.id} href={url} style={{ fontSize: 11, fontWeight: 700, color: C.text, background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: '4px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {label} ›
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team description (public) */}
        {team.description && !editingTeam && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + C.border, fontSize: 13, color: C.textMuted, lineHeight: 1.6, fontStyle: 'italic' }}>
            "{team.description}"
          </div>
        )}

        {/* Team contact info (public) */}
        {(team.home_hall || team.website || team.instagram || team.contact_email) && !editingTeam && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid ' + C.border, display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {team.home_hall && <span style={{ fontSize: 11, color: C.textMuted, background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '3px 10px', display:'inline-flex', alignItems:'center', gap:4 }}><MapPin size={10} />{team.home_hall}</span>}
            {team.website && <a href={team.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.accent, background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '3px 10px', textDecoration: 'none', display:'inline-flex', alignItems:'center', gap:4 }}><Globe size={10} />Webbplats</a>}
            {team.instagram && <a href={'https://instagram.com/' + team.instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.textMuted, background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '3px 10px', textDecoration: 'none', display:'inline-flex', alignItems:'center', gap:4 }}><Link size={10} />@{team.instagram}</a>}
            {team.contact_email && <a href={'mailto:' + team.contact_email} style={{ fontSize: 11, color: C.textMuted, background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '3px 10px', textDecoration: 'none', display:'inline-flex', alignItems:'center', gap:4 }}><Mail size={10} />{team.contact_email}</a>}
          </div>
        )}

        {/* Admin edit panel */}
        {editingTeam && isAdmin && (
          <div style={{ background: theme === 'dark' ? '#0d1a2e' : '#f0f4f8', borderBottom: '1px solid ' + C.border, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, letterSpacing: 1, marginBottom: 14 }}>REDIGERA LAGSIDA</div>
            {[
              { label: 'Beskrivning', key: 'description', placeholder: 'Berätta om laget...', type: 'textarea' },
              { label: 'Stad', key: 'city', placeholder: 'T.ex. Stockholm' },
              { label: 'Hemmaplan', key: 'home_hall', placeholder: 'T.ex. Nässjö Bowling' },
              { label: 'Kontakt email', key: 'contact_email', placeholder: 'kapten@klubb.se' },
              { label: 'Telefon', key: 'contact_phone', placeholder: '+46 70 123 45 67' },
              { label: 'Webbplats', key: 'website', placeholder: 'https://...' },
              { label: 'Instagram', key: 'instagram', placeholder: 'användarnamn' },
              { label: 'Facebook', key: 'facebook', placeholder: 'https://facebook.com/...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>{f.label.toUpperCase()}</div>
                {f.type === 'textarea' ? (
                  <textarea value={teamEdit[f.key] || ''} onChange={e => setTeamEdit((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} rows={3}
                    style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'system-ui', boxSizing: 'border-box' as const }} />
                ) : (
                  <input value={teamEdit[f.key] || ''} onChange={e => setTeamEdit((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={saveTeam} disabled={savingTeam}
                style={{ flex: 1, background: C.accent, color: '#1a1400', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: savingTeam ? 0.7 : 1 }}>
                {savingTeam ? 'Sparar...' : 'Spara'}
              </button>
              <button onClick={() => { setEditingTeam(false); setTeamEdit(team) }}
                style={{ flex: 1, background: 'transparent', color: C.textMuted, border: '1px solid ' + C.border, borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Avbryt
              </button>
            </div>
          </div>
        )}

        {/* Stats bar */}
        {completed.length > 0 && (
          <div onClick={() => setStatsOpen(!statsOpen)} style={{ background: C.card, borderBottom: '1px solid ' + C.border, padding: '14px 20px 10px', display: 'flex', flexDirection: 'column', gap: 0, cursor: 'pointer' }}>
            <div style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Matcher', value: completed.length },
              { label: 'Vunna', value: wins, color: C.green },
              { label: 'Oavgjorda', value: draws, color: C.textMuted },
              { label: 'Forlorade', value: losses, color: '#e05555' },
              { label: 'Poang', value: points, color: C.accent },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center', borderRight: i < 4 ? '1px solid ' + C.border : 'none' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color || C.text, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {last5.map((f, i) => (
                  <motion.span key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...SPRING, delay: i * 0.05 }}
                    style={{ fontSize: 10, fontWeight: 800, color: formColor(f), background: formColor(f) + '20', border: '1px solid ' + formColor(f) + '55', borderRadius: 20, padding: '3px 9px', letterSpacing: 0.5 }}>
                    {f}
                  </motion.span>
                ))}
              </div>
              <div style={{ fontSize: 10, color: C.textMuted }}>{statsOpen ? '▲ stang' : '▼ mer statistik'}</div>
            </div>
          </div>
        )}

        {/* Stats curtain */}
        {statsOpen && completed.length > 0 && (
          <div style={{ background: theme === 'dark' ? '#1a2535' : '#f0f4f8', borderBottom: '1px solid ' + C.border, padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Hemma V/O/F', value: completed.filter(m => m.home_team_id === id).map(m => m.home_score! > m.away_score! ? 'V' : m.home_score! < m.away_score! ? 'F' : 'O').reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc }, {} as Record<string, number>), isRecord: true },
                { label: 'Borta V/O/F', value: completed.filter(m => m.away_team_id === id).map(m => m.away_score! > m.home_score! ? 'V' : m.away_score! < m.home_score! ? 'F' : 'O').reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc }, {} as Record<string, number>), isRecord: true },
              ].map((s, i) => (
                <div key={i} style={{ background: C.card, borderRadius: 10, padding: '10px 12px', border: '1px solid ' + C.border }}>
                  <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 6, fontWeight: 700, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.green }}>{(s.value as any).V || 0}V</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.textMuted }}>{(s.value as any).O || 0}O</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#e05555' }}>{(s.value as any).F || 0}F</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'MP For', value: ptsFor },
                { label: 'MP Mot', value: ptsAgainst },
                { label: 'Differens', value: (diff >= 0 ? '+' : '') + diff, color: diff >= 0 ? C.green : '#e05555' },
              ].map(s => (
                <div key={s.label} style={{ background: C.card, borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid ' + C.border }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: (s as any).color || C.text }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
            {/* Season timeline inside curtain */}
            {id && (
              <div style={{ marginTop: 12 }}>
                <SeasonTimeline teamId={id} />
              </div>
            )}
          </div>
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

        {/* Tabs */}
        <div id="team-tabs" style={{ display: 'flex', borderBottom: '1px solid ' + C.border, background: C.bg }}>
          {[
            { key: 'results', label: 'Resultat', count: completed.length },
            { key: 'upcoming', label: 'Kommande', count: upcoming.length },
            { key: 'h2h', label: 'H2H', count: h2hList.length },
            { key: 'squad', label: 'Trupp', count: players.length },
            { key: 'community', label: 'Community', count: posts.length },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              style={{ flex: 1, padding: '12px 8px', border: 'none', borderBottom: '2px solid ' + (tab === t.key ? '#f5c200' : 'transparent'), background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? '#f5c200' : C.textMuted, WebkitTapHighlightColor: 'transparent' }}
            >
              {t.label}
              {t.count > 0 && <span style={{ fontSize: 10, marginLeft: 5, opacity: 0.7 }}>({t.count})</span>}
            </button>
          ))}
        </div>

        {/* Results / Upcoming */}
        {tab !== 'squad' && tab !== 'community' && tab !== 'h2h' && (
          <div>
            {displayMatches.length === 0 && (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                Inga matcher att visa
              </div>
            )}
            {displayMatches.map(m => {
              const home = isHome(m)
              const teamScore = home ? m.home_score : m.away_score
              const oppScore = home ? m.away_score : m.home_score
              const opp = home ? m.away : m.home
              const won = teamScore !== null && oppScore !== null && teamScore > oppScore
              const lost = teamScore !== null && oppScore !== null && teamScore < oppScore
              const drew = teamScore !== null && oppScore !== null && teamScore === oppScore
              const oppHue = (opp?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const oppTc = 'hsl(' + oppHue + ',50%,45%)'
              const oppTclo = theme === 'dark' ? 'hsl(' + oppHue + ',40%,15%)' : 'hsl(' + oppHue + ',40%,92%)'
              const resultLabel = won ? 'V' : lost ? 'F' : drew ? 'O' : null
              const resultColor = won ? C.green : lost ? '#e05555' : C.textMuted
              const isLive = m.status === 'live'
              const divC = divisionColor(m.division)

              return (
                <a key={m.id} href={'/matches/' + m.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid ' + C.border, textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Result badge */}
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: resultLabel ? resultColor + '22' : C.card, border: '1.5px solid ' + (resultLabel ? resultColor : C.border), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: resultLabel ? resultColor : C.textMuted, flexShrink: 0 }}>
                    {isLive ? '●' : resultLabel || '—'}
                  </div>

                  {/* Opponent */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: oppTclo, border: '1.5px solid ' + oppTc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: oppTc, flexShrink: 0 }}>
                      {shortName(opp?.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shortName(opp?.name || '')}
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 1 }}>
                        <div style={{ fontSize: 10, color: C.textMuted }}>{home ? 'Hemma' : 'Borta'} · {m.date?.slice(0, 10)}</div>
                        {m.division && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: divC, background: divC + '18', borderRadius: 4, padding: '1px 5px' }}>
                            {m.division.replace(' Herrar', ' H').replace(' Damer', ' D')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {teamScore !== null ? (
                      <>
                        <div style={{ fontSize: 16, fontWeight: 800, color: won ? C.accent : C.text }}>
                          {teamScore} - {oppScore}
                        </div>
                        <div style={{ fontSize: 9, color: C.textMuted }}>MP</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: isLive ? '#e05555' : C.textMuted, fontWeight: isLive ? 700 : 400 }}>
                        {isLive ? '● LIVE' : m.date ? new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {/* H2H tab */}
        {tab === 'h2h' && (
          <div>
            {/* H2H tab header — always visible */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid ' + C.border }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>
                {h2hList.length > 0 ? `${h2hList.length} MOTSTÅNDARE` : 'TIDIGARE MÖTEN'}
              </span>
              <a href="/teams"
                style={{ fontSize: 11, fontWeight: 700, color: C.accent, textDecoration: 'none', background: C.accent + '18', border: '1px solid ' + C.accent + '44', borderRadius: 8, padding: '5px 12px' }}>
                Hitta ett lag →
              </a>
            </div>

            {h2hList.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                Inga spelade matcher registrerade ännu
              </div>
            ) : h2hList.map(opp => {
              const isExp = expandedOpp === opp.oppId
              const oppHue = (opp.team?.name || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
              const oppTc   = `hsl(${oppHue},50%,45%)`
              const oppTclo = theme === 'dark' ? `hsl(${oppHue},40%,15%)` : `hsl(${oppHue},40%,92%)`
              const oppIni  = shortName(opp.team?.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()
              const total   = opp.matches.length
              const winPct  = total > 0 ? Math.round((opp.w / total) * 100) : 0

              return (
                <div key={opp.oppId} style={{ borderBottom: '1px solid ' + C.border }}>
                  {/* Opponent summary row */}
                  <div
                    onClick={() => setExpandedOpp(isExp ? null : opp.oppId)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                  >
                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: oppTclo, border: '1.5px solid ' + oppTc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: oppTc, flexShrink: 0 }}>
                      {oppIni}
                    </div>

                    {/* Name + record */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shortName(opp.team?.name || '')}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.green }}>{opp.w}V</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.textMuted }}>{opp.d}O</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#e05555' }}>{opp.l}F</span>
                        <span style={{ fontSize: 10, color: C.textMuted }}>· {total} matcher · {winPct}% vunna</span>
                      </div>
                    </div>

                    {/* Jämför link */}
                    <a
                      href={`/compare/teams/${id}/${opp.oppId}`}
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accent + '18', border: '1px solid ' + C.accent + '44', borderRadius: 8, padding: '5px 10px', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' } as React.CSSProperties}
                    >
                      Jämför →
                    </a>

                    {/* Chevron */}
                    <motion.div animate={{ rotate: isExp ? 90 : 0 }} transition={SPRING}
                      style={{ color: C.textMuted, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                      ›
                    </motion.div>
                  </div>

                  {/* Expandable match list */}
                  <motion.div
                    initial={false}
                    animate={{ height: isExp ? 'auto' : 0, opacity: isExp ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                      {[...opp.matches].sort((a, b) => b.date.localeCompare(a.date)).map((m, mi) => {
                        const home    = isHome(m)
                        const myScore = home ? m.home_score : m.away_score
                        const thScore = home ? m.away_score : m.home_score
                        const won     = myScore !== null && thScore !== null && myScore! > thScore!
                        const lost    = myScore !== null && thScore !== null && myScore! < thScore!
                        const drew    = myScore !== null && thScore !== null && myScore === thScore
                        const label   = won ? 'V' : lost ? 'F' : drew ? 'O' : null
                        const lColor  = won ? C.green : lost ? '#e05555' : C.textMuted
                        const dateStr = m.date ? new Date(m.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
                        return (
                          <a key={m.id} href={'/matches/' + m.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px 10px 28px', borderTop: mi === 0 ? '1px solid ' + C.border : '1px solid ' + (theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'), textDecoration: 'none' }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: label ? lColor + '22' : C.card, border: '1px solid ' + (label ? lColor : C.border), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: label ? lColor : C.textMuted, flexShrink: 0 }}>
                              {label || '—'}
                            </div>
                            <div style={{ flex: 1, fontSize: 12, color: C.textMuted }}>{dateStr} · {home ? 'Hemma' : 'Borta'}</div>
                            {myScore !== null && (
                              <div style={{ fontSize: 13, fontWeight: 800, color: won ? C.accent : C.text }}>
                                {myScore} – {thScore}
                              </div>
                            )}
                          </a>
                        )
                      })}
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        )}

        {/* Squad tab */}
        {tab === 'squad' && (
          <div>
            {players.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <User size={28} color='#6b7a99' style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Inga spelare registrerade</div>
                <div style={{ fontSize: 13, color: C.textMuted }}>Spelare läggs till när live scoring används</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '16px' }}>
                {players.map((p, idx) => {
                  const stats = playerStats[p.id]
                  const phue = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                  const ptc = 'hsl(' + phue + ',50%,45%)'
                  const ptclo = theme === 'dark' ? 'hsl(' + phue + ',40%,15%)' : 'hsl(' + phue + ',40%,92%)'
                  const ini = p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <motion.a key={p.id} href={'/players/' + p.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...SPRING, delay: idx * 0.04 }}
                      style={{
                        background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#ffffff',
                        border: '1px solid ' + C.border,
                        borderRadius: 18,
                        padding: '20px 12px 16px',
                        textDecoration: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        textAlign: 'center',
                      }}>
                      <div style={{ width: 54, height: 54, borderRadius: '50%', background: ptclo, border: '2px solid ' + ptc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: ptc, marginBottom: 4 }}>
                        {ini}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{p.name}</div>
                      {stats && stats.avg > 0 ? (
                        <div style={{ marginTop: 4 }}>
                          <div style={{ fontSize: 26, fontWeight: 900, color: C.accent, lineHeight: 1 }}>{stats.avg}</div>
                          <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.2, marginTop: 3 }}>SNITT</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>—</div>
                      )}
                    </motion.a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Community tab */}
        {tab === 'community' && (
          <div>
            {/* Post composer - only for admins */}
            {isAdmin && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.border }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {[
                    { key: 'news', label: 'Nyhet' },
                    { key: 'lineup', label: 'Laguttagning' },
                  ].map(t => (
                    <button key={t.key} onClick={() => setPostingType(t.key as any)}
                      style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid ' + (postingType === t.key ? C.accent : C.border), background: postingType === t.key ? C.accent + '18' : 'transparent', color: postingType === t.key ? C.accent : C.textMuted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder={postingType === 'news' ? 'Dela en nyhet med laget...' : 'Skriv laguttagningen...'}
                  rows={3}
                  style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'system-ui', boxSizing: 'border-box' as const, marginBottom: 8 }}
                ></textarea>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={submitPost} disabled={submittingPost || !newPost.trim()}
                    style={{ background: newPost.trim() ? C.accent : C.border, color: newPost.trim() ? '#1a1400' : C.textMuted, border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: newPost.trim() ? 'pointer' : 'default' }}>
                    {submittingPost ? 'Publicerar...' : 'Publicera'}
                  </button>
                </div>
              </div>
            )}

            {/* Posts feed */}
            {posts.length === 0 && (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>--</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Inga inlagg an</div>
                <div style={{ fontSize: 13, color: C.textMuted }}>
                  {isAdmin ? 'Dela nyheter och laguttagningar med laget' : 'Kapten har inte publicerat nagonting an'}
                </div>
              </div>
            )}

            {posts.map(post => {
              const postDate = new Date(post.created_at)
              const dateStr = postDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })
              const timeStr = postDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
              const isLineup = post.post_type === 'lineup'

              return (
                <div key={post.id} style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.border }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: isLineup ? C.accent : C.green, background: (isLineup ? C.accent : C.green) + '18', borderRadius: 6, padding: '2px 8px' }}>
                      {isLineup ? 'LAGUTTAGNING' : 'NYHET'}
                    </span>
                    <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 'auto' }}>{dateStr} {timeStr}</span>
                    {isAdmin && (
                      <button onClick={() => deletePost(post.id)}
                        style={{ background: 'transparent', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', padding: '0 4px' }}>
                        ✕
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>
                    {post.content}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}
