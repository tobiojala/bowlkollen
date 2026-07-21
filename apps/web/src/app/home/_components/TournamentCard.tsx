'use client'

import Link from 'next/link'
import { HC } from './tokens'

/** Upcoming-tournament teaser — the one gold-tinted block low in the feed. */
export default function TournamentCard() {
  return (
    <div style={{ padding: '32px 20px 0' }}>
      <Link href="/sllm" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
        borderRadius: 18, textDecoration: 'none', background: 'rgba(245,194,0,0.06)',
        border: '1px solid rgba(245,194,0,0.18)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(245,194,0,0.7)', marginBottom: 5 }}>
            KOMMANDE TÄVLING
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: HC.INK, lineHeight: 1.25 }}>
            Storm Lucky Larsen Masters
          </div>
          <div style={{ fontSize: 11, color: HC.INK3, marginTop: 4 }}>22–30 aug · Lucky Bowl, Helsingborg</div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(245,194,0,0.75)', flexShrink: 0 }}>Mer info →</span>
      </Link>
    </div>
  )
}
