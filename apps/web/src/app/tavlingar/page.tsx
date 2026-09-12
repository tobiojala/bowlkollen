'use client'

import { Construction } from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'

// Tävlingar is being rebuilt (curated list + BITS results + bowlres.se
// partnership). Until it's ready the tab shows a clean under-construction state
// rather than a half-finished list.
export default function TavlingarPage() {
  const { C } = useColors()
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ maxWidth: 380, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,194,0,0.12)', border: '1px solid rgba(245,194,0,0.28)' }}>
          <Construction size={30} color={C.accent} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 10px' }}>Tävlingar byggs</h1>
        <p style={{ fontSize: 16, lineHeight: 1.5, color: C.textMuted, margin: 0 }}>
          Den här delen är under uppbyggnad. Snart kan du följa tävlingar i Sverige och se officiella resultat här.
        </p>
      </div>
    </main>
  )
}
