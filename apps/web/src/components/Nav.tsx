'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import NotificationBell from '@/components/NotificationBell'
import { SchemaNavRecall } from '@/app/schema/_components/SchemaNavRecall'

type NavConfig = {
  backHref: string | null | 'back'
}

function getConfig(pathname: string): NavConfig {
  if (pathname.startsWith('/hallar/'))           return { backHref: '/hallar' }
  if (pathname === '/mer')                       return { backHref: '/' }
  if (pathname === '/oljeprofiler')              return { backHref: '/mer' }
  if (pathname.startsWith('/players/'))          return { backHref: 'back' }
  if (pathname.startsWith('/teams/'))            return { backHref: '/teams' }
  if (pathname.startsWith('/matches/'))          return { backHref: '/schema' }
  if (pathname.startsWith('/schema/atlas'))      return { backHref: '/schema' }
  if (pathname.startsWith('/club/'))             return { backHref: '/teams' }
  if (pathname.startsWith('/compare/teams/'))    return { backHref: null }
  if (pathname.startsWith('/compare/'))          return { backHref: 'back' }
  return { backHref: null }
}

export default function Nav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const hideNav = pathname.includes('/intern') || pathname.includes('/laguttagning') || pathname.includes('/tillganglighet')
  if (hideNav) return null

  const cfg = getConfig(pathname)

  const glass: React.CSSProperties = {
    position: 'absolute', inset: 0, overflow: 'hidden',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    background: 'rgba(14,17,22,0.85)',
  }
  const rim: React.CSSProperties = {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    border: '0.5px solid rgba(255,255,255,0.14)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -0.5px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)',
  }

  const pillR = 22

  return (
    <>
      {/* Subtle gold glow behind the nav area */}
      <div style={{
        position: 'fixed', top: 0,
        left: 'max(0px, calc(50vw - 300px))', right: 'max(0px, calc(50vw - 300px))',
        height: 136,
        background: 'linear-gradient(180deg, rgba(245,194,0,0.07) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 39,
      }} />

      <header style={{
        position: 'fixed', top: 0,
        left: 'max(0px, calc(50vw - 300px))', right: 'max(0px, calc(50vw - 300px))',
        height: 56, zIndex: 40,
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 8,
        pointerEvents: 'none',
      }}>

        {/* ── LEFT: back button or wordmark on home ── */}
        {cfg.backHref === 'back' ? (
          <button
            onClick={() => router.back()}
            style={{
              pointerEvents: 'auto', flexShrink: 0,
              position: 'relative', height: 44, borderRadius: pillR,
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0 14px 0 8px',
              background: 'none', border: 'none', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ ...glass, borderRadius: pillR }} />
            <div style={{ ...rim,   borderRadius: pillR }} />
            <ChevronLeft size={20} color="#f5c200" strokeWidth={2.5} style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ position: 'relative', zIndex: 1, fontSize: 14, fontWeight: 600, color: '#f5c200' }}>
              Tillbaka
            </span>
          </button>
        ) : cfg.backHref ? (
          <Link
            href={cfg.backHref}
            style={{
              pointerEvents: 'auto', flexShrink: 0,
              position: 'relative', height: 44, borderRadius: pillR,
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0 14px 0 8px',
              textDecoration: 'none',
            }}
          >
            <div style={{ ...glass, borderRadius: pillR }} />
            <div style={{ ...rim,   borderRadius: pillR }} />
            <ChevronLeft size={20} color="#f5c200" strokeWidth={2.5} style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ position: 'relative', zIndex: 1, fontSize: 14, fontWeight: 600, color: '#f5c200' }}>
              Tillbaka
            </span>
          </Link>
        ) : null}

        {/* ── RIGHT: notification bell (logged-in only) ── */}
        {user && (
          <div style={{
            pointerEvents: 'auto', flexShrink: 0, marginLeft: 'auto',
            position: 'relative', height: 44, borderRadius: pillR,
            display: 'flex', alignItems: 'center',
            padding: '0 4px',
          }}>
            <div style={{ ...glass, borderRadius: pillR }} />
            <div style={{ ...rim,   borderRadius: pillR }} />
            <NotificationBell />
          </div>
        )}

      </header>

      {pathname === '/schema' && <SchemaNavRecall />}
    </>
  )
}
