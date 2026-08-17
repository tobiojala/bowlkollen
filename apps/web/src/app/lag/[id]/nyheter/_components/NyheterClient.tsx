'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Megaphone, BarChart3, Plus, X } from 'lucide-react'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { useSession, useTeamClaim } from '@/lib/queries'
import {
  useTeamPosts, useCreateTeamPost, useCreateTeamPoll, useVotePost, useMarkPostsSeen,
  type TeamPost, type PollOption,
} from '@/lib/team-posts'

const POST_ROLES = ['captain', 'lagledare', 'styrelse', 'admin']

function fmt(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

export default function NyheterClient({ teamId }: { teamId: number }) {
  const router = useRouter()
  const { data: session, isLoading } = useSession()
  const { data: claim } = useTeamClaim(teamId)
  const { data: posts = [] } = useTeamPosts(teamId)
  const createPost = useCreateTeamPost(teamId)
  const createPoll = useCreateTeamPoll(teamId)
  const vote = useVotePost(teamId)
  const markSeen = useMarkPostsSeen(teamId)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pollMode, setPollMode] = useState(false)
  const [options, setOptions] = useState<string[]>(['', ''])

  // Opening the board clears the unread badge.
  useEffect(() => { if (teamId > 0 && session) markSeen.mutate() }, [teamId, session]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLoading && !session) { if (typeof window !== 'undefined') window.location.href = '/login'; return null }

  const canPost = claim?.status === 'verified' && POST_ROLES.includes(claim.role ?? '')
  const busy = createPost.isPending || createPoll.isPending

  const submit = async () => {
    if (pollMode) {
      const opts = options.map((o) => o.trim()).filter(Boolean)
      if (opts.length < 2) return
      await createPoll.mutateAsync({ title: title.trim(), body: body.trim(), options: opts })
    } else {
      if (!body.trim()) return
      await createPost.mutateAsync({ title: title.trim(), body: body.trim() })
    }
    setTitle(''); setBody(''); setPollMode(false); setOptions(['', ''])
  }

  const input: React.CSSProperties = {
    width: '100%', background: COLOR.surface2, border: `1px solid ${COLOR.hairline}`,
    borderRadius: RADIUS.md, padding: '12px 14px', fontSize: 16, color: COLOR.ink, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 20px 96px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={() => router.push(`/lag/${teamId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: COLOR.ink2, fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '4px 0', alignSelf: 'flex-start' }}>
          <ChevronLeft size={20} /> Laget
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Megaphone size={22} color={COLOR.gold} />
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.4, margin: 0 }}>Anslagstavla</h1>
        </div>

        {/* Composer — captains / board only */}
        {canPost && (
          <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rubrik (valfritt)" style={input} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
              placeholder={pollMode ? 'Beskriv omröstningen…' : 'Skriv till laget…'} style={{ ...input, resize: 'vertical' }} />

            {pollMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {options.map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input value={o} onChange={(e) => setOptions(options.map((x, j) => j === i ? e.target.value : x))}
                      placeholder={`Alternativ ${i + 1}`} style={input} />
                    {options.length > 2 && (
                      <button onClick={() => setOptions(options.filter((_, j) => j !== i))} aria-label="Ta bort alternativ"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}><X size={18} color={COLOR.ink3} /></button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <button onClick={() => setOptions([...options, ''])}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: COLOR.ink2, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '4px 0', alignSelf: 'flex-start' }}>
                    <Plus size={16} /> Lägg till alternativ
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setPollMode((p) => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: pollMode ? 'rgba(245,194,0,0.14)' : COLOR.surface2, border: `1px solid ${pollMode ? 'rgba(245,194,0,0.4)' : COLOR.hairline}`, borderRadius: 999, padding: '8px 14px', fontSize: 14, fontWeight: 700, color: pollMode ? COLOR.gold : COLOR.ink2, cursor: 'pointer' }}>
                <BarChart3 size={16} /> Omröstning
              </button>
              <button onClick={submit} disabled={busy}
                style={{ marginLeft: 'auto', background: COLOR.gold, color: '#1a1400', border: 'none', borderRadius: 999, padding: '10px 22px', fontSize: 15, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1 }}>
                {busy ? 'Publicerar…' : 'Publicera'}
              </button>
            </div>
          </div>
        )}

        {/* Board */}
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.body, padding: `${SPACE[8]}px 20px` }}>
            {canPost ? 'Inga inlägg än — skriv det första till laget.' : 'Inga inlägg än.'}
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} onVote={(optionId) => vote.mutate({ postId: p.id, optionId })} />)
        )}
      </div>
    </main>
  )
}

function PostCard({ post, onVote }: { post: TeamPost; onVote: (optionId: string) => void }) {
  return (
    <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.gold }}>{post.authorName}</span>
        <span style={{ fontSize: 13, color: COLOR.ink4 }}>· {fmt(post.createdAt)}</span>
      </div>
      {post.title && <div style={{ fontSize: 17, fontWeight: 700, color: COLOR.ink, marginBottom: 4 }}>{post.title}</div>}
      {post.body && <div style={{ fontSize: 16, color: COLOR.ink2, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{post.body}</div>}
      {post.kind === 'poll' && <Poll options={post.options} onVote={onVote} />}
    </div>
  )
}

function Poll({ options, onVote }: { options: PollOption[]; onVote: (optionId: string) => void }) {
  const total = options.reduce((a, o) => a + o.votes, 0)
  const voted = options.some((o) => o.mine)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
      {options.map((o) => {
        const pct = total ? Math.round((o.votes / total) * 100) : 0
        return (
          <button key={o.id} onClick={() => !voted && onVote(o.id)} disabled={voted}
            style={{ position: 'relative', overflow: 'hidden', textAlign: 'left', cursor: voted ? 'default' : 'pointer',
              background: COLOR.surface2, border: `1px solid ${o.mine ? 'rgba(245,194,0,0.4)' : COLOR.hairline}`,
              borderRadius: RADIUS.md, padding: '12px 14px' }}>
            {voted && <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: o.mine ? 'rgba(245,194,0,0.14)' : 'rgba(244,245,247,0.06)' }} />}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: o.mine ? COLOR.gold : COLOR.ink }}>{o.label}</span>
              {voted && <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.ink2, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>}
            </div>
          </button>
        )
      })}
      {voted && <div style={{ fontSize: 13, color: COLOR.ink4 }}>{total} {total === 1 ? 'röst' : 'röster'}</div>}
    </div>
  )
}
