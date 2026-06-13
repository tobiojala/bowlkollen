'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useColors } from '@/components/ThemeProvider'

export default function LoginPage() {
  const { C } = useColors()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/'
    })
  }, [])

  const signInWithGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' }
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  const signInWithMagicLink = async () => {
    if (!email.trim()) return
    setMagicLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/auth/callback' }
    })
    if (error) setError(error.message)
    else setMagicSent(true)
    setMagicLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
            Bowl<span style={{ color: '#f5c200' }}>kollen</span>
          </div>
          <div style={{ fontSize: 14, color: C.textMuted }}>Logga in for att fortsatta</div>
        </div>

        {/* Google */}
        <button onClick={signInWithGoogle} disabled={googleLoading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '14px 20px', fontSize: 15, fontWeight: 600, color: C.text, cursor: googleLoading ? 'not-allowed' : 'pointer', opacity: googleLoading ? 0.7 : 1, marginBottom: 16 }}>
          {!googleLoading && (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {googleLoading ? 'Loggar in...' : 'Fortsatt med Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 11, color: C.textMuted }}>eller med email</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* Magic link */}
        {!magicSent ? (
          <div style={{ marginBottom: 16 }}>
            <input value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && signInWithMagicLink()}
              type="email" placeholder="din@email.com"
              style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '13px 16px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 8 }}
            />
            <button onClick={signInWithMagicLink} disabled={magicLoading || !email.trim()}
              style={{ width: '100%', background: 'transparent', border: '1px solid ' + C.border, borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 600, color: C.text, cursor: email.trim() ? 'pointer' : 'default', opacity: email.trim() ? 1 : 0.5 }}>
              {magicLoading ? 'Skickar...' : 'Skicka inloggningslank'}
            </button>
          </div>
        ) : (
          <div style={{ background: C.green + '18', border: '1px solid ' + C.green, borderRadius: 12, padding: '16px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.green, marginBottom: 4 }}>Kolla din email!</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Vi skickade en inloggningslank till {email}</div>
          </div>
        )}

        {error && (
          <div style={{ background: '#e05555' + '18', border: '1px solid #e05555', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#e05555', textAlign: 'center', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
          Genom att logga in godkanner du vara{' '}
          <Link href="/terms" style={{ color: C.accent, textDecoration: 'none' }}>anvandarvillkor</Link>
          {' '}och{' '}
          <Link href="/privacy" style={{ color: C.accent, textDecoration: 'none' }}>integritetspolicy</Link>
        </div>

      </div>
    </main>
  )
}
