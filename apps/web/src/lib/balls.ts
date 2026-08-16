'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useSession } from '@/lib/queries'

// bowling_balls / player_balls aren't in the generated types (run
// supabase/migrations/ball_arsenal.sql) — reach them untyped.
const untyped = () => createClient() as unknown as SupabaseClient

export type CatalogBall = {
  id: string; brand: string; name: string; coverstock: string | null; core: string | null
  rg: number | null; differential: number | null; imageUrl: string | null
}

export type BagBall = {
  id: string; ballId: string | null; brand: string | null; name: string
  coverstock: string | null; core: string | null; rg: number | null; differential: number | null
  imageUrl: string | null; weight: number | null; surface: string | null; layout: string | null
  notes: string | null; inBag: boolean
}

/** The user's bag, ordered as arranged; joins the catalog row when the ball came from it. */
export function useMyBalls() {
  const { data: session } = useSession()
  const uid = session?.user?.id
  return useQuery({
    queryKey: ['my-balls', uid],
    enabled: !!uid,
    queryFn: async (): Promise<BagBall[]> => {
      const { data } = await untyped()
        .from('player_balls')
        .select('id, ball_id, custom_name, brand, weight, surface, layout, notes, in_bag, sort_order, ball:ball_id(brand, name, coverstock, core, rg, differential, image_url)')
        .eq('user_id', uid!)
        .order('in_bag', { ascending: false }).order('sort_order', { ascending: true }).order('created_at', { ascending: true })
      return ((data ?? []) as Record<string, unknown>[]).map((rec) => {
        const cat = (Array.isArray(rec.ball) ? rec.ball[0] : rec.ball) as Record<string, unknown> | null
        return {
          id: rec.id as string, ballId: (rec.ball_id as string | null) ?? null,
          brand: (cat?.brand as string | null) ?? (rec.brand as string | null) ?? null,
          name: (cat?.name as string | null) ?? (rec.custom_name as string | null) ?? 'Klot',
          coverstock: (cat?.coverstock as string | null) ?? null, core: (cat?.core as string | null) ?? null,
          rg: (cat?.rg as number | null) ?? null, differential: (cat?.differential as number | null) ?? null,
          imageUrl: (cat?.image_url as string | null) ?? null,
          weight: (rec.weight as number | null) ?? null, surface: (rec.surface as string | null) ?? null,
          layout: (rec.layout as string | null) ?? null, notes: (rec.notes as string | null) ?? null,
          inBag: (rec.in_bag as boolean | null) ?? true,
        }
      })
    },
  })
}

/** Type-ahead over our own catalog. Empty until seeded/partnered — add flow always
 * falls back to free entry, so the arsenal works regardless. */
export function useCatalogSearch(query: string) {
  const q = query.trim()
  return useQuery({
    queryKey: ['ball-catalog', q],
    enabled: q.length >= 2,
    queryFn: async (): Promise<CatalogBall[]> => {
      const { data } = await untyped()
        .from('bowling_balls').select('id, brand, name, coverstock, core, rg, differential, image_url')
        .or(`name.ilike.%${q}%,brand.ilike.%${q}%`).limit(25)
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: r.id as string, brand: r.brand as string, name: r.name as string,
        coverstock: (r.coverstock as string | null) ?? null, core: (r.core as string | null) ?? null,
        rg: (r.rg as number | null) ?? null, differential: (r.differential as number | null) ?? null,
        imageUrl: (r.image_url as string | null) ?? null,
      }))
    },
  })
}

export type NewBall = {
  ballId: string | null; customName: string | null; brand: string | null
  weight: number | null; surface: string | null; layout: string | null; notes: string | null
}

export function useAddBall() {
  const { data: session } = useSession()
  const uid = session?.user?.id
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (b: NewBall) => {
      const { error } = await untyped().from('player_balls').insert({
        user_id: uid, ball_id: b.ballId, custom_name: b.customName, brand: b.brand,
        weight: b.weight, surface: b.surface?.trim() || null, layout: b.layout?.trim() || null, notes: b.notes?.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-balls', uid] }),
  })
}

export function useUpdateBall() {
  const { data: session } = useSession()
  const uid = session?.user?.id
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await untyped().from('player_balls').update(input.patch).eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-balls', uid] }),
  })
}

export function useDeleteBall() {
  const { data: session } = useSession()
  const uid = session?.user?.id
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await untyped().from('player_balls').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-balls', uid] }),
  })
}
