'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useSession } from '@/lib/queries'
import { STALE } from '@/lib/constants'

// Player profile photos. New RPCs (player_avatars.sql) aren't in the generated
// types yet — reach them untyped (see AGENTS.md). Degrades safely if absent.
const untyped = () => createClient() as unknown as SupabaseClient

// Approved photos: public_id → url. One cached query the app-wide PlayerAvatar
// reads from, so an approved photo lights up everywhere at once.
export function useApprovedAvatars() {
  return useQuery({
    queryKey: ['approved-avatars'],
    staleTime: STALE.LONG,
    queryFn: async () => {
      const map = new Map<string, string>()
      try {
        const { data } = await untyped().rpc('get_approved_avatars')
        for (const r of (data ?? []) as { public_id: string; avatar_url: string }[]) map.set(r.public_id, r.avatar_url)
      } catch { /* migration not live yet → everyone on initials */ }
      return map
    },
  })
}

// Owner uploads a new photo → stored in the avatars bucket → claim set pending.
export function useUploadMyAvatar() {
  const { data: session } = useSession()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File): Promise<void> => {
      const uid = session?.user?.id
      if (!uid) throw new Error('not authenticated')
      const db = untyped()
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${uid}/avatar-${Date.now()}.${ext}`
      const { error: upErr } = await db.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data: pub } = db.storage.from('avatars').getPublicUrl(path)
      const { error } = await db.rpc('set_my_player_avatar', { p_avatar_url: pub.publicUrl })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['approved-avatars'] }) },
  })
}

// Admin: pending review queue + moderation.
export type PendingAvatar = { public_id: string; avatar_url: string; player_name: string }

export function usePendingAvatars() {
  return useQuery({
    queryKey: ['pending-avatars'],
    staleTime: STALE.SHORT,
    queryFn: async (): Promise<PendingAvatar[]> => {
      const { data } = await untyped().rpc('get_pending_avatars')
      return (data ?? []) as PendingAvatar[]
    },
  })
}

export function useModerateAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ publicId, decision }: { publicId: string; decision: 'approved' | 'rejected' }) => {
      const { error } = await untyped().rpc('moderate_player_avatar', { p_public_id: publicId, p_decision: decision })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-avatars'] })
      qc.invalidateQueries({ queryKey: ['approved-avatars'] })
    },
  })
}
