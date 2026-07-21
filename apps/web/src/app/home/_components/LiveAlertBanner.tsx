'use client'

import Link from 'next/link'
import { COLOR, TYPE } from '@/lib/brand'
import type { Match } from '@/lib/types'
import type { Tavling } from '@/lib/competitions'

type LiveItem = {
  id: string
  label: string
  href: string
  isExternal: boolean
}

function buildItems(matches: Match[], competitions: Tavling[]): LiveItem[] {
  return [
    ...matches.map(m => ({
      id: `match-${m.id}`,
      label: [m.home?.name, m.away?.name].filter(Boolean).join(' – ') || 'Matchen pågår',
      href: `/matches/${m.id}`,
      isExternal: false,
    })),
    ...competitions.map(t => ({
      id: `comp-${t.id}`,
      label: t.name,
      href: t.href,
      isExternal: t.href.startsWith('http'),
    })),
  ]
}

function TickerItem({ item }: { item: LiveItem }) {
  const inner = (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '0 28px', whiteSpace: 'nowrap',
    }}>
      <span
        className="live-dot"
        style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR.gold, flexShrink: 0 }}
      />
      <span style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.gold }}>
        LIVE
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: COLOR.ink }}>
        {item.label}
      </span>
      <span style={{ fontSize: TYPE.label, color: 'rgba(244,245,247,0.2)', marginLeft: 8 }}>·</span>
    </span>
  )

  const linkStyle: React.CSSProperties = { textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }

  if (item.isExternal) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        {inner}
      </a>
    )
  }
  return (
    <Link href={item.href} style={linkStyle}>
      {inner}
    </Link>
  )
}

export function LiveAlertBanner({ matches, competitions }: {
  matches: Match[]
  competitions: Tavling[]
}) {
  const items = buildItems(matches, competitions)
  if (items.length === 0) return null

  // Duplicate content for seamless loop — @keyframes ticker moves by -50%
  const doubled = [...items, ...items]
  // ~50px per character of the longest label at 13px, heuristic duration
  const longestLabel = items.reduce((max, it) => Math.max(max, it.label.length), 0)
  const duration = Math.max(10, items.length * (longestLabel * 0.18 + 3))

  return (
    <div style={{
      overflow: 'hidden',
      background: 'rgba(245,194,0,0.05)',
      borderBottom: `1px solid rgba(245,194,0,0.14)`,
      height: 36,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div
        className="ticker-track"
        style={{ animationDuration: `${duration}s` }}
      >
        {doubled.map((item, i) => (
          <TickerItem key={`${item.id}-${i}`} item={item} />
        ))}
      </div>
    </div>
  )
}
