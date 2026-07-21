'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useColors } from '@/components/ThemeProvider'

export default function ResetPasswordPage() {
  const { C, isDark } = useColors()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Parse hash from URL manually
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (accessToken && type === 'recovery') {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        }).then(({ error }) => {
          if (!error) setReady(true)
          else setError('Ogiltig eller utgangen aterstallningslank')
        })
        return
      }
    }

    // Fallback: listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const updatePassword = async () => {
    if (!password) return setError('Ange ett nytt losenord')
    if (password !== confirm) return setError('Losenorden matchar inte')
    if (password.length < 6) return setError('Losenordet maste vara minst 6 tecken')
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('Fel: ' + error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => { window.location.href = '/admin' }, 2000)
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
          <div style={{ fontSize: 14, color: C.textMuted }}>Skapa nytt losenord</div>
        </div>

        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {success && (
            <div style={{ background: isDark ? '#122a1a' : '#f0fff4', border: '1px solid #aaffcc', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: C.green, fontWeight: 600, textAlign: 'center' }}>
              Losenord uppdaterat! Omdirigerar till admin...
            </div>
          )}

          {error && (
            <div style={{ background: isDark ? '#2a1212' : '#fff0f0', border: '1px solid #ffaaaa', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e05555', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {!ready && !success && !error && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 8 }}>Verifierar aterstallningslank...</div>
              <div style={{ width: 32, height: 32, border: '3px solid ' + C.border, borderTop: '3px solid #f5c200', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {ready && !success && (
            <>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>NYTT LOSENORD</label>
                <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minst 6 tecken" onKeyDown={e => e.key === 'Enter' && updatePassword()} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>BEKRAFTA LOSENORD</label>
                <input style={inp} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Upprepa losenordet" onKeyDown={e => e.key === 'Enter' && updatePassword()} />
              </div>
              <button onClick={updatePassword} disabled={loading} style={{ background: '#f5c200', color: '#1a1400', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Sparar...' : 'Uppdatera losenord'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
