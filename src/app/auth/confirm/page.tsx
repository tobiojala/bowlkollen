'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function AuthConfirm() {
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/'
      } else {
        // Handle the hash fragment from OAuth
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            window.location.href = '/'
          }
        })
      }
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: '#6b7a99', fontSize: 14 }}>Loggar in...</div>
    </div>
  )
}
