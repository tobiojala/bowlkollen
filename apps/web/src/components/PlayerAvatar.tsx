'use client'

import { IdentityAvatar } from '@/components/IdentityAvatar'
import { useApprovedAvatars } from '@/lib/avatars'

// A player's avatar, app-wide. Resolves the player's approved profile photo
// (by public_id, from one cached query) and renders it through IdentityAvatar,
// falling back to initials. Use this wherever a PLAYER shows — the photo then
// follows everywhere at once. Teams stay on plain IdentityAvatar(name).
export function PlayerAvatar({ publicId, name, size = 44 }: { publicId?: string | null; name: string; size?: number }) {
  const { data: avatars } = useApprovedAvatars()
  const imageUrl = publicId ? avatars?.get(publicId) ?? null : null
  return <IdentityAvatar name={name} size={size} imageUrl={imageUrl} />
}
