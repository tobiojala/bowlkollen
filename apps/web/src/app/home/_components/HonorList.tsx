'use client'

import Link from 'next/link'
import { Crown } from 'lucide-react'
import type { HonorEntry } from '@/app/home/types'
import { HC } from './tokens'

/** Week's best single games — the gold moment of the feed. */
export default function HonorList({ honor }: { honor: HonorEntry[] }) {
  if (!honor.length) return null
  const top = honor.slice(0, 6)

  return (
    <div style={{ padding: '32px 20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: HC.INK3, marginBottom: 12 }}>
        VECKANS BÄSTA SERIER
      </div>
      <div style={{ background: HC.SURFACE, borderRadius: 16, overflow: 'hidden' }}>
        {top.map((h, i) => {
          const perfect = h.score >= 300
          const elite   = h.score >= 250
          return (
            <Link key={`${h.playerName}-${i}`} href={`/matches/${h.matchId}`}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', textDecoration: 'none',
                borderTop: i > 0 ? `1px solid ${HC.HAIRLINE}` : 'none' }}>
              <span style={{ width: 18, fontSize: 13, fontWeight: 800, color: i === 0 ? HC.GOLD : HC.INK4,
                fontVariantNumeric: 'tabular-nums', textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: HC.INK,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.playerName}</div>
                {h.seriesTotal && (
                  <div style={{ fontSize: 11, color: HC.INK3, marginTop: 2 }}>serie {h.seriesTotal}</div>
                )}
              </div>
              {perfect && <Crown size={15} color={HC.GOLD} fill={HC.GOLD} style={{ flexShrink: 0 }} />}
              <span style={{ flexShrink: 0, fontSize: 20, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                color: elite ? HC.GOLD : HC.INK }}>{h.score}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
