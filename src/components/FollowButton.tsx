'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Heart } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

type Props = {
  teamId?: string
  playerId?: string
  type: 'team' | 'player'
  size?: 'sm' | 'md'
  isDark?: boolean
}

export default function FollowButton({ teamId, playerId, type, size = 'md', isDark = true }: Props) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return }
      setUser(session.user)
      let query = supabase.from('favorites').select('id').eq('user_id', session.user.id).eq('type', type)
      if (type === 'team' && teamId) query = query.eq('team_id', teamId)
      if (type === 'player' && playerId) query = query.eq('player_id', playerId)
      const { data } = await query.single()
      setFollowing(!!data)
      setLoading(false)
    })
  }, [teamId, playerId, type])

  const toggle = async () => {
    if (!user) { window.location.href = '/login'; return }
    const supabase = createClient()
    if (following) {
      let query = supabase.from('favorites').delete().eq('user_id', user.id).eq('type', type)
      if (type === 'team' && teamId) query = query.eq('team_id', teamId)
      if (type === 'player' && playerId) query = query.eq('player_id', playerId)
      await query
      setFollowing(false)
    } else {
      const insert: any = { user_id: user.id, type }
      if (type === 'team' && teamId) insert.team_id = teamId
      if (type === 'player' && playerId) insert.player_id = playerId
      await supabase.from('favorites').insert(insert)
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
        background: following ? 'rgba(224,85,85,0.12)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        border: '1px solid ' + (following ? 'rgba(224,85,85,0.4)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
        borderRadius: 20, cursor: 'pointer',
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
        fontSize: isSmall ? 11 : 12, fontWeight: 600,
        color: following ? '#e05555' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
      }}>
        {following ? 'Följer' : 'Följ'}
      </span>
    </button>
  )
}
