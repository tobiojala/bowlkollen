'use client'

import Link from 'next/link'
import { COLOR } from '@/lib/brand'

type Props = {
  selectedDivision: { id: number; name: string } | null
  isPersonalized: boolean
  onClearDivision: () => void
}

const wrapStyle = {
  margin: '14px 20px 0', padding: '10px 14px', borderRadius: 12,
  background: COLOR.surface2, display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', gap: 10,
} as const

export function ScopeBanner({ selectedDivision, isPersonalized, onClearDivision }: Props) {
  if (selectedDivision) return (
    <div style={wrapStyle}>
      <span style={{ fontSize: 12, color: COLOR.ink3 }}>
        Du bläddrar i <span style={{ color: COLOR.ink, fontWeight: 700 }}>{selectedDivision.name}</span>
      </span>
      <button
        onClick={onClearDivision}
        style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: COLOR.ink, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        Till min säsong →
      </button>
    </div>
  )

  if (isPersonalized) return null

  return (
    <div style={wrapStyle}>
      <span style={{ fontSize: 12, color: COLOR.ink3 }}>
        Visar <span style={{ color: COLOR.gold, fontWeight: 700 }}>Elitserien</span> — följ en spelare för din egen säsong
      </span>
      <Link href="/discover" style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: COLOR.ink, textDecoration: 'none' }}>
        Hitta →
      </Link>
    </div>
  )
}
