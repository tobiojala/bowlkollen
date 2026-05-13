'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const bg = '#10161e'
const surface = '#172030'
const card = '#1c2840'
const border = '#2a3858'
const accent = '#f5c200'
const textMuted = '#6b7a99'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

const login = async () => {
    if (!email || !password) return setError('Fyll i email och losenord')
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    console.log('Login result:', { data, error })
    if (error) {
      setError('Fel: ' + error.message)
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  const inp = {
    background: surface,
    border: '1px solid ' + border,
    borderRadius: 8,
    padding: '11px 14px',
    color: 'white',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  } as React.CSSProperties

  return (
    <main style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 6 }}>
            Bowl<span style={{ color: accent }}>kollen</span>
          </div>
          <div style={{ fontSize: 13, color: textMuted }}>Logga in som admin</div>
        </div>

        <div style={{ background: card, borderRadius: 16, border: '1px solid ' + border, padding: 28 }}>
          {error && (
            <div style={{ background: '#2a1212', border: '1px solid #4a1a1a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff6b6b' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 1, marginBottom: 6, display: 'block' }}>EMAIL</label>
            <input
              style={inp}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="din@email.com"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 1, marginBottom: 6, display: 'block' }}>LOSENORD</label>
            <input
              style={inp}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={login}
            disabled={loading}
            style={{ background: accent, color: '#1a1400', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', width: '100%', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </div>
      </div>
    </main>
  )
}
