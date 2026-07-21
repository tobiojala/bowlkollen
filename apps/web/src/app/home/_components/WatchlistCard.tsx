'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getBookmarks, type BookmarkedMatch } from '@/lib/bookmarks'
import { HC } from './tokens'

const FONT_D     = "var(--font-display, 'Barlow Condensed', system-ui)"
const DAYS_SHORT = ['sön','mån','tis','ons','tor','fre','lör']
const MON_SHORT  = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MON_SHORT[d.getMonth()]}`
}

export default function WatchlistCard() {
  const [items, setItems] = useState<BookmarkedMatch[]>([])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const upcoming = getBookmarks()
      .filter(b => b.date.slice(0, 10) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
    setItems(upcoming)
  }, [])

  if (items.length === 0) return null

  return (
    <div style={{ padding: '24px 20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: HC.INK3, marginBottom: 12 }}>
        DINA MATCHER
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(b => (
          <Link key={b.id} href={`/matches/${b.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: HC.SURFACE, borderRadius: 14, padding: '12px 16px',
              borderLeft: `2px solid ${HC.GOLD}55`,
            }}>
              {/* Time block */}
              <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 48 }}>
                <div style={{ fontFamily: FONT_D, fontSize: 24, fontWeight: 900, lineHeight: 1, color: HC.GOLD }}>
                  {fmtTime(b.date)}
                </div>
                <div style={{ fontSize: 9, color: HC.INK4, marginTop: 2, fontWeight: 600 }}>
                  {fmtDate(b.date)}
                </div>
              </div>

              {/* Match info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: HC.INK,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {b.home} – {b.away}
                </div>
                {b.venue && (
                  <div style={{
                    fontSize: 10, color: HC.INK3, marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {b.venue}
                  </div>
                )}
              </div>

              <span style={{ fontSize: 13, color: HC.INK4, flexShrink: 0 }}>›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
