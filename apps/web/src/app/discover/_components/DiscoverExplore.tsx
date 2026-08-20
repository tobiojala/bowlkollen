'use client'

import Link from 'next/link'
import { Trophy, MapPin, Store, Users, ChevronRight } from 'lucide-react'
import { COLOR } from '@/lib/brand'

// The "explore the wider sport" hub inside Hitta (World 5) — divisions, clubs,
// halls, klotshopar. Shared placement with native's Hitta → UTFORSKA BOWLING.
const ENTRIES = [
  { href: '/schema',     icon: Trophy, title: 'Divisioner', sub: 'Elitserien · Allsvenskan · Division 1–5' },
  { href: '/teams',      icon: Users,  title: 'Klubbar',    sub: 'Alla klubbar och deras lag' },
  { href: '/hallar',     icon: MapPin, title: 'Hallar',     sub: 'Bowlinghallar i Sverige — adress, banor, bokning' },
  { href: '/klotshopar', icon: Store,  title: 'Klotshopar', sub: 'Pro shops — borrning, utrustning, kontakt' },
] as const

export function DiscoverExplore() {
  return (
    <>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: COLOR.ink3, textTransform: 'uppercase', margin: '4px 2px 10px' }}>
        Utforska bowling
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {ENTRIES.map(({ href, icon: Icon, title, sub }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: COLOR.surface, border: `1px solid ${COLOR.hairline}`, borderRadius: 16, padding: '14px 18px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,194,0,0.10)', border: '1px solid rgba(245,194,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={COLOR.gold} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink }}>{title}</div>
                <div style={{ fontSize: 12, color: COLOR.ink3, marginTop: 2 }}>{sub}</div>
              </div>
              <ChevronRight size={16} color={COLOR.ink4} />
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
