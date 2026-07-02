'use client'

import Link from 'next/link'
import { COLOR } from '@/lib/brand'
import { useColors } from '@/components/ThemeProvider'

type Colors = ReturnType<typeof useColors>['C']

type Props =
  | { variant: 'loading'; C: Colors }
  | { variant: 'empty'; C: Colors; selectedDivision: { id: number; name: string } | null; onClearDivision: () => void }

export function SeasonStatusScreen(props: Props) {
  const { C } = props

  if (props.variant === 'loading') return (
    <main style={{ height: 'calc(100dvh - 56px)', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      {[80, 120, 60].map((w, i) => (
        <div key={i} style={{ width: w, height: 10, borderRadius: 6, background: 'rgba(244,245,247,0.06)', animation: `pulse 1.4s ${i * 0.2}s infinite alternate ease-in-out` }} />
      ))}
      <style>{`@keyframes pulse { from { opacity: 0.4 } to { opacity: 0.9 } }`}</style>
    </main>
  )

  const { selectedDivision, onClearDivision } = props
  return (
    <main style={{ height: 'calc(100dvh - 56px)', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '0 32px', textAlign: 'center' }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
        {selectedDivision ? `Inga matcher i ${selectedDivision.name} än` : 'Inga matcher att visa just nu'}
      </p>
      <p style={{ fontSize: 13, color: C.textMuted, maxWidth: 280 }}>
        {selectedDivision
          ? 'Den här divisionen har inga schemalagda matcher den här säsongen.'
          : 'Följ en spelare, eller koppla din egen profil, för att se deras matcher här.'}
      </p>
      {selectedDivision ? (
        <button
          onClick={onClearDivision}
          style={{ marginTop: 8, background: COLOR.surface2, color: COLOR.ink, border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Till min säsong
        </button>
      ) : (
        <Link href="/discover" style={{ marginTop: 8, background: COLOR.gold, color: '#1a1400', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Hitta spelare att följa
        </Link>
      )}
    </main>
  )
}
