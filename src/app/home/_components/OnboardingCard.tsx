'use client'

import Link from 'next/link'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { FeedFilterType } from './HomeTabRow'

const configs: Record<string, { heading: string; body: string; cta: string }> = {
  lag: {
    heading: 'Följ ditt lag',
    body: 'Se matcher och berättelser direkt i flödet — anpassat för dig.',
    cta: 'Hitta ditt lag →',
  },
  spelare: {
    heading: 'Följ dina spelare',
    body: 'Se resultat och milstolpar från de spelare du bryr dig om.',
    cta: 'Utforska spelare →',
  },
  allt: {
    heading: 'Följ lag och spelare',
    body: 'Se matcher, resultat och berättelser direkt i flödet — anpassat för dig.',
    cta: 'Välj ditt lag →',
  },
}

export function OnboardingCard({ filter = 'allt' }: { filter?: FeedFilterType }) {
  const { heading, body, cta } = configs[filter] ?? configs.allt

  return (
    <div style={{ padding: `${SPACE[4]}px ${SPACE[4]}px ${SPACE[8]}px` }}>
      <div style={{
        background: COLOR.surface,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLOR.hairline}`,
        padding: `${SPACE[6]}px ${SPACE[4]}px`,
      }}>
        <div style={{
          width: 28, height: 3,
          background: COLOR.gold,
          borderRadius: 2,
          marginBottom: SPACE[4],
        }} />
        <div style={{
          fontSize: 20, fontWeight: 700, color: COLOR.ink,
          lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: SPACE[2],
        }}>
          {heading}
        </div>
        <div style={{
          fontSize: TYPE.body, color: COLOR.ink3,
          lineHeight: 1.55, marginBottom: SPACE[4],
        }}>
          {body}
        </div>
        <Link href="/discover" style={{
          display: 'inline-flex', alignItems: 'center', gap: SPACE[2],
          padding: `10px ${SPACE[4]}px`,
          background: COLOR.gold, color: COLOR.bg,
          borderRadius: RADIUS.md, fontSize: 13, fontWeight: 700,
          textDecoration: 'none',
        }}>
          {cta}
        </Link>
      </div>
    </div>
  )
}
