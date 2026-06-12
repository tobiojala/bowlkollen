'use client'

import React, { useState } from 'react'
import { useColors } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase'
import type { Post } from '@/lib/types'

type Props = {
  id: string
  posts: Post[]
  isAdmin: boolean
  hasSession: boolean
  onPostsChange: (posts: Post[]) => void
}

type PostType = 'news' | 'lineup'

export default function TeamCommunity({ id, posts, isAdmin, hasSession, onPostsChange }: Props) {
  const { C, isDark } = useColors()
  const [postType,   setPostType]   = useState<PostType>('news')
  const [newPost,    setNewPost]    = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submitPost = async () => {
    if (!newPost.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('team_posts')
      .insert({ team_id: id, content: newPost, post_type: postType })
      .select('*')
      .single()
    if (!error && data) {
      onPostsChange([data as Post, ...posts])
      setNewPost('')
    }
    setSubmitting(false)
  }

  const deletePost = async (postId: string) => {
    await createClient().from('team_posts').delete().eq('id', postId)
    onPostsChange(posts.filter(p => p.id !== postId))
  }

  const typeLabel = (t: Post['type']) => {
    if (t === 'lineup') return 'LAGUTTAGNING'
    return 'NYHET'
  }
  const typeColor = (t: Post['type']) => t === 'lineup' ? C.accent : C.green

  return (
    <section id="team-community" style={{ scrollMarginTop: 60, borderTop: '1px solid ' + C.border }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>NYHETER & COMMUNITY</span>
      </div>

      {isAdmin && (
        <div style={{ padding: '0 20px 16px', borderBottom: '1px solid ' + C.border }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {(['news', 'lineup'] as PostType[]).map(t => (
              <button
                key={t}
                onClick={() => setPostType(t)}
                style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid ' + (postType === t ? C.accent : C.border), background: postType === t ? C.accent + '18' : 'transparent', color: postType === t ? C.accent : C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                {t === 'news' ? 'Nyhet' : 'Laguttagning'}
              </button>
            ))}
          </div>
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder={postType === 'news' ? 'Dela en nyhet med laget...' : 'Skriv laguttagningen...'}
            rows={3}
            style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '10px 12px', color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', marginBottom: 8 } as React.CSSProperties}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={submitPost}
              disabled={submitting || !newPost.trim()}
              style={{ background: newPost.trim() ? C.accent : C.border, color: newPost.trim() ? '#1a1400' : C.muted, border: 'none', borderRadius: 10, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: newPost.trim() ? 'pointer' : 'default', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Publicerar...' : 'Publicera'}
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Inga inlägg än</div>
          <div style={{ fontSize: 13, color: C.muted }}>
            {isAdmin ? 'Dela nyheter och laguttagningar med laget' : 'Kaptenen har inte publicerat något än'}
          </div>
        </div>
      ) : (
        <div>
          {posts.map(post => {
            const d       = new Date(post.created_at)
            const dateStr = d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })
            const timeStr = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
            const color   = typeColor(post.type)
            return (
              <div
                key={post.id}
                style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.border, background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color, background: color + '18', borderRadius: 6, padding: '2px 8px', letterSpacing: 0.5 }}>
                    {typeLabel(post.type)}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted, marginLeft: 'auto' }}>{dateStr} {timeStr}</span>
                  {isAdmin && (
                    <button onClick={() => deletePost(post.id)} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>✕</button>
                  )}
                </div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.65, whiteSpace: 'pre-wrap' as const }}>{post.content}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer spacer */}
      <div style={{ height: 48 }} />
    </section>
  )
}
