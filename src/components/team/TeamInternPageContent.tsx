'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  teamInternRoleBadgeClass,
  teamInternRoleLabel,
  teamInternSelectClass,
  teamInternTextareaClass,
} from '@/lib/team-intern-ui'
import { widgetNo, widgetYes } from '@/lib/widget-ui'

type Props = { params: Promise<{ id: string }> }

type Member = {
  id: string
  user_id: string
  role: string
  status: string
  profiles?: { full_name: string; avatar_url: string; email: string }
}

type Post = {
  id: string
  content: string
  post_type: string
  created_at: string
}

type Poll = {
  id: string
  question: string
  deadline: string | null
  match_id: string | null
  responses?: { user_id: string; response: string; note: string | null }[]
}

const TABS = [
  { key: 'feed' as const, label: 'Feed' },
  { key: 'laguttagning' as const, label: 'Laguttagning' },
  { key: 'tillganglighet' as const, label: 'Tillganglighet' },
  { key: 'medlemmar' as const, label: 'Medlemmar' },
]

export function TeamInternPageContent({ params }: Props) {
  const [id, setId] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [myMembership, setMyMembership] = useState<Member | null>(null)
  const [team, setTeam] = useState<{ id: string; name: string; club?: string; city?: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Record<string, unknown>[]>([])
  const [profiles, setProfiles] = useState<Record<string, { full_name?: string; avatar_url?: string; email?: string }>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'feed' | 'laguttagning' | 'tillganglighet' | 'medlemmar'>('feed')
  const [newPost, setNewPost] = useState('')
  const [postType, setPostType] = useState<'news' | 'lineup'>('news')
  const [submitting, setSubmitting] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()

    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      setUser(session.user)

      const { data: membership } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', id)
        .eq('user_id', session.user.id)
        .single()

      if (!membership || membership.status !== 'active') {
        setAccessDenied(true)
        setMyMembership(membership || null)
        const { data: t } = await supabase.from('teams').select('id, name, club, city').eq('id', id).single()
        if (t) setTeam(t)
        setLoading(false)
        return
      }

      setMyMembership(membership)

      const [{ data: t }, { data: m }, { data: p }, { data: po }, { data: matches }] = await Promise.all([
        supabase.from('teams').select('id, name, club, city, slug, club_slug').eq('id', id).single(),
        supabase.from('team_members').select('id, user_id, role, status').eq('team_id', id),
        supabase
          .from('team_posts')
          .select('*')
          .eq('team_id', id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('availability_polls')
          .select('*, responses:availability_responses(user_id, response, note)')
          .eq('team_id', id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('matches')
          .select(
            'id, date, division, home_team_id, away_team_id, home:teams!home_team_id(name), away:teams!away_team_id(name)',
          )
          .or('home_team_id.eq.' + id + ',away_team_id.eq.' + id)
          .eq('status', 'upcoming')
          .order('date')
          .limit(5),
      ])

      if (t) setTeam(t)
      if (m) {
        setMembers(m as Member[])
        const userIds = (m as Member[]).map(x => x.user_id)
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .in('id', userIds)
          if (profileData) {
            const map: Record<string, (typeof profileData)[0]> = {}
            profileData.forEach(p => {
              map[p.id] = p
            })
            setProfiles(map)
          }
        }
      }
      if (p) setPosts(p as Post[])
      if (po) setPolls(po as Poll[])
      if (matches) setUpcomingMatches(matches as Record<string, unknown>[])
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
      .select('*')
      .single()
    if (!error && data) {
      setPosts(prev => [data as Post, ...prev])
      setNewPost('')
    }
    setSubmitting(false)
  }

  const requestAccess = async () => {
    if (!id || !user) return
    setRequesting(true)
    const supabase = createClient()
    await supabase.from('team_members').insert({
      team_id: id,
      user_id: user.id,
      role: 'player',
      status: 'pending',
    })
    setMyMembership({ id: '', user_id: user.id, role: 'player', status: 'pending' })
    setRequesting(false)
  }

  function shortName(n: string) {
    return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-sans">
        <div className="text-[13px] text-dark-muted">Laddar...</div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-sans">
        <div className="max-w-[360px] px-6 text-center">
          <Lock size={48} className="mx-auto mb-4 text-gold" />
          <div className="mb-2 text-xl font-extrabold bk-text-primary">{team?.club || team?.name}</div>
          <div className="mb-6 text-sm leading-relaxed text-dark-muted">
            Det har ar lagets privata sida. Bara lagmedlemmar har tillgang.
          </div>
          {!myMembership && (
            <button
              type="button"
              onClick={requestAccess}
              disabled={requesting}
              className="mb-3 w-full cursor-pointer rounded-xl border-0 bg-gold py-3.5 text-sm font-bold text-[#1a1400] disabled:opacity-60"
            >
              {requesting ? 'Skickar...' : 'Begar tillgang'}
            </button>
          )}
          {myMembership?.status === 'pending' && (
            <div className="rounded-xl border border-light-border bg-light-card p-3.5 text-[13px] text-dark-muted dark:border-dark-border dark:bg-dark-card">
              Din begaran väntar pa godkännande av kapten
            </div>
          )}
          <a href={'/teams/' + id} className="mt-4 block text-[13px] text-dark-muted no-underline">
            ← Tillbaka till lagprofilen
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="font-sans text-light-text dark:text-dark-text">
      <div className="mx-auto max-w-app pb-12">
        <div className="bg-gradient-to-br from-[#e8f0f8] to-[#d0e0f0] px-5 pt-5 pb-4 dark:from-[#0d1a2e] dark:to-[#1a2840]">
          <a
            href={'/teams/' + id}
            className="mb-4 inline-flex items-center gap-1 text-xs text-dark-muted no-underline"
          >
            ← Lagprofilen
          </a>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xl font-black bk-text-primary">{shortName(team?.name || '')}</div>
              <div className="mt-0.5 text-xs text-dark-muted">
                Intern lagsida · {members.filter(m => m.status === 'active').length} aktiva medlemmar
              </div>
            </div>
            <div
              className={cn(
                'shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold',
                teamInternRoleBadgeClass(myMembership?.role || ''),
              )}
            >
              {teamInternRoleLabel(myMembership?.role || '')}
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto border-b border-light-border bg-light-bg [scrollbar-width:none] dark:border-dark-border dark:bg-dark-bg [&::-webkit-scrollbar]:hidden">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'shrink-0 cursor-pointer border-0 border-b-2 bg-transparent px-4 py-3 text-[13px]',
                '[-webkit-tap-highlight-color:transparent]',
                activeTab === t.key
                  ? 'border-gold font-bold text-gold'
                  : 'border-transparent font-medium text-dark-muted',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'feed' && (
          <div>
            {isCapOrAdmin && (
              <div className="border-b border-light-border px-5 py-4 dark:border-dark-border">
                <div className="mb-2.5 flex gap-1.5">
                  {[
                    { key: 'news' as const, label: 'Nyhet' },
                    { key: 'lineup' as const, label: 'Laguttagning' },
                  ].map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setPostType(t.key)}
                      className={cn(
                        'cursor-pointer rounded-full border px-3 py-1.25 text-[11px] font-bold',
                        postType === t.key
                          ? 'border-gold/40 bg-gold/10 text-gold'
                          : 'border-light-border bg-transparent text-dark-muted dark:border-dark-border',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder={
                    postType === 'news' ? 'Dela en nyhet med laget...' : 'Skriv laguttagningen...'
                  }
                  rows={3}
                  className={teamInternTextareaClass}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={submitPost}
                    disabled={submitting || !newPost.trim()}
                    className={cn(
                      'cursor-pointer rounded-lg border-0 px-5 py-2.25 text-[13px] font-bold',
                      newPost.trim()
                        ? 'bg-gold text-[#1a1400]'
                        : 'cursor-default bg-light-border text-dark-muted dark:bg-dark-border',
                    )}
                  >
                    {submitting ? 'Publicerar...' : 'Publicera'}
                  </button>
                </div>
              </div>
            )}

            {posts.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="mb-1.5 text-sm font-semibold bk-text-primary">Inga inlagg an</div>
                <div className="text-[13px] text-dark-muted">Kaptenen har inte publicerat nagot an</div>
              </div>
            )}

            {posts.map(post => (
              <div
                key={post.id}
                className="border-b border-light-border px-5 py-4 dark:border-dark-border"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[10px] font-bold',
                      post.post_type === 'lineup'
                        ? 'bg-gold/10 text-gold'
                        : 'bg-[#1d9e75]/10 text-[#1d9e75] dark:bg-[#5a82b4]/10 dark:text-[#5a82b4]',
                    )}
                  >
                    {post.post_type === 'lineup' ? 'LAGUTTAGNING' : 'NYHET'}
                  </span>
                  <span className="ml-auto text-[11px] text-dark-muted">
                    {new Date(post.created_at).toLocaleDateString('sv-SE', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed bk-text-primary">
                  {post.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tillganglighet' && (
          <div>
            {upcomingMatches.length === 0 && (
              <div className="px-6 py-12 text-center text-[13px] text-dark-muted">Inga kommande matcher</div>
            )}
            {upcomingMatches.map(match => {
              const isHomeTeam = match.home_team_id === id
              const opp = (isHomeTeam ? match.away : match.home) as { name?: string } | undefined
              const poll = polls.find(p => p.match_id === match.id)
              const myResponse = poll?.responses?.find(r => r.user_id === user?.id)
              const yesCount = poll?.responses?.filter(r => r.response === 'yes').length || 0
              const noCount = poll?.responses?.filter(r => r.response === 'no').length || 0
              const maybeCount = poll?.responses?.filter(r => r.response === 'maybe').length || 0
              const total = yesCount + maybeCount + noCount

              return (
                <a
                  key={match.id as string}
                  href={'/team/' + id + '/tillganglighet/' + match.id}
                  className="block border-b border-light-border px-5 py-4 no-underline dark:border-dark-border"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="mb-0.5 text-sm font-bold bk-text-primary">
                        vs {shortName(opp?.name || '')}
                      </div>
                      <div className="text-xs text-dark-muted">
                        {new Date(match.date as string).toLocaleDateString('sv-SE', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                        {' · '}
                        {isHomeTeam ? 'Hemma' : 'Borta'}
                      </div>
                    </div>
                    {myResponse ? (
                      <span className="text-xl">
                        {myResponse.response === 'yes'
                          ? '✅'
                          : myResponse.response === 'maybe'
                            ? '🤔'
                            : '❌'}
                      </span>
                    ) : (
                      <span className="rounded-lg bg-gold/10 px-2.5 py-0.5 text-[11px] font-bold text-gold">
                        Svara →
                      </span>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="flex gap-2.5 text-[11px]">
                      <span className={cn('font-bold', widgetYes)}>{yesCount} Ja</span>
                      <span className="font-bold text-gold">{maybeCount} Kanske</span>
                      <span className={cn('font-bold', widgetNo)}>{noCount} Nej</span>
                    </div>
                  )}
                </a>
              )
            })}
          </div>
        )}

        {activeTab === 'laguttagning' && (
          <div className="p-5">
            {!isCapOrAdmin && (
              <div className="py-8 text-center text-[13px] text-dark-muted">
                Bara kaptenen kan bygga laguttagning
              </div>
            )}
            {isCapOrAdmin && upcomingMatches.length === 0 && (
              <div className="py-8 text-center text-[13px] text-dark-muted">
                Inga kommande matcher att ta ut lag for
              </div>
            )}
            {isCapOrAdmin && upcomingMatches.length > 0 && (
              <div>
                <div className="mb-4 text-[13px] text-dark-muted">Valj match for att bygga laguttagning:</div>
                {upcomingMatches.map(match => {
                  const isHomeTeam = match.home_team_id === id
                  const opp = (isHomeTeam ? match.away : match.home) as { name?: string } | undefined
                  return (
                    <a
                      key={match.id as string}
                      href={'/team/' + id + '/laguttagning/' + match.id}
                      className={cn(
                        'mb-2 flex items-center gap-3 rounded-xl border p-3.5 no-underline',
                        'border-light-border bg-light-card transition-colors',
                        'hover:bg-light-surface dark:border-dark-border dark:bg-dark-card dark:hover:bg-dark-surface',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold bk-text-primary">vs {shortName(opp?.name || '')}</div>
                        <div className="mt-0.5 text-xs text-dark-muted">
                          {new Date(match.date as string).toLocaleDateString('sv-SE', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                          {' · '}
                          {isHomeTeam ? 'Hemma' : 'Borta'}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs font-bold text-gold">Bygg uttagning ›</div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'medlemmar' && (
          <div>
            {isCapOrAdmin && members.filter(m => m.status === 'pending').length > 0 && (
              <div className="border-b border-light-border bg-gold/7 px-5 py-3 dark:border-dark-border">
                <div className="mb-2 text-[11px] font-extrabold tracking-wide text-gold">
                  VÄNTAR PA GODKÄNNANDE
                </div>
                {members
                  .filter(m => m.status === 'pending')
                  .map(m => (
                    <div key={m.id} className="mb-1.5 flex items-center gap-2.5">
                      <div className="flex-1 text-[13px] bk-text-primary">
                        {profiles[m.user_id]?.full_name || profiles[m.user_id]?.email || 'Okänd'}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const supabase = createClient()
                          await supabase.from('team_members').update({ status: 'active' }).eq('id', m.id)
                          setMembers(prev =>
                            prev.map(x => (x.id === m.id ? { ...x, status: 'active' } : x)),
                          )
                        }}
                        className="cursor-pointer rounded-md border-0 bg-[#3d6090] px-2.5 py-1 text-[11px] font-bold text-white dark:bg-[#5a82b4]"
                      >
                        Godkann
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const supabase = createClient()
                          await supabase.from('team_members').delete().eq('id', m.id)
                          setMembers(prev => prev.filter(x => x.id !== m.id))
                        }}
                        className="cursor-pointer rounded-md border border-[#e05555] bg-[#e05555]/13 px-2.5 py-1 text-[11px] font-bold text-[#e05555]"
                      >
                        Neka
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {members
              .filter(m => m.status === 'active')
              .map(m => {
                const hue = m.user_id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                const tc = `hsl(${hue},50%,45%)`
                const tclo = `hsl(${hue},40%,92%)`
                const tcloDark = `hsl(${hue},40%,15%)`
                const isMe = m.user_id === user?.id
                const profile = profiles[m.user_id]

                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 border-b border-light-border px-5 py-3 dark:border-dark-border"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full border-[1.5px] object-cover dark:hidden"
                        style={{ borderColor: tc }}
                      />
                    ) : (
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] text-xs font-bold dark:hidden"
                        style={{ background: tclo, borderColor: tc, color: tc }}
                      >
                        {(profile?.full_name || profile?.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="hidden h-9 w-9 shrink-0 rounded-full border-[1.5px] object-cover dark:block"
                        style={{ borderColor: tc }}
                      />
                    ) : (
                      <div
                        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] text-xs font-bold dark:flex"
                        style={{ background: tcloDark, borderColor: tc, color: tc }}
                      >
                        {(profile?.full_name || profile?.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold bk-text-primary">
                        {isMe ? 'Du' : profile?.full_name || profile?.email || 'Lagmedlem'}
                      </div>
                      <div className="text-[11px] text-dark-muted">{teamInternRoleLabel(m.role)}</div>
                    </div>
                    {isMe && (
                      <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold', widgetYes, 'bg-[#3d6090]/10 dark:bg-[#5a82b4]/10')}>
                        Du
                      </span>
                    )}
                    {isCapOrAdmin && !isMe && (
                      <select
                        value={m.role}
                        onChange={async e => {
                          const supabase = createClient()
                          await supabase
                            .from('team_members')
                            .update({ role: e.target.value })
                            .eq('id', m.id)
                          setMembers(prev =>
                            prev.map(x => (x.id === m.id ? { ...x, role: e.target.value } : x)),
                          )
                        }}
                        className={teamInternSelectClass}
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
    </div>
  )
}
