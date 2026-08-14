'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useSession } from '@/lib/queries'
import NotificationBell from '@/components/NotificationBell'

// The web app's real top nav — persistent bar on desktop, burger below the
// breakpoint. Replaces the mobile-style glass nav + floating bottom tabs.
// Categories map to the Constitution's Five Worlds; evolve the set as we grow.
const LINKS = [
  { label: 'Hem',       href: '/' },
  { label: 'Schema',    href: '/schema' },
  { label: 'Serier',    href: '/divisioner' },
  { label: 'Spelare',   href: '/discover' },
  { label: 'Tävlingar', href: '/tavlingar' },
] as const

// Surfaces that own their chrome (auth flows, captain sub-tools).
const HIDE = ['/intern', '/laguttagning', '/tillganglighet', '/login', '/onboarding', '/auth', '/reset-password']

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
}

export default function WebNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  // Close the mobile panel whenever the route changes.
  useEffect(() => { setOpen(false) }, [pathname])

  if (HIDE.some((h) => pathname.startsWith(h))) return null

  const loggedIn = !!session?.user

  return (
    <>
      <style>{`
        .wn { position: fixed; top: 0; left: 0; right: 0; z-index: 50; height: 64px;
          background: rgba(11,13,16,0.82);
          backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);
          border-bottom: 1px solid rgba(244,245,247,0.07); }
        .wn-inner { max-width: 1160px; margin: 0 auto; height: 64px;
          display: flex; align-items: center; gap: 24px; padding: 0 24px; }
        .wn-mark { flex-shrink: 0; text-decoration: none; color: #f4f5f7;
          font-family: var(--font-display,'Barlow Condensed'),system-ui;
          font-size: 22px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; }
        .wn-links { display: flex; align-items: center; gap: 2px; flex: 1; }
        .wn-link { display: flex; align-items: center; height: 64px; padding: 0 14px;
          font-size: 15px; font-weight: 600; text-decoration: none; position: relative;
          color: rgba(244,245,247,0.72); transition: color 0.15s; }
        .wn-link:hover { color: #f4f5f7; }
        .wn-link[data-active="true"] { color: #f5c200; }
        .wn-link[data-active="true"]::after { content: ''; position: absolute;
          left: 14px; right: 14px; bottom: 0; height: 2px; background: #f5c200; border-radius: 2px; }
        .wn-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; margin-left: auto; }
        .wn-cta { text-decoration: none; font-size: 14px; font-weight: 600;
          color: rgba(244,245,247,0.72); padding: 9px 16px; border-radius: 999px;
          border: 1px solid rgba(244,245,247,0.14); }
        .wn-cta:hover { color: #f4f5f7; }
        .wn-burger { display: none; }

        @media (max-width: 820px) {
          .wn-links, .wn-right { display: none; }
          .wn-burger { display: flex; align-items: center; justify-content: center;
            width: 44px; height: 44px; margin-left: auto; background: none; border: none;
            color: #f4f5f7; cursor: pointer; }
          .wn-panel { position: fixed; top: 64px; left: 0; right: 0; z-index: 49;
            background: rgba(11,13,16,0.97);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(244,245,247,0.07); padding: 8px 12px 14px; }
          .wn-prow { display: flex; align-items: center; height: 52px; padding: 0 14px;
            font-size: 17px; font-weight: 600; text-decoration: none; border-radius: 12px;
            color: rgba(244,245,247,0.82); }
          .wn-prow[data-active="true"] { color: #f5c200; background: rgba(245,194,0,0.08); }
        }
      `}</style>

      <header className="wn">
        <div className="wn-inner">
          <Link href="/" className="wn-mark">Bowlkollen</Link>

          <nav className="wn-links">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="wn-link" data-active={isActive(pathname, l.href)}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="wn-right">
            {loggedIn && <NotificationBell />}
            <Link href={loggedIn ? '/profile' : '/login'} className="wn-cta">
              {loggedIn ? 'Profil' : 'Logga in'}
            </Link>
          </div>

          <button className="wn-burger" aria-label={open ? 'Stäng meny' : 'Öppna meny'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {open && (
        <div className="wn-panel">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="wn-prow" data-active={isActive(pathname, l.href)}>
              {l.label}
            </Link>
          ))}
          <div style={{ height: 1, background: 'rgba(244,245,247,0.07)', margin: '8px 14px' }} />
          <Link href={loggedIn ? '/profile' : '/login'} className="wn-prow">
            {loggedIn ? 'Profil' : 'Logga in'}
          </Link>
        </div>
      )}
    </>
  )
}
