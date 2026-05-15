'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

export default function LoginPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Fel e-post eller losenord')
      setLoading(false)
    } else {
      window.location.href = '/admin'
    }
  }

  const inp = {
    background: C.surface,
    border: '1px solid ' + C.border,
    borderRadius: 10,
    padding: '12px 14px',
    color: C.text,
    fontSize: 14,
    outline: 'none',
    width: '100%',
  } as React.CSSProperties

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 6 }}>
            Bowl<span style={{ color: '#f5c200' }}>kollen</span>
          </div>
          <div style={{ fontSize: 14, color: C.textMuted }}>Logga in for att fortsatta</div>
        </div>

        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {error && (
            <div style={{ background: theme === 'dark' ? '#2a1212' : '#fff0f0', border: '1px solid #ffaaaa', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e05555', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>E-POST</label>
            <input
              style={inp}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="din@epost.se"
              onKeyDown={e => e.key === 'Enter' && login()}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>LOSENORD</label>
            <input
              style={inp}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && login()}
            />
          </div>

          <button
            onClick={login}
            disabled={loading}
            style={{ background: '#f5c200', color: '#1a1400', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>

        </div>
      </div>
    </main>
  )
}
