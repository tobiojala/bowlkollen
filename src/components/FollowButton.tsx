'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Heart } from 'lucide-react'

type Props = {
  teamId: string
  size?: 'sm' | 'md'
  isDark?: boolean
}

export default function FollowButton({ teamId, size = 'md', isDark = true }: Props) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return }
      setUser(session.user)
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('team_id', teamId)
        .single()
      setFollowing(!!data)
      setLoading(false)
    })
  }, [teamId])

  const toggle = async () => {
    if (!user) { window.location.href = '/login'; return }
    const supabase = createClient()
    if (following) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('team_id', teamId)
      setFollowing(false)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, team_id: teamId })
      setFollowing(true)
    }
  }

  if (loading) return null

  const isSmall = size === 'sm'

  return (
    <button onClick={toggle}
      style={{
        display: 'flex', alignItems: 'center', gap: isSmall ? 4 : 6,
        padding: isSmall ? '5px 10px' : '8px 16px',
        background: following ? 'rgba(245,75,75,0.12)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        border: '1px solid ' + (following ? 'rgba(245,75,75,0.4)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
        borderRadius: 20,
        cursor: 'pointer',
        transition: 'all 0.2s',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <Heart
        size={isSmall ? 13 : 15}
        color={following ? '#e05555' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
        fill={following ? '#e05555' : 'none'}
        strokeWidth={2}
      />
      <span style={{
        fontSize: isSmall ? 11 : 12,
        fontWeight: 600,
        color: following ? '#e05555' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
      }}>
        {following ? 'Följer' : 'Följ'}
      </span>
    </button>
  )
}
