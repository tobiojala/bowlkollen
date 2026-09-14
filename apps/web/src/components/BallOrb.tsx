'use client'

import Image from 'next/image'
import { COLOR } from '@/lib/brand'

// A klot's visual, styled like the home-feed story circles: a subtle ring + top sheen
// + a 2px bg gap around the real bowwwl.com photo (a generated glossy orb when there's
// no image). Pass ring={false} for a plain circle.
const SHEEN = 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0) 65%)'
function hue(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h }

export function BallOrb({ name, imageUrl, size = 52, ring = true }: { name: string; imageUrl?: string | null; size?: number; ring?: boolean }) {
  const h = hue(name || '')
  const face = imageUrl
    ? <Image src={imageUrl} alt={name} fill sizes={`${size}px`} style={{ objectFit: 'cover' }} />
    : <span aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 33% 27%, rgba(255,255,255,.55), rgba(255,255,255,.05) 24%, transparent 42%), radial-gradient(circle at 50% 55%, hsl(${h},44%,32%), #05070a 94%)` }} />

  if (!ring) {
    return <div style={{ position: 'relative', width: size, height: size, flex: 'none', borderRadius: '50%', overflow: 'hidden', background: '#05070a' }}>{face}</div>
  }
  const r = Math.max(2, Math.round(size * 0.045))
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none', borderRadius: '50%', padding: r, boxSizing: 'border-box', background: COLOR.ink4 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none', background: SHEEN }} />
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#05070a', border: `2px solid ${COLOR.bg}`, boxSizing: 'border-box' }}>{face}</div>
    </div>
  )
}
