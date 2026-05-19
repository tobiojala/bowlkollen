'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

export default function ProfilePage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      setLoading(false)
    })
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )

  const avatar = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email
  const email = user?.email
  const hue = email?.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const tc = 'hsl(' + hue + ',50%,45%)'
  const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 16px 48px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Min profil</h1>
          <div style={{ fontSize: 13, color: C.textMuted }}>Hantera ditt konto</div>
        </div>

        {/* User card */}
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {avatar ? (
              <img src={avatar} alt={name} style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid ' + C.border }} />
            ) : (
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: tclo, border: '2px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: tc }}>
                {name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{name}</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>{email}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Inloggad med Google</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: C.surface, borderRadius: 12, border: '1px solid ' + C.border, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 22 }}>🎳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Claima spelarprofil</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>Länka ditt konto till din spelarprofil</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accent + '18', borderRadius: 8, padding: '4px 10px' }}>Kom snart</div>
            </div>
            <div style={{ background: C.surface, borderRadius: 12, border: '1px solid ' + C.border, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 22 }}>🏆</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Claima klubbsida</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>Hantera din klubbs sida på Bowlkollen</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accent + '18', borderRadius: 8, padding: '4px 10px' }}>Kom snart</div>
            </div>
          </div>
        </div>

        {/* Account actions */}
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, overflow: 'hidden' }}>
          <button onClick={signOut}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ fontSize: 16 }}>🚪</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e05555' }}>Logga ut</div>
          </button>
        </div>

      </div>
    </main>
  )
}
