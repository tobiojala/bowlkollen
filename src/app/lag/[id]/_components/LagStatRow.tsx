'use client'

import { COLOR, FONT, SPACE } from '@/lib/brand'
import type { FormResult } from '@/lib/types'

type Standing = { rank: number; total: number; points: number; played: number }

type Props = {
  standing:    Standing | null
  form:        FormResult[]
  historical?: boolean
}

function Stat({ value, label, tone = COLOR.ink }: { value: string; label: string; tone?: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: FONT.display, fontSize: 26, fontWeight: 800, letterSpacing: '-0.01em', color: tone, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: COLOR.ink3, marginTop: 5 }}>
        {label}
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, alignSelf: 'stretch', background: COLOR.hairline }} />
}

/** One glanceable row — placering / poäng / form — instead of three
 * disconnected lines. The social-profile "posts · followers · following"
 * rhythm: number first, label under it, always. */
export function LagStatRow({ standing, form, historical = false }: Props) {
  if (!standing) return null

  const wins   = form.filter(r => r === 'W').length
  const losses = form.filter(r => r === 'L').length
  const formValue = form.length > 0 ? `${wins}-${form.length - wins - losses}-${losses}` : '–'
  const tone = historical ? COLOR.ink2 : COLOR.ink

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: SPACE[6] }}>
      <Stat value={`${standing.rank}/${standing.total}`} label="PLACERING" tone={tone} />
      <Divider />
      <Stat value={String(standing.points)} label="POÄNG" tone={tone} />
      <Divider />
      <Stat value={formValue} label="FORM · 5" tone={tone} />
    </div>
  )
}
