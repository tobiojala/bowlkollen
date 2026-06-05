'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <main style={{ minHeight: '100vh', background: '#10161e', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', gap: 16, padding: 24 }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Något gick fel</div>
      <div style={{ fontSize: 13, color: '#6b7a99', textAlign: 'center', maxWidth: 280 }}>
        Sidan kunde inte laddas. Försök igen eller gå tillbaka.
      </div>
      <button onClick={reset}
        style={{ marginTop: 8, padding: '11px 28px', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: '#f5c200', color: '#1a1400', fontSize: 14, fontWeight: 700 }}>
        Försök igen
      </button>
    </main>
  )
}
