'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sun, Moon, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'

type NavConfig = {
  logo: boolean
  title: string | null
  backHref: string | null
}

function getConfig(pathname: string): NavConfig {
  if (pathname === '/')          return { logo: true,  title: null,           backHref: null }
  if (pathname === '/schema')    return { logo: false, title: 'Schema',        backHref: null }
  if (pathname === '/league')    return { logo: false, title: 'Serietabell',   backHref: null }
  if (pathname === '/teams')     return { logo: false, title: 'Lag',           backHref: null }
  if (pathname === '/players')   return { logo: false, title: 'Spelare',       backHref: null }
  if (pathname === '/profile')   return { logo: false, title: 'Min profil',    backHref: null }
  if (pathname === '/sllm')      return { logo: false, title: 'SLLM 2026',     backHref: null }
  if (pathname === '/login')     return { logo: false, title: 'Logga in',      backHref: null }
  if (pathname === '/league')    return { logo: false, title: 'Serietabell',   backHref: null }
  if (pathname.startsWith('/players/'))  return { logo: false, title: 'Spelarprofil', backHref: '/players' }
  if (pathname.startsWith('/teams/'))    return { logo: false, title: 'Lag',          backHref: '/teams' }
  if (pathname.startsWith('/matches/'))  return { logo: false, title: 'Match',        backHref: '/schema' }
  if (pathname.startsWith('/club/'))     return { logo: false, title: 'Klubb',        backHref: '/teams' }
  return { logo: true, title: null, backHref: null }
}

export default function Nav() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

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

  const hideNav = pathname.includes('/intern') || pathname.includes('/laguttagning') || pathname.includes('/tillganglighet')
  if (hideNav) return null

  const cfg = getConfig(pathname)
  const avatar = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email || ''
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const navBg = isDark
    ? (scrolled ? 'rgba(8,14,24,0.97)' : 'rgba(8,14,24,0.95)')
    : (scrolled ? 'rgba(245,242,236,0.97)' : 'rgba(245,242,236,0.95)')
  const borderColor = scrolled
    ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
    : 'transparent'
  const mutedColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'
  const iconBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 56,
      background: navBg,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: `0.5px solid ${borderColor}`,
      transition: 'border-color 0.2s, background 0.2s',
      zIndex: 40,
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '0 12px',
    }}>

      {/* Left — logo or back */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {cfg.logo ? (
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: isDark ? '#ffffff' : '#1a2535', letterSpacing: -0.5 }}>
              Bowl<span style={{ color: '#f5c200' }}>kollen</span>
            </span>
          </a>
        ) : cfg.backHref ? (
          <a href={cfg.backHref}
            style={{ display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none', padding: '4px 6px 4px 0', WebkitTapHighlightColor: 'transparent' }}>
            <ChevronLeft size={22} color={isDark ? '#f5c200' : '#1a2535'} strokeWidth={2.5} />
            <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#f5c200' : '#1a2535' }}>Tillbaka</span>
          </a>
        ) : (
          <div />
        )}
      </div>

      {/* Center — page title */}
      <div style={{ textAlign: 'center' }}>
        {cfg.title && (
          <span style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#ffffff' : '#1a2535', letterSpacing: -0.2 }}>
            {cfg.title}
          </span>
        )}
      </div>

      {/* Right — actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
        {/* SLLM pill — only on home */}
        {cfg.logo && (
          <a href="/sllm" style={{
            fontSize: 10, fontWeight: 700, color: '#f5c200',
            background: 'rgba(245,194,0,0.1)', border: '1px solid rgba(245,194,0,0.25)',
            borderRadius: 20, padding: '3px 9px', textDecoration: 'none', letterSpacing: 0.3,
          }}>
            SLLM
          </a>
        )}

        {/* Theme toggle */}
        <button onClick={toggle} style={{
          width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
        }}>
          {isDark ? <Sun size={15} color={mutedColor} /> : <Moon size={15} color={mutedColor} />}
        </button>

        {/* Profile / Login */}
        {user ? (
          <a href="/profile" style={{ textDecoration: 'none', flexShrink: 0 }}>
            {avatar ? (
              <img src={avatar} alt={name} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(245,194,0,0.35)', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,194,0,0.12)', border: '1.5px solid rgba(245,194,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#f5c200' }}>
                {initials}
              </div>
            )}
          </a>
        ) : (
          <a href="/login" style={{
            fontSize: 12, fontWeight: 600, color: mutedColor,
            background: iconBg,
            border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: 20, padding: '6px 12px', textDecoration: 'none',
          }}>
            Logga in
          </a>
        )}
      </div>
    </header>
  )
}
