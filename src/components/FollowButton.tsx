'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/cn'

type Props = {
  teamId?: string
  playerId?: string
  type: 'team' | 'player'
  size?: 'sm' | 'md'
  /** @deprecated Theme is inferred via Tailwind dark: — prop kept for call-site compatibility */
  isDark?: boolean
}

export default function FollowButton({ teamId, playerId, type, size = 'md' }: Props) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false)
        return
      }
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
    if (!user) {
      window.location.href = '/login'
      return
    }
    const supabase = createClient()
    if (following) {
      let query = supabase.from('favorites').delete().eq('user_id', user.id).eq('type', type)
      if (type === 'team' && teamId) query = query.eq('team_id', teamId)
      if (type === 'player' && playerId) query = query.eq('player_id', playerId)
      await query
      setFollowing(false)
    } else {
      const insert: Record<string, string> = { user_id: user.id, type }
      if (type === 'team' && teamId) insert.team_id = teamId
      if (type === 'player' && playerId) insert.player_id = playerId
      await supabase.from('favorites').insert(insert)
      setFollowing(true)
    }
  }

  if (loading) return null

  const isSmall = size === 'sm'

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'flex cursor-pointer items-center rounded-full border transition-transform',
        'hover:scale-[1.03] active:scale-100',
        isSmall ? 'gap-1 px-2.5 py-1.25' : 'gap-1.5 px-4 py-2',
        following
          ? 'border-red/40 bg-red/12'
          : 'border-light-border bg-black/4 dark:border-white/10 dark:bg-white/6',
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <Heart
        size={isSmall ? 13 : 15}
        className={cn(following ? 'text-red' : 'text-dark-muted')}
        fill={following ? 'currentColor' : 'none'}
        strokeWidth={2}
      />
      <span
        className={cn(
          'font-semibold',
          isSmall ? 'text-[11px]' : 'text-xs',
          following ? 'text-red' : 'text-dark-muted',
        )}
      >
        {following ? 'Följer' : 'Följ'}
      </span>
    </button>
  )
}
