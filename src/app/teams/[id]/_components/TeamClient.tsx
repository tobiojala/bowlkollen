'use client'

import React, { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useColors } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase'
import { useTeam, useTeamMatches, useSession, keys } from '@/lib/queries'
import type { Team, Match, Player, PlayerMomentum } from '@/lib/types'
import TeamHero         from './TeamHero'
import { TeamActions }  from './TeamActions'
import TeamSectionNav   from './TeamSectionNav'
import TeamOverview     from './TeamOverview'
import TeamSquad        from './TeamSquad'
import TeamMatches      from './TeamMatches'
import TeamFeed         from './TeamFeed'
import TeamCaptainDash  from './TeamCaptainDash'
import TeamSponsors     from './TeamSponsors'
import TeamSponsorAdmin from './TeamSponsorAdmin'

type ClubTeam = { id: string; name: string; club_slug: string | null; team_path: string | null }

export default function TeamClient({ id }: { id: string }) {
  const { C, isDark } = useColors()
  const qc = useQueryClient()

  const { data: session } = useSession()
  const { data: teamData, isLoading: teamLoading } = useTeam(id)
  const { data: matchData = [], isLoading: matchesLoading } = useTeamMatches(id)
  const team    = teamData as Team | undefined
  const matches = matchData as unknown as Match[]

  const [players,        setPlayers]        = useState<Player[]>([])
  const [playerStats,    setPlayerStats]    = useState<Record<string, { avg: number; matches: number; high: number }>>({})
  const [playerMomentum, setPlayerMomentum] = useState<Record<string, PlayerMomentum>>({})
  const [isAdmin,     setIsAdmin]     = useState(false)
  const [clubLogoUrl, setClubLogoUrl] = useState<string | null>(null)
  const [clubTeams,   setClubTeams]   = useState<ClubTeam[]>([])
  const [editingTeam, setEditingTeam] = useState(false)
  const [savingTeam,        setSavingTeam]        = useState(false)
  const [teamEdit,          setTeamEdit]          = useState<Partial<Team>>({})
  const [error,             setError]             = useState(false)

  const loading = teamLoading || matchesLoading

  useEffect(() => { if (team) setTeamEdit(team) }, [team?.id])

  useEffect(() => {
    if (!id || teamLoading || !team) return
    const supabase = createClient()

    if (team.club) {
      supabase.from('bits_clubs').select('logo_url').eq('name', team.club).limit(1)
        .then(({ data }) => { if (data?.[0]?.logo_url) setClubLogoUrl(data[0].logo_url) })
    }
    if (team.club_slug) {
      supabase.from('teams').select('id,name,club_slug,team_path')
        .eq('club_slug', team.club_slug).neq('id', id).order('name')
        .then(({ data }) => { if (data) setClubTeams(data as ClubTeam[]) })
    }

    Promise.all([
      supabase.from('players').select('id,name').eq('team_id', id).order('name'),
      session
        ? supabase.from('club_claims').select('id').eq('user_id', session.user.id).eq('team_id', id).single()
        : Promise.resolve({ data: null }),
    ]).then(async ([{ data: p }, { data: claim }]) => {
      setIsAdmin(!!claim)
      if (p) {
        setPlayers(p as Player[])
        const pIds = (p as Player[]).map(pl => pl.id)
        if (pIds.length > 0) {
          const { data: pStats } = await supabase
            .from('match_results').select('player_id,games,match_id').in('player_id', pIds)

          type RawStat = { player_id: string; games: number[]; match_id: string }
          const rows = (pStats ?? []) as RawStat[]

          const grouped: Record<string, number[]> = {}
          const mCount:  Record<string, number>   = {}
          rows.forEach(r => {
            if (!grouped[r.player_id]) { grouped[r.player_id] = []; mCount[r.player_id] = 0 }
            grouped[r.player_id].push(...(r.games || []).filter(g => g > 0))
            mCount[r.player_id] = (mCount[r.player_id] || 0) + 1
          })

          // Last 3 completed match IDs for this team — used to compute recent form
          const completedMatches = (matchData as unknown as Match[])
            .filter(m => m.status === 'completed' && m.home_score !== null)
          const last3Ids = new Set(completedMatches.slice(0, 3).map(m => m.id))

          const statsMap:    Record<string, { avg: number; matches: number; high: number }> = {}
          const momentumMap: Record<string, PlayerMomentum> = {}

          Object.entries(grouped).forEach(([pid, allGames]) => {
            const avg  = allGames.length > 0 ? Math.round(allGames.reduce((a, b) => a + b, 0) / allGames.length) : 0
            const high = allGames.length > 0 ? Math.max(...allGames) : 0
            statsMap[pid] = { avg, matches: mCount[pid] || 0, high }

            // Momentum: only meaningful when player has played more than 3 matches
            const recentGames = rows
              .filter(r => r.player_id === pid && last3Ids.has(r.match_id))
              .flatMap(r => r.games.filter(g => g > 0))
            const recentAvg = recentGames.length > 0
              ? Math.round(recentGames.reduce((a, b) => a + b, 0) / recentGames.length)
              : 0
            const delta = avg > 0 && recentAvg > 0 && (mCount[pid] || 0) > 3 ? recentAvg - avg : 0
            momentumMap[pid] = {
              seasonAvg: avg,
              recentAvg,
              delta,
              level: delta >= 5 ? 'rising' : delta <= -5 ? 'slumping' : 'stable',
            }
          })

          setPlayerStats(statsMap)
          setPlayerMomentum(momentumMap)
        }
      }
    }).catch(() => setError(true))
  }, [id, team?.id, session?.user?.id])

  const saveTeam = async () => {
    setSavingTeam(true)
    const { error: saveError } = await createClient().from('teams').update({
      description: teamEdit.description, contact_email: teamEdit.contact_email,
      contact_phone: teamEdit.contact_phone, home_hall: teamEdit.home_hall,
      website: teamEdit.website, instagram: teamEdit.instagram,
      facebook: teamEdit.facebook, city: teamEdit.city,
    }).eq('id', id)
    if (!saveError) {
      qc.setQueryData(keys.team(id), (old: Team | undefined) => old ? { ...old, ...teamEdit } : old)
      setEditingTeam(false)
    }
    setSavingTeam(false)
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    const sk = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
    const S  = ({ w = '100%', h = 12, r = 6 }: { w?: string | number; h?: number; r?: number }) => (
      <div style={{ width: w, height: h, borderRadius: r, background: sk }} />
    )
    return (
      <main style={{ minHeight: '100vh', background: C.bg }}>
        <style>{`@keyframes sk-pulse{0%,100%{opacity:.4}50%{opacity:.9}}.sk-team>*{animation:sk-pulse 1.6s ease-in-out infinite}`}</style>
        <div className="sk-team" style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ padding: '24px 20px 20px', background: sk.replace('0.07', '0.03') }}>
            <S w={60} h={10} r={4} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
              <div style={{ width: 88, height: 88, borderRadius: 22, background: sk, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <S w="60%" h={22} r={6} /><S w="40%" h={12} r={4} />
              </div>
            </div>
          </div>
          <div style={{ padding: '0 20px', marginTop: 24 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid ' + sk }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: sk, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <S w={`${50 + (i % 3) * 12}%`} h={13} r={4} /><S w="35%" h={9} r={3} />
                </div>
                <S w={52} h={20} r={6} />
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Kunde inte ladda laget</div>
      <button onClick={() => setError(false)} style={{ fontSize: 12, fontWeight: 700, color: C.accent, background: 'transparent', border: '1px solid ' + C.accent + '55', borderRadius: 8, padding: '7px 16px', cursor: 'pointer' }}>
        Försök igen
      </button>
    </main>
  )

  if (!team) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.muted }}>Lag hittades inte</div>
    </main>
  )

  const today     = new Date().toISOString().slice(0, 10)
  const completed = matches.filter(m => m.status === 'completed' && m.home_score !== null)
  const upcoming  = matches.filter(m => m.status === 'upcoming'  || m.status === 'live')
  const todayMatch = upcoming.find(m => m.date?.slice(0, 10) === today) ?? null

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        <TeamHero
          team={team} id={id} isAdmin={isAdmin}
          completed={completed} upcoming={upcoming}
          clubLogoUrl={clubLogoUrl} clubTeams={clubTeams}
          hasSession={!!session}
          todayMatch={todayMatch}
          onEditClick={() => setEditingTeam(v => !v)}
        />

        {/* Calendar subscribe + CSV export (Follow lives in the hero) */}
        <div style={{ padding: '0 20px 16px' }}>
          <TeamActions teamId={id} teamName={team.name} matches={matches} />
        </div>

        {/* Admin edit panel */}
        {editingTeam && isAdmin && (
          <div style={{ background: isDark ? '#0d1a2e' : '#f0f4f8', borderBottom: '1px solid ' + C.border, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, letterSpacing: 1, marginBottom: 14 }}>REDIGERA LAGSIDA</div>
            {([
              { label: 'Beskrivning', key: 'description',    placeholder: 'Berätta om laget...', type: 'textarea' },
              { label: 'Stad',        key: 'city',            placeholder: 'T.ex. Stockholm' },
              { label: 'Hemmaplan',   key: 'home_hall',       placeholder: 'T.ex. Nässjö Bowling' },
              { label: 'Email',       key: 'contact_email',   placeholder: 'kapten@klubb.se' },
              { label: 'Telefon',     key: 'contact_phone',   placeholder: '+46 70 123 45 67' },
              { label: 'Webbplats',   key: 'website',         placeholder: 'https://...' },
              { label: 'Instagram',   key: 'instagram',       placeholder: 'användarnamn' },
              { label: 'Facebook',    key: 'facebook',        placeholder: 'https://facebook.com/...' },
            ] as { label: string; key: keyof Team; placeholder: string; type?: string }[]).map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.5, marginBottom: 4 }}>{f.label.toUpperCase()}</div>
                {f.type === 'textarea' ? (
                  <textarea value={(teamEdit[f.key] as string) || ''} onChange={e => setTeamEdit(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={3}
                    style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'system-ui', boxSizing: 'border-box' } as React.CSSProperties} />
                ) : (
                  <input value={(teamEdit[f.key] as string) || ''} onChange={e => setTeamEdit(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties} />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={saveTeam} disabled={savingTeam} style={{ flex: 1, background: C.accent, color: '#1a1400', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: savingTeam ? 0.7 : 1 }}>
                {savingTeam ? 'Sparar...' : 'Spara'}
              </button>
              <button onClick={() => { setEditingTeam(false); if (team) setTeamEdit(team) }} style={{ flex: 1, background: 'transparent', color: C.muted, border: '1px solid ' + C.border, borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Avbryt
              </button>
            </div>
          </div>
        )}

        {isAdmin && editingTeam && <TeamSponsorAdmin teamId={id} />}

        <TeamSectionNav teamName={team.name} showSponsors={true} />

        <TeamOverview   id={id} matches={matches} players={players} playerMomentum={playerMomentum} />
        <TeamSquad      teamId={id} teamName={team.name} players={players} playerStats={playerStats} playerMomentum={playerMomentum} />
        <TeamMatches    id={id} matches={matches} />
        {isAdmin && <TeamCaptainDash id={id} upcomingMatches={upcoming} />}
        <TeamFeed       id={id} isAdmin={isAdmin} />
        <TeamSponsors
          teamId={id}
          teamName={team.name}
          contactEmail={team.contact_email}
        />

      </div>
    </main>
  )
}
