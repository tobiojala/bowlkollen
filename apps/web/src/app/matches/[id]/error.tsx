'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  const router = useRouter()
  return (
    <main style={{ minHeight: '60vh', background: '#10161e', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', gap: 12, padding: 24 }}>
      <div style={{ fontSize: 28 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Kunde inte ladda sidan</div>
      <div style={{ fontSize: 12, color: '#6b7a99', textAlign: 'center', maxWidth: 260 }}>
        Kontrollera din anslutning och försök igen.
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={() => router.back()}
          style={{ padding: '9px 20px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Tillbaka
        </button>
        <button onClick={reset}
          style={{ padding: '9px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: '#f5c200', color: '#1a1400', fontSize: 13, fontWeight: 700 }}>
          Försök igen
        </button>
      </div>
    </main>
  )
}
