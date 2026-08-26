'use client'

import Link from 'next/link'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { Promo } from '@/lib/home-promos'

// A promo slot in the feed. Today the only promo is our own house card (kind:
// 'house') — an honest "advertise here" pitch, tagged Bowlkollen so it's never
// mistaken for a third party. Real sponsor deals (kind: 'sponsor') render the
// same way with their own kicker/CTA.
export function PromoCard({ promo }: { promo: Promo }) {
  const house = promo.kind === 'house'
  return (
    <div style={{ borderBottom: `1px solid ${COLOR.hairline}`, padding: `${SPACE[6]}px ${SPACE[3]}px`, display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: TYPE.label, fontWeight: 700, color: COLOR.ink3, letterSpacing: '0.1em' }}>{promo.kicker}</span>
        {house && <span style={{ fontSize: TYPE.micro, fontWeight: 600, color: COLOR.ink4, letterSpacing: '0.06em' }}>BOWLKOLLEN</span>}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: COLOR.ink, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{promo.title}</div>
      <div style={{ fontSize: 15, color: COLOR.ink2, lineHeight: 1.5 }}>{promo.body}</div>
      <Link href={promo.href} style={{ alignSelf: 'flex-start', marginTop: SPACE[1], padding: '10px 16px', background: COLOR.gold, color: '#151005',
        borderRadius: RADIUS.md, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
        {promo.cta} →
      </Link>
    </div>
  )
}
