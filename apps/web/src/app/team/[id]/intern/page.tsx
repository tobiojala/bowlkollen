'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { useColors } from '@/components/ThemeProvider'
import { Lock } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

type Props = { params: Promise<{ id: string }> }

type Member = {
  id: string
  user_id: string | null
  role: string | null
  status: string | null
  profiles?: { full_name: string; avatar_url: string; email: string }
}

type Post = {
  id: string
  content: string
  post_type: string | null
  created_at: string | null
}

type Poll = {
  id: string
  question: string
  deadline: string | null
  match_id: string | null
  responses?: { user_id: string; response: string; note: string | null }[]
}

function roleLabel(role: string) {
  if (role === 'captain') return 'Kapten'
  if (role === 'admin') return 'Admin'
  if (role === 'board') return 'Styrelse'
  return 'Spelare'
}

function roleColor(role: string, C: any) {
  if (role === 'captain') return '#f5c200'
  if (role === 'admin') return C.accent
  if (role === 'board') return C.green
  return C.textMuted
}

export default function InternPage({ params }: Props) {
  const { C, isDark } = useColors()
  const [id, setId] = useState<string | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [myMembership, setMyMembership] = useState<Member | null>(null)
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([])
  const [profiles, setProfiles] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'feed' | 'laguttagning' | 'tillganglighet' | 'medlemmar'>('feed')
  const [newPost, setNewPost] = useState('')
  const [postType, setPostType] = useState<'news' | 'lineup'>('news')
  const [submitting, setSubmitting] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      // Check membership
      const { data: membership } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', id)
        .eq('user_id', session.user.id)
        .single()

      if (!membership || membership.status !== 'active') {
        setAccessDenied(true)
        setMyMembership(membership || null)
        // Still load team name
        const { data: t } = await supabase.from('teams').select('id, name, club, city').eq('id', id).single()
        if (t) setTeam(t)
        setLoading(false)
        return
      }

      setMyMembership(membership)

      // Load everything
      const [
        { data: t },
        { data: m },
        { data: p },
        { data: po },
        { data: matches },
      ] = await Promise.all([
        supabase.from('teams').select('id, name, club, city, slug, club_slug').eq('id', id).single(),
        supabase.from('team_members').select('id, user_id, role, status').eq('team_id', id),
        supabase.from('team_posts').select('*').eq('team_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('availability_polls').select('*, responses:availability_responses(user_id, response, note)').eq('team_id', id).order('created_at', { ascending: false }).limit(5),
        supabase.from('matches').select('id, date, division, home_team_id, away_team_id, home:teams!home_team_id(name), away:teams!away_team_id(name)').or('home_team_id.eq.' + id + ',away_team_id.eq.' + id).eq('status', 'upcoming').order('date').limit(5),
      ])

      if (t) setTeam(t)
      if (m) {
        setMembers(m as Member[])
        // Load profiles for all members
        const userIds = (m as Member[]).map(x => x.user_id).filter((id): id is string => id !== null)
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .in('id', userIds)
          if (profileData) {
            const map: Record<string, any> = {}
            profileData.forEach((p: any) => { map[p.id] = p })
            setProfiles(map)
          }
        }
      }
      if (p) setPosts(p as Post[])
      if (po) setPolls(po as any[])
      if (matches) setUpcomingMatches(matches)
      setLoading(false)
    }

    load()
  }, [id])

  const isCapOrAdmin = myMembership?.role === 'captain' || myMembership?.role === 'admin'

  const submitPost = async () => {
    if (!newPost.trim() || !id || !user) return
    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('team_posts')
      .insert({ team_id: id, user_id: user.id, content: newPost, post_type: postType })
      .select('*').single()
    if (!error && data) {
      setPosts(prev => [data, ...prev])
      setNewPost('')
    }
    setSubmitting(false)
  }

  const requestAccess = async () => {
    if (!id || !user) return
    setRequesting(true)
    const supabase = createClient()
    await supabase.from('team_members').insert({
      team_id: id, user_id: user.id, role: 'player', status: 'pending'
    })
    setMyMembership({ id: '', user_id: user.id, role: 'player', status: 'pending' })
    setRequesting(false)
  }

  const respondToAvailability = async (pollId: string, response: string) => {
    if (!user) return
    const supabase = createClient()
    await supabase.from('availability_responses').upsert({
      poll_id: pollId, user_id: user.id, response
    })
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p
      const existing = (p.responses || []).filter(r => r.user_id !== user.id)
      return { ...p, responses: [...existing, { user_id: user.id, response, note: null }] }
    }))
  }

  function shortName(n: string) {
    return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )

  // Access denied view
  if (accessDenied) return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 360, padding: '0 24px', textAlign: 'center' }}>
        <Lock size={48} color='#f5c200' style={{marginBottom:16}} />
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{team?.club || team?.name}</div>
        <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 24, lineHeight: 1.6 }}>
          Det har ar lagets privata sida. Bara lagmedlemmar har tillgang.
        </div>
        {!myMembership && (
          <button onClick={requestAccess} disabled={requesting}
            style={{ width: '100%', background: C.accent, color: '#1a1400', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
            {requesting ? 'Skickar...' : 'Begar tillgang'}
          </button>
        )}
        {myMembership?.status === 'pending' && (
          <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '14px', fontSize: 13, color: C.textMuted }}>
            Din begaran väntar pa godkännande av kapten
          </div>
        )}
        <a href={'/teams/' + id} style={{ display: 'block', marginTop: 16, fontSize: 13, color: C.textMuted, textDecoration: 'none' }}>
          ← Tillbaka till lagprofilen
        </a>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 48px' }}>

        {/* Header */}
        <div style={{ background: isDark ? 'linear-gradient(135deg, #0d1a2e 0%, #1a2840 100%)' : 'linear-gradient(135deg, #e8f0f8 0%, #d0e0f0 100%)', padding: '20px 20px 16px' }}>
          <a href={'/teams/' + id} style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            ← Lagprofilen
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{shortName(team?.name || '')}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Intern lagsida · {members.length} aktiva medlemmar</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: roleColor(myMembership?.role || '', C), background: roleColor(myMembership?.role || '', C) + '22', borderRadius: 8, padding: '4px 10px' }}>
              {roleLabel(myMembership?.role || '')}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid ' + C.border, background: C.bg, overflowX: 'auto', scrollbarWidth: 'none' } as any}>
          {[
            { key: 'feed', label: 'Feed' },
            { key: 'laguttagning', label: 'Laguttagning' },
            { key: 'tillganglighet', label: 'Tillganglighet' },
            { key: 'medlemmar', label: 'Medlemmar' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              style={{ flexShrink: 0, padding: '12px 16px', border: 'none', borderBottom: '2px solid ' + (activeTab === t.key ? '#f5c200' : 'transparent'), background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500, color: activeTab === t.key ? '#f5c200' : C.textMuted, WebkitTapHighlightColor: 'transparent' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* FEED TAB */}
        {activeTab === 'feed' && (
          <div>
            {isCapOrAdmin && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.border }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {[{ key: 'news', label: 'Nyhet' }, { key: 'lineup', label: 'Laguttagning' }].map(t => (
                    <button key={t.key} onClick={() => setPostType(t.key as any)}
                      style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid ' + (postType === t.key ? C.accent : C.border), background: postType === t.key ? C.accent + '18' : 'transparent', color: postType === t.key ? C.accent : C.textMuted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
                  placeholder={postType === 'news' ? 'Dela en nyhet med laget...' : 'Skriv laguttagningen...'}
                  rows={3}
                  style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'system-ui', boxSizing: 'border-box' as const, marginBottom: 8 }}
                ></textarea>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={submitPost} disabled={submitting || !newPost.trim()}
                    style={{ background: newPost.trim() ? C.accent : C.border, color: newPost.trim() ? '#1a1400' : C.textMuted, border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: newPost.trim() ? 'pointer' : 'default' }}>
                    {submitting ? 'Publicerar...' : 'Publicera'}
                  </button>
                </div>
              </div>
            )}

            {posts.length === 0 && (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Inga inlagg an</div>
                <div style={{ fontSize: 13, color: C.textMuted }}>Kaptenen har inte publicerat nagot an</div>
              </div>
            )}

            {posts.map(post => (
              <div key={post.id} style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.border }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: post.post_type === 'lineup' ? C.accent : C.green, background: (post.post_type === 'lineup' ? C.accent : C.green) + '18', borderRadius: 6, padding: '2px 8px' }}>
                    {post.post_type === 'lineup' ? 'LAGUTTAGNING' : 'NYHET'}
                  </span>
                  <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 'auto' }}>
                    {post.created_at ? new Date(post.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>
                  {post.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AVAILABILITY TAB */}
        {activeTab === 'tillganglighet' && (
          <div>
            {upcomingMatches.length === 0 && (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                Inga kommande matcher
              </div>
            )}
            {upcomingMatches.map(match => {
              const isHomeTeam = match.home_team_id === id
              const opp = isHomeTeam ? match.away : match.home
              const poll = polls.find((p: any) => p.match_id === match.id)
              const myResponse = poll?.responses?.find((r: any) => r.user_id === user?.id)
              const yesCount = poll?.responses?.filter((r: any) => r.response === 'yes').length || 0
              const noCount = poll?.responses?.filter((r: any) => r.response === 'no').length || 0
              const maybeCount = poll?.responses?.filter((r: any) => r.response === 'maybe').length || 0
              const total = yesCount + maybeCount + noCount

              return (
                <a key={match.id} href={'/team/' + id + '/tillganglighet/' + match.id}
                  style={{ display: 'block', padding: '16px 20px', borderBottom: '1px solid ' + C.border, textDecoration: 'none' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                        vs {shortName(opp?.name || '')}
                      </div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>
                        {new Date(match.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {' · '}{isHomeTeam ? 'Hemma' : 'Borta'}
                      </div>
                    </div>
                    {myResponse ? (
                      <span style={{ fontSize: 20 }}>
                        {myResponse.response === 'yes' ? '✅' : myResponse.response === 'maybe' ? '🤔' : '❌'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accent + '18', borderRadius: 8, padding: '3px 10px' }}>
                        Svara →
                      </span>
                    )}
                  </div>
                  {total > 0 && (
                    <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                      <span style={{ color: C.green, fontWeight: 700 }}>{yesCount} Ja</span>
                      <span style={{ color: C.accent, fontWeight: 700 }}>{maybeCount} Kanske</span>
                      <span style={{ color: '#e05555', fontWeight: 700 }}>{noCount} Nej</span>
                    </div>
                  )}
                </a>
              )
            })}
          </div>
        )}

        {/* LAGUTTAGNING TAB */}
        {activeTab === 'laguttagning' && (
          <div style={{ padding: '20px' }}>
            {!isCapOrAdmin && (
              <div style={{ padding: '32px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                Bara kaptenen kan bygga laguttagning
              </div>
            )}
            {isCapOrAdmin && upcomingMatches.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                Inga kommande matcher att ta ut lag for
              </div>
            )}
            {isCapOrAdmin && upcomingMatches.length > 0 && (
              <div>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
                  Valj match for att bygga laguttagning:
                </div>
                {upcomingMatches.map(match => {
                  const isHomeTeam = match.home_team_id === id
                  const opp = isHomeTeam ? match.away : match.home
                  return (
                    <a key={match.id} href={'/team/' + id + '/laguttagning/' + match.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: C.card, borderRadius: 12, border: '1px solid ' + C.border, textDecoration: 'none', marginBottom: 8 }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                      onMouseLeave={e => (e.currentTarget.style.background = C.card)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                          vs {shortName(opp?.name || '')}
                        </div>
                        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                          {new Date(match.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
                          {' · '}{isHomeTeam ? 'Hemma' : 'Borta'}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>Bygg uttagning ›</div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'medlemmar' && (
          <div>
            {/* Pending requests - only captain sees */}
            {isCapOrAdmin && members.filter(m => m.status === 'pending').length > 0 && (
              <div style={{ padding: '12px 20px', background: C.accent + '11', borderBottom: '1px solid ' + C.border }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 1, marginBottom: 8 }}>VÄNTAR PA GODKÄNNANDE</div>
                {members.filter(m => m.status === 'pending').map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ flex: 1, fontSize: 13, color: C.text }}>
                    {m.user_id ? (profiles[m.user_id]?.full_name || profiles[m.user_id]?.email || 'Okänd') : 'Okänd'}
                  </div>
                    <button onClick={async () => {
                      const supabase = createClient()
                      await supabase.from('team_members').update({ status: 'active' }).eq('id', m.id)
                      setMembers(prev => prev.map(x => x.id === m.id ? { ...x, status: 'active' } : x))
                    }} style={{ background: C.green, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginRight: 4 }}>
                      Godkann
                    </button>
                    <button onClick={async () => {
                      const supabase = createClient()
                      await supabase.from('team_members').delete().eq('id', m.id)
                      setMembers(prev => prev.filter(x => x.id !== m.id))
                    }} style={{ background: '#e05555' + '22', color: '#e05555', border: '1px solid #e05555', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Neka
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Active members */}
            {members.filter(m => m.status === 'active').map(m => {
              const uid = m.user_id ?? ''
              const hue = uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const tc = 'hsl(' + hue + ',50%,45%)'
              const tclo = isDark ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
              const isMe = uid === user?.id

              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid ' + C.border }}>
                  {profiles[uid]?.avatar_url ? (
                    <Image src={profiles[uid].avatar_url} alt="" width={36} height={36} style={{ borderRadius: '50%', border: '1.5px solid ' + tc, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: tc, flexShrink: 0 }}>
                      {(profiles[uid]?.full_name || profiles[uid]?.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                      {isMe ? 'Du' : (profiles[uid]?.full_name || profiles[uid]?.email || 'Lagmedlem')}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{roleLabel(m.role ?? '')}</div>
                  </div>
                  {isMe && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.green + '18', borderRadius: 6, padding: '2px 8px' }}>Du</span>
                  )}
                  {isCapOrAdmin && !isMe && (
                    <select
                      value={m.role ?? ''}
                      onChange={async e => {
                        const supabase = createClient()
                        await supabase.from('team_members').update({ role: e.target.value }).eq('id', m.id)
                        setMembers(prev => prev.map(x => x.id === m.id ? { ...x, role: e.target.value } : x))
                      }}
                      style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 6, padding: '4px 8px', color: C.text, fontSize: 11, cursor: 'pointer' }}
                    >
                      <option value="player">Spelare</option>
                      <option value="board">Styrelse</option>
                      <option value="admin">Admin</option>
                      <option value="captain">Kapten</option>
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}
