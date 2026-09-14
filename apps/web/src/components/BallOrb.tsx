'use client'

import Image from 'next/image'

// A klot's visual: the real bowwwl.com photo as a full-bleed circle (no ring), with a
// generated glossy orb as the fallback when there's no image.
function hue(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h }

export function BallOrb({ name, imageUrl, size = 56 }: { name: string; imageUrl?: string | null; size?: number }) {
  if (imageUrl) {
    return (
      <div style={{ position: 'relative', width: size, height: size, flex: 'none', borderRadius: '50%', overflow: 'hidden', background: '#05070a' }}>
        <Image src={imageUrl} alt={name} fill sizes={`${size}px`} style={{ objectFit: 'cover' }} />
      </div>
    )
  }
  const h = hue(name || '')
  return (
    <div aria-hidden style={{
      width: size, height: size, flex: 'none', borderRadius: '50%',
      background: `radial-gradient(circle at 33% 27%, rgba(255,255,255,.55), rgba(255,255,255,.05) 24%, transparent 42%), radial-gradient(circle at 50% 55%, hsl(${h},44%,32%), #05070a 94%)`,
      boxShadow: 'inset -4px -6px 13px rgba(0,0,0,.5)',
    }} />
  )
}
