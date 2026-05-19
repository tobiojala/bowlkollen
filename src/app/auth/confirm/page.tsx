'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function AuthConfirm() {
  useEffect(() => {
    const supabase = createClient()
    const code = new URLSearchParams(window.location.search).get('code')
    
    if (!code) {
      window.location.href = '/login?error=no-code'
      return
    }

    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (data.session) {
        window.location.href = '/'
      } else {
        console.error('Auth error:', error)
        window.location.href = '/login?error=auth'
      }
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#6b7a99' }}>Loggar in...</div>
    </div>
  )
}
