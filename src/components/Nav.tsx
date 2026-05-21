'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function Nav() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const avatar = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email || ''
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'IN'

  // Hide nav on intern/laguttagning/tillganglighet pages
  const hideNav = pathname.includes('/intern') || pathname.includes('/laguttagning') || pathname.includes('/tillganglighet')
  if (hideNav) return null

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 56,
      background: scrolled ? 'rgba(8,14,24,0.97)' : 'rgba(8,14,24,0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: scrolled ? '0.5px solid rgba(255,255,255,0.08)' : '0.5px solid transparent',
      transition: 'border-color 0.2s, background 0.2s',
      zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      {/* Logo */}
      <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: -0.5 }}>
          Bowl<span style={{ color: '#f5c200' }}>kollen</span>
        </span>
      </a>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* SLLM pill */}
        <a href="/sllm" style={{
          fontSize: 11, fontWeight: 700, color: '#f5c200',
          background: 'rgba(245,194,0,0.1)', border: '1px solid rgba(245,194,0,0.25)',
          borderRadius: 20, padding: '4px 10px', textDecoration: 'none',
          letterSpacing: 0.3,
        }}>
          SLLM 2026
        </a>

        {/* Profile / Login */}
        {user ? (
          <a href="/profile" style={{ textDecoration: 'none' }}>
            {avatar ? (
              <img src={avatar} alt={name} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(245,194,0,0.35)', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,194,0,0.12)', border: '1.5px solid rgba(245,194,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#f5c200' }}>
                {initials}
              </div>
            )}
          </a>
        ) : (
          <a href="/login" style={{
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '6px 14px', textDecoration: 'none',
          }}>
            Logga in
          </a>
        )}
      </div>
    </header>
  )
}
