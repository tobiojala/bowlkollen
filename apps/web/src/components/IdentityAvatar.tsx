'use client'

import Image from 'next/image'
import { COLOR, FONT } from '@/lib/brand'

// Shared identity treatment for teams + players — the web twin of native's
// IdentityAvatar: a name-hashed colour ring with a soft top-down specular sheen,
// a 2px bg gap, then the initials (or a photo when one exists). One component so
// every avatar across the app reads the same, and profile pictures drop straight
// in via `imageUrl` with the initials as the graceful fallback.

export function avatarColors(name: string) {
  const hue = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return {
    bg:   `hsl(${hue}, 38%, 14%)`,
    ring: `hsl(${hue}, 55%, 56%)`,
    text: `hsl(${hue}, 62%, 64%)`,
  }
}

function initialsOf(name: string) {
  return (name || '').split(' ').map((w) => w[0] ?? '').join('').slice(0, 3).toUpperCase()
}

export function IdentityAvatar({ name, size = 44, imageUrl = null }: {
  name: string
  size?: number
  imageUrl?: string | null
}) {
  const c = avatarColors(name)
  const ringW = Math.max(3, Math.round(size * 0.05))

  return (
    <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%', padding: ringW,
      boxSizing: 'border-box', background: c.ring, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0) 62%)' }} />
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
        background: c.bg, border: `2px solid ${COLOR.bg}`, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill sizes={`${size}px`} style={{ objectFit: 'cover' }} />
        ) : (
          <span style={{ fontFamily: FONT.score, color: c.text, fontSize: Math.round(size * 0.34), fontWeight: 700, letterSpacing: 0.5 }}>
            {initialsOf(name)}
          </span>
        )}
      </div>
    </div>
  )
}
