'use client'

import { useState } from 'react'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()

      if (res.ok) {
        setState('success')
        setEmail('')
      } else {
        setState('error')
        setErrorMsg(data.error ?? 'Något gick fel. Försök igen.')
      }
    } catch {
      setState('error')
      setErrorMsg('Nätverksfel. Försök igen.')
    }
  }

  if (state === 'success') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '20px 24px',
        background: 'rgba(93, 202, 165, 0.12)',
        border: '1px solid rgba(93, 202, 165, 0.3)',
        borderRadius: 16,
        maxWidth: 440,
        margin: '0 auto',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎳</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#5dcaa5', marginBottom: 4 }}>Du är med på listan!</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          Vi hör av oss när Bowlkollen är redo.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        gap: 8,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14,
        padding: 6,
      }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="din@epost.se"
          required
          disabled={state === 'loading'}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: 15,
            padding: '10px 12px',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={state === 'loading' || !email.trim()}
          style={{
            background: '#f5c200',
            color: '#000',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 800,
            cursor: state === 'loading' ? 'not-allowed' : 'pointer',
            opacity: state === 'loading' ? 0.7 : 1,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            letterSpacing: 0.3,
            transition: 'opacity 0.15s',
          }}
        >
          {state === 'loading' ? '...' : 'Håll mig uppdaterad'}
        </button>
      </div>

      {state === 'error' && (
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#e05555' }}>
          {errorMsg}
        </p>
      )}

      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
        Inga spam. Vi skickar bara när det händer något viktigt.
      </p>
    </form>
  )
}
